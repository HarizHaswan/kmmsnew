const FeeTemplate = require("../models/FeeTemplate");
const Invoice = require("../models/Invoice");
const Student = require("../models/Student");
const { createNotification } = require("../../utils/notificationHelper");

const MONTHLY_TYPES = new Set(["monthly"]);
const COMPULSORY_TYPES = new Set(["monthly", "enrollment"]);

const FEE_CATEGORY_LABELS = {
  monthly: "Monthly Fees",
  enrollment: "Enrollment Fees",
  material: "Material Fees",
  custom: "Custom Fees",
};

function normalizeTemplateForAutomation(template) {
  const feeType = String(template.feeType || "").toLowerCase();
  return {
    ...template,
    feeType,
    appliesToAllStudents:
      COMPULSORY_TYPES.has(feeType) || Boolean(template.appliesToAllStudents),
    autoGenerate:
      COMPULSORY_TYPES.has(feeType) || Boolean(template.autoGenerate),
  };
}

function getMonthPeriodKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Returns true if the current month falls within the template's
 * startMonth–endMonth range (inclusive). If no range is set, always returns true.
 */
function isWithinActivePeriod(template) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth(); // 0-indexed

  if (template.startMonth) {
    const start = new Date(template.startMonth);
    if (
      nowYear < start.getFullYear() ||
      (nowYear === start.getFullYear() && nowMonth < start.getMonth())
    ) {
      return false;
    }
  }

  if (template.endMonth) {
    const end = new Date(template.endMonth);
    if (
      nowYear > end.getFullYear() ||
      (nowYear === end.getFullYear() && nowMonth > end.getMonth())
    ) {
      return false;
    }
  }

  return true;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildDueDate(template, student) {
  const now = new Date();

  if (template.feeType === "monthly") {
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const maxDay = getDaysInMonth(year, monthIndex);
    const dueDay = Math.min(Number(template.dueDay) || 5, maxDay);
    return new Date(year, monthIndex, dueDay, 23, 59, 59, 999);
  }

  if (template.feeType === "enrollment" && student?.registrationDate) {
    const registrationDate = new Date(student.registrationDate);
    registrationDate.setHours(23, 59, 59, 999);
    return registrationDate;
  }

  now.setHours(23, 59, 59, 999);
  return now;
}

function buildPeriodKey(template, student) {
  if (template.feeType === "monthly") {
    return getMonthPeriodKey();
  }

  if (template.feeType === "enrollment") {
    return `enrollment-${student._id}`;
  }

  return `one-time-${template._id}`;
}

async function getTargetStudents(template, studentIds) {
  const query = { status: "active" };
  const requestedStudentIds =
    Array.isArray(studentIds) && studentIds.length > 0 ? studentIds : null;

  if (template.appliesToAllStudents || COMPULSORY_TYPES.has(template.feeType)) {
    if (requestedStudentIds) {
      query._id = { $in: requestedStudentIds };
    }
    return Student.find(query).select("_id parentId registrationDate");
  }

  if (!Array.isArray(template.targetStudentIds) || template.targetStudentIds.length === 0) {
    return [];
  }

  const targetIds = template.targetStudentIds.map((item) => String(item));
  const finalIds = requestedStudentIds
    ? requestedStudentIds.filter((item) => targetIds.includes(String(item)))
    : targetIds;

  if (finalIds.length === 0) {
    return [];
  }

  query._id = { $in: finalIds };
  return Student.find(query).select("_id parentId registrationDate");
}

async function notifyParentForInvoice(invoice, student, triggeredBy) {
  if (!student?.parentId) {
    return;
  }

  try {
    await createNotification({
      recipientId: student.parentId,
      type: "invoice",
      title: "Pending Kindergarten Fee",
      body: `You have a new pending fee: ${invoice.feeItem || invoice.category || "Invoice"} (RM${invoice.amount || 0}).`,
      data: { invoiceId: invoice._id },
      createdBy: triggeredBy || null,
    });
  } catch (error) {
    console.error("Fee automation notification error:", error);
  }
}

async function createOrRefreshInvoice({
  template,
  student,
  refreshExisting = false,
  triggeredBy = null,
}) {
  const periodKey = buildPeriodKey(template, student);
  const dueDate = buildDueDate(template, student);
  const invoicePayload = {
    studentId: student._id,
    amount: Number(template.amount) || 0,
    category: FEE_CATEGORY_LABELS[template.feeType] || "Custom Fees",
    feeItem: template.name,
    feeType: template.feeType,
    feeTemplateId: template._id,
    dueDate,
    periodKey,
    isAutomated: Boolean(template.autoGenerate),
  };

  const existingInvoice = await Invoice.findOne({
    studentId: student._id,
    feeTemplateId: template._id,
    periodKey,
  });

  if (existingInvoice) {
    if (refreshExisting && existingInvoice.status === "unpaid") {
      existingInvoice.amount = invoicePayload.amount;
      existingInvoice.category = invoicePayload.category;
      existingInvoice.feeItem = invoicePayload.feeItem;
      existingInvoice.feeType = invoicePayload.feeType;
      existingInvoice.dueDate = invoicePayload.dueDate;
      existingInvoice.isAutomated = invoicePayload.isAutomated;
      await existingInvoice.save();
      return { invoice: existingInvoice, created: false, updated: true };
    }

    return { invoice: existingInvoice, created: false, updated: false };
  }

  const invoice = await Invoice.create(invoicePayload);
  await notifyParentForInvoice(invoice, student, triggeredBy);
  return { invoice, created: true, updated: false };
}

async function syncFeeTemplates({
  templateIds,
  studentIds,
  refreshExisting = false,
  triggeredBy = null,
} = {}) {
  const query = { isActive: true };

  if (Array.isArray(templateIds) && templateIds.length > 0) {
    query._id = { $in: templateIds };
  }

  const feeTemplates = await FeeTemplate.find(query).lean();
  const normalizedTemplates = feeTemplates.map(normalizeTemplateForAutomation);

  const summary = {
    templatesProcessed: normalizedTemplates.length,
    invoicesCreated: 0,
    invoicesUpdated: 0,
  };

  for (const template of normalizedTemplates) {
    // Skip monthly templates that are outside their configured active period
    if (template.feeType === "monthly" && !isWithinActivePeriod(template)) {
      continue;
    }

    const targets = await getTargetStudents(template, studentIds);

    for (const student of targets) {
      const result = await createOrRefreshInvoice({
        template,
        student,
        refreshExisting,
        triggeredBy,
      });

      if (result.created) {
        summary.invoicesCreated += 1;
      }

      if (result.updated) {
        summary.invoicesUpdated += 1;
      }
    }
  }

  return summary;
}

let schedulerStarted = false;

function startFeeAutomationScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  const runSync = async () => {
    try {
      await syncFeeTemplates();
    } catch (error) {
      console.error("Fee automation scheduler error:", error);
    }
  };

  runSync();
  setInterval(runSync, 6 * 60 * 60 * 1000);
}

module.exports = {
  FEE_CATEGORY_LABELS,
  syncFeeTemplates,
  startFeeAutomationScheduler,
};
