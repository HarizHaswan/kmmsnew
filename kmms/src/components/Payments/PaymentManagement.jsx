import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { createInvoice, getInvoices } from "../../api/invoices";
import {
  createPayment,
  getPayments,
  uploadPaymentReceipt,
  verifyPayment,
  rejectPayment,
} from "../../api/payments";
import { getStudents } from "../../api/students";
import { getClasses } from "../../api/classes";
import {
  createFeeTemplate,
  deleteFeeTemplate,
  getFeeTemplates,
  updateFeeTemplate,
} from "../../api/feeTemplates";
import { downloadFeeReceiptPdf, downloadInvoiceBillingPdf } from "../../utils/paymentReceiptPdf";

const DEFAULT_INVOICE_FORM = {
  studentId: "",
  feeItem: "",
  amount: "",
  category: "Custom Fees",
  dueDate: "",
};

const DEFAULT_PAYMENT_FORM = {
  amountPaid: "",
  method: "Cash",
  note: "",
};

const DEFAULT_PARENT_PAY_FORM = {
  amountPaid: "",
  receipt: null,
};

const DEFAULT_FEE_FORM = {
  name: "",
  feeType: "monthly",
  amount: "",
  description: "",
  dueDay: 5,
  isActive: true,
  targetStudentIds: [],
  startMonth: "",
  endMonth: "",
};

const FEE_TYPE_META = {
  monthly: {
    label: "Monthly Fees",
    chipClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Compulsory and automatically created every month for all active students.",
  },
  enrollment: {
    label: "Enrollment Fees",
    chipClass: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Compulsory one-time fee automatically assigned to every active student.",
  },
  material: {
    label: "Material Fees",
    chipClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Optional fee you can assign only to selected students.",
  },
  custom: {
    label: "Custom Fees",
    chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Optional one-off fee for students you choose.",
  },
};

const MANUAL_CATEGORY_OPTIONS = [
  "Monthly Fees",
  "Enrollment Fees",
  "Material Fees",
  "Custom Fees",
];

const STATUS_META = {
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800",
  },
  partial: {
    label: "Partial",
    className: "bg-yellow-100 text-yellow-800",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-red-100 text-red-800",
  },
  "no-fees": {
    label: "No Fees",
    className: "bg-gray-100 text-gray-700",
  },
};

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const getStudentLifecycleStatus = (student) =>
  String(student?.status || "active").toLowerCase();

const formatStudentLifecycleStatus = (status) => {
  const normalized = String(status || "active").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const loadPaymentData = async ({ isAdmin }) => {
  const requests = [getInvoices(), getPayments(), getStudents()];

  if (isAdmin) {
    requests.push(getClasses(), getFeeTemplates());
  }

  const results = await Promise.all(requests);

  return {
    invoiceData: results[0] || [],
    paymentData: results[1] || [],
    studentData: results[2] || [],
    adminClassData: isAdmin ? results[3] || [] : [],
    adminTemplateData: isAdmin ? results[4] || [] : [],
  };
};

const PaymentManagement = ({ userId, role, user }) => {
  const normalizedRole = String(role || "").toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const isParentRole = normalizedRole === "parent";

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeTemplates, setFeeTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [classStatusView, setClassStatusView] = useState("active");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showParentPayModal, setShowParentPayModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showBillingPreview, setShowBillingPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showConsolidatedPreview, setShowConsolidatedPreview] = useState(false);
  const [consolidatedPreviewInvoices, setConsolidatedPreviewInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedConsolidatedInvoices, setSelectedConsolidatedInvoices] = useState([]);
  const [adminInvoiceFilter, setAdminInvoiceFilter] = useState("all");
  const [adminInvoiceSearch, setAdminInvoiceSearch] = useState("");
  const [adminInvoicePage, setAdminInvoicePage] = useState(1);
  const [adminInvoiceMonth, setAdminInvoiceMonth] = useState("all");
  const [classStatusPage, setClassStatusPage] = useState(1);
  const [classStatusMonth, setClassStatusMonth] = useState("all");
  const [editingFeeTemplateId, setEditingFeeTemplateId] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState(DEFAULT_INVOICE_FORM);
  const [paymentForm, setPaymentForm] = useState(DEFAULT_PAYMENT_FORM);
  const [parentPayForm, setParentPayForm] = useState(DEFAULT_PARENT_PAY_FORM);
  const [feeForm, setFeeForm] = useState(DEFAULT_FEE_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runInitialLoad = async () => {
      setLoading(true);

      try {
        const loaded = await loadPaymentData({ isAdmin });
        if (!isMounted) return;

        if (isParentRole) {
          const childIds = loaded.studentData.map((student) => getIdValue(student));

          setInvoices(
            loaded.invoiceData.filter((invoice) =>
              childIds.includes(getIdValue(invoice.studentId))
            )
          );
          setPayments(
            loaded.paymentData.filter((payment) =>
              childIds.includes(getIdValue(payment.studentId))
            )
          );
          setStudents(loaded.studentData);
        } else {
          setInvoices(loaded.invoiceData);
          setPayments(loaded.paymentData);
          setStudents(loaded.studentData);
        }

        setClasses(loaded.adminClassData);
        setFeeTemplates(loaded.adminTemplateData);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load payment data", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runInitialLoad();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, isParentRole, normalizedRole, userId]);

  useEffect(() => {
    if (
      selectedClassFilter !== "all" &&
      !classes.some((item) => getIdValue(item) === selectedClassFilter)
    ) {
      setSelectedClassFilter("all");
    }
  }, [classes, selectedClassFilter]);

  const getClassLabel = (classValue) => {
    const classId = getIdValue(classValue);
    const classRecord =
      (typeof classValue === "object" && classValue?.className && classValue) ||
      classes.find((item) => getIdValue(item) === classId);

    if (!classRecord) return "Unassigned Class";
    if (classRecord.yearGroup) {
      return `${classRecord.className} • ${classRecord.yearGroup} Years`;
    }
    return classRecord.className || "Unassigned Class";
  };

  const getStudentName = (studentValue) => {
    if (studentValue?.name) return studentValue.name;

    const studentId = getIdValue(studentValue);
    const student = students.find((item) => getIdValue(item) === studentId);
    return student?.name || "Unknown Student";
  };

  const getPaymentsForInvoice = (invoiceId, extraPayment = null) => {
    const list = payments.filter(
      (payment) => getIdValue(payment.invoiceId) === String(invoiceId)
    );

    if (
      extraPayment &&
      !list.some((payment) => getIdValue(payment) === getIdValue(extraPayment))
    ) {
      return [...list, extraPayment];
    }

    return list;
  };

  const getInvoiceBalance = (invoice) => {
    const totalPaid = getPaymentsForInvoice(invoice._id).reduce(
      (sum, payment) => sum + Number(payment.amountPaid || 0),
      0
    );
    return Math.max(0, Number(invoice.amount || 0) - totalPaid);
  };

  const getTemplateMeta = (feeType) =>
    FEE_TYPE_META[String(feeType || "").toLowerCase()] || FEE_TYPE_META.custom;

  const openFeeModal = (template = null) => {
    if (template) {
      setEditingFeeTemplateId(template._id);
      setFeeForm({
        name: template.name || "",
        feeType: template.feeType || "monthly",
        amount: template.amount ?? "",
        description: template.description || "",
        dueDay: template.dueDay || 5,
        isActive: template.isActive !== false,
        targetStudentIds: Array.isArray(template.targetStudentIds)
          ? template.targetStudentIds.map((student) => getIdValue(student))
          : [],
        startMonth: template.startMonth
          ? new Date(template.startMonth).toISOString().slice(0, 7)
          : "",
        endMonth: template.endMonth
          ? new Date(template.endMonth).toISOString().slice(0, 7)
          : "",
      });
    } else {
      setEditingFeeTemplateId(null);
      setFeeForm(DEFAULT_FEE_FORM);
    }

    setShowFeeModal(true);
  };

  const closeFeeModal = () => {
    setShowFeeModal(false);
    setEditingFeeTemplateId(null);
    setFeeForm(DEFAULT_FEE_FORM);
  };

  const applyLoadedData = ({
    invoiceData,
    paymentData,
    studentData,
    adminClassData,
    adminTemplateData,
  }) => {
    if (isParentRole) {
      const childIds = studentData.map((student) => getIdValue(student));

      setInvoices(
        invoiceData.filter((invoice) =>
          childIds.includes(getIdValue(invoice.studentId))
        )
      );
      setPayments(
        paymentData.filter((payment) =>
          childIds.includes(getIdValue(payment.studentId))
        )
      );
      setStudents(studentData);
    } else {
      setInvoices(invoiceData);
      setPayments(paymentData);
      setStudents(studentData);
    }

    setClasses(adminClassData);
    setFeeTemplates(adminTemplateData);
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const loaded = await loadPaymentData({ isAdmin });
      applyLoadedData(loaded);
    } catch (error) {
      console.error("Failed to load payment data", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoiceReceiptPdf = (invoice, payLines) => {
    downloadFeeReceiptPdf({
      payerName: user?.name || "Parent / Guardian",
      studentName: getStudentName(invoice.studentId),
      invoice,
      payments: payLines,
    });
  };

  const handleCreateInvoice = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    try {
      await createInvoice({
        studentId: invoiceForm.studentId,
        feeItem: invoiceForm.feeItem || invoiceForm.category,
        amount: Number(invoiceForm.amount),
        category: invoiceForm.category,
        feeType: "manual",
        dueDate: invoiceForm.dueDate || undefined,
      });

      setShowInvoiceModal(false);
      setInvoiceForm(DEFAULT_INVOICE_FORM);
      await fetchData();
    } catch (error) {
      alert("Failed to create invoice");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    try {
      await createPayment({
        invoiceId: selectedInvoice._id,
        studentId: getIdValue(selectedInvoice.studentId),
        amountPaid: Number(paymentForm.amountPaid),
        method: paymentForm.method,
        note: paymentForm.note,
      });

      setShowPaymentModal(false);
      setPaymentForm(DEFAULT_PAYMENT_FORM);
      await fetchData();
    } catch (error) {
      alert("Failed to record payment");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Opens pay modal for a single invoice (admin flow)
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      ...DEFAULT_PAYMENT_FORM,
      amountPaid: getInvoiceBalance(invoice),
    });
    setShowPaymentModal(true);
  };

  // Opens parent pay modal — accepts an array of outstanding invoices (consolidated)
  const openParentPayModal = (invoiceList) => {
    const list = Array.isArray(invoiceList) ? invoiceList : [invoiceList];
    const totalOutstanding = list.reduce(
      (sum, inv) => sum + getInvoiceBalance(inv),
      0
    );
    setSelectedConsolidatedInvoices(list);
    setSelectedInvoice(list[0]); // keep for legacy compat
    setParentPayForm({ amountPaid: totalOutstanding, receipt: null });
    setShowParentPayModal(true);
  };

  const handleParentPaySubmit = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    let receiptUrl = null;

    try {
      if (parentPayForm.receipt) {
        const formData = new FormData();
        formData.append("file", parentPayForm.receipt);
        const uploadResult = await uploadPaymentReceipt(formData);
        receiptUrl = uploadResult.url;
      }

      const totalAmount = Number(parentPayForm.amountPaid);
      const invoicesToPay = selectedConsolidatedInvoices.length > 0
        ? selectedConsolidatedInvoices
        : [selectedInvoice];

      // Distribute payment across invoices oldest-first
      let remaining = totalAmount;
      let lastPayment = null;
      for (const inv of invoicesToPay) {
        if (remaining <= 0) break;
        const balance = getInvoiceBalance(inv);
        const toPay = Math.min(remaining, balance);
        if (toPay <= 0) continue;
        lastPayment = await createPayment({
          invoiceId: inv._id,
          studentId: getIdValue(inv.studentId),
          amountPaid: toPay,
          method: "Bank Transfer",
          note: "Parent Payment - Pending Admin Verification",
          receiptUrl,
        });
        remaining -= toPay;
      }

      setShowParentPayModal(false);
      setParentPayForm(DEFAULT_PARENT_PAY_FORM);
      setSelectedConsolidatedInvoices([]);
      await fetchData();
    } catch (error) {
      alert("Failed to submit payment");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFeeTypeChange = (feeType) => {
    const isCompulsory = feeType === "monthly" || feeType === "enrollment";

    setFeeForm((current) => ({
      ...current,
      feeType,
      dueDay: feeType === "monthly" ? current.dueDay || 5 : 5,
      targetStudentIds: isCompulsory ? [] : current.targetStudentIds,
    }));
  };

  const handleToggleFeeStudent = (studentId) => {
    setFeeForm((current) => ({
      ...current,
      targetStudentIds: current.targetStudentIds.includes(studentId)
        ? current.targetStudentIds.filter((id) => id !== studentId)
        : [...current.targetStudentIds, studentId],
    }));
  };

  const handleFeeSubmit = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    const isCompulsory =
      feeForm.feeType === "monthly" || feeForm.feeType === "enrollment";

    if (!isCompulsory && feeForm.targetStudentIds.length === 0) {
      alert("Please choose at least one student for material or custom fees.");
      setFormSubmitting(false);
      return;
    }

    const payload = {
      name: feeForm.name.trim(),
      feeType: feeForm.feeType,
      amount: Number(feeForm.amount),
      description: feeForm.description.trim(),
      dueDay: feeForm.feeType === "monthly" ? Number(feeForm.dueDay) || 5 : 5,
      isActive: feeForm.isActive,
      appliesToAllStudents: isCompulsory,
      autoGenerate: isCompulsory,
      targetStudentIds: isCompulsory ? [] : feeForm.targetStudentIds,
      startMonth: feeForm.feeType === "monthly" && feeForm.startMonth
        ? new Date(feeForm.startMonth + "-01").toISOString()
        : null,
      endMonth: feeForm.feeType === "monthly" && feeForm.endMonth
        ? new Date(feeForm.endMonth + "-01").toISOString()
        : null,
    };

    try {
      if (editingFeeTemplateId) {
        await updateFeeTemplate(editingFeeTemplateId, payload);
      } else {
        await createFeeTemplate(payload);
      }

      closeFeeModal();
      await fetchData();
    } catch (error) {
      alert("Failed to save fee setup");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteFeeTemplate = async (templateId) => {
    const confirmed = window.confirm(
      "Delete this fee setup? Any unpaid or partial invoices from this fee will be cleared from outstanding balances."
    );

    if (!confirmed) return;

    try {
      await deleteFeeTemplate(templateId);
      await fetchData();
    } catch (error) {
      alert("Failed to delete fee setup");
    }
  };

  const selectedClassStudents =
    isAdmin && selectedClassFilter !== "all"
      ? students.filter(
          (student) => getIdValue(student.classId) === selectedClassFilter
        )
      : students;

  const selectedClassStudentIds = selectedClassStudents.map((student) =>
    getIdValue(student)
  );

  const summaryInvoices =
    isAdmin && selectedClassFilter !== "all"
      ? invoices.filter((invoice) =>
          selectedClassStudentIds.includes(getIdValue(invoice.studentId))
        )
      : invoices;

  const summaryPayments =
    isAdmin && selectedClassFilter !== "all"
      ? payments.filter((payment) =>
          selectedClassStudentIds.includes(getIdValue(payment.studentId))
        )
      : payments;

  const displayedInvoices =
    isAdmin && selectedClassFilter !== "all"
      ? invoices.filter((invoice) =>
          selectedClassStudentIds.includes(getIdValue(invoice.studentId))
        )
      : invoices;

  const totalInvoiced = summaryInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0
  );
  const totalPaid = summaryPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );
  const totalPending = Math.max(0, totalInvoiced - totalPaid);
  const summaryScopeLabel =
    isAdmin && selectedClassFilter !== "all"
      ? getClassLabel(
          classes.find((classItem) => getIdValue(classItem) === selectedClassFilter)
        )
      : "All Classes";

  const sortedClasses = [...classes].sort((left, right) => {
    const leftYear = Number(left.yearGroup || 0);
    const rightYear = Number(right.yearGroup || 0);
    if (leftYear !== rightYear) return leftYear - rightYear;
    return String(left.className || "").localeCompare(String(right.className || ""));
  });

  const sortedStudents = [...students].sort((left, right) => {
    const classCompare = getClassLabel(left.classId).localeCompare(
      getClassLabel(right.classId)
    );
    if (classCompare !== 0) return classCompare;
    return String(left.name || "").localeCompare(String(right.name || ""));
  });

  const activeClassStatusStudents = sortedStudents.filter(
    (student) => getStudentLifecycleStatus(student) === "active"
  );

  const historyClassStatusStudents = sortedStudents.filter(
    (student) => getStudentLifecycleStatus(student) !== "active"
  );

  const classStatusSourceStudents =
    classStatusView === "history"
      ? historyClassStatusStudents
      : activeClassStatusStudents;

  const classStatusRows = isAdmin
    ? classStatusSourceStudents
        .filter((student) => {
          if (selectedClassFilter === "all") return true;
          return getIdValue(student.classId) === selectedClassFilter;
        })
        .map((student) => {
          const studentId = getIdValue(student);
          const studentInvoices = invoices.filter(
            (invoice) => getIdValue(invoice.studentId) === studentId
          );
          const studentPayments = payments.filter(
            (payment) => getIdValue(payment.studentId) === studentId
          );
          const billed = studentInvoices.reduce(
            (sum, invoice) => sum + Number(invoice.amount || 0),
            0
          );
          const paid = studentPayments.reduce(
            (sum, payment) => sum + Number(payment.amountPaid || 0),
            0
          );
          const outstanding = Math.max(0, billed - paid);
          const unpaidInvoices = studentInvoices.filter(
            (invoice) => invoice.status !== "paid"
          );
          const latestDue = [...unpaidInvoices].sort(
            (left, right) =>
              new Date(left.dueDate || left.createdAt) -
              new Date(right.dueDate || right.createdAt)
          )[0];

          let paymentStatus = "no-fees";
          if (studentInvoices.length > 0) {
            if (
              outstanding <= 0 &&
              studentInvoices.every((invoice) => invoice.status === "paid")
            ) {
              paymentStatus = "paid";
            } else if (
              paid > 0 ||
              studentInvoices.some((invoice) => invoice.status === "partial")
            ) {
              paymentStatus = "partial";
            } else {
              paymentStatus = "unpaid";
            }
          }

          return {
            studentId,
            studentName: student.name,
            classLabel: getClassLabel(student.classId),
            recordStatus: getStudentLifecycleStatus(student),
            paymentStatus,
            invoiceCount: studentInvoices.length,
            billed,
            paid,
            outstanding,
            latestDue: latestDue?.dueDate || latestDue?.createdAt || null,
          };
        })
    : [];

  const classStatusCounts = classStatusRows.reduce(
    (summary, row) => {
      summary[row.paymentStatus] += 1;
      return summary;
    },
    { paid: 0, partial: 0, unpaid: 0, "no-fees": 0 }
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading ledger data...</div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payment & Ledger</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin
              ? "Manage fee automation, issue invoices, and track each class payment status."
              : "Track your child's fees and payments."}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openFeeModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              Add Fee Setup
            </button>
            <button
              onClick={() => {
                setInvoiceForm(DEFAULT_INVOICE_FORM);
                setShowInvoiceModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Manual Invoice
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-green-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <p className="text-xs text-gray-400 mt-1">{summaryScopeLabel}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                RM {formatMoney(totalPaid)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-yellow-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding Fees</p>
              <p className="text-xs text-gray-400 mt-1">{summaryScopeLabel}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                RM {formatMoney(totalPending)}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Revenue (Invoiced)
              </p>
              <p className="text-xs text-gray-400 mt-1">{summaryScopeLabel}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                RM {formatMoney(totalInvoiced)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Fee Setup & Automation
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Monthly and enrollment fees are compulsory for all active students.
                Material and custom fees can be assigned only to selected students.
              </p>
            </div>
          </div>

          {feeTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No fee setup created yet.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Start by creating monthly or enrollment fees, then add optional
                material or custom fees for selected students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {feeTemplates.map((template) => {
                const meta = getTemplateMeta(template.feeType);
                const isCompulsory =
                  template.feeType === "monthly" ||
                  template.feeType === "enrollment";
                const targetCount = Array.isArray(template.targetStudentIds)
                  ? template.targetStudentIds.length
                  : 0;

                return (
                  <div
                    key={template._id}
                    className="rounded-2xl border border-gray-100 shadow-sm bg-white p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {template.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border mt-2 ${meta.chipClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          template.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {template.isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-gray-900">
                        RM {formatMoney(template.amount)}
                      </p>
                      <p className="text-xs text-gray-500 min-h-[2.5rem]">
                        {template.description || meta.description}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Assignment</span>
                        <span className="font-semibold text-gray-800">
                          {isCompulsory
                            ? "All active students"
                            : `${targetCount} selected student${
                                targetCount === 1 ? "" : "s"
                              }`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Automation</span>
                        <span className="font-semibold text-gray-800">
                          {isCompulsory ? "Automatic" : "On creation"}
                        </span>
                      </div>
                      {template.feeType === "monthly" && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Due each month</span>
                          <span className="font-semibold text-gray-800">
                            Day {template.dueDay || 5}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openFeeModal(template)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeeTemplate(template._id)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "invoices"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Invoices / Fees
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("pending-verification")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "pending-verification"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Verification
              {payments.filter(p => p.status === "pending_verification").length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {payments.filter(p => p.status === "pending_verification").length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab("ledger")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "ledger"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Payment Ledger
          </button>
        </nav>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          {/* Title + Active/History tabs */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Class Payment Status</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setClassStatusView("active")}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                  classStatusView === "active"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Active ({activeClassStatusStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setClassStatusView("history")}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                  classStatusView === "history"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                History ({historyClassStatusStudents.length})
              </button>
            </div>
          </div>

          {/* Class filter tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setSelectedClassFilter("all"); setClassStatusPage(1); }}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                selectedClassFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All Classes
            </button>
            {sortedClasses.map((classItem) => {
              const classId = getIdValue(classItem);
              return (
                <button
                  key={classId}
                  type="button"
                  onClick={() => { setSelectedClassFilter(classId); setClassStatusPage(1); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                    selectedClassFilter === classId
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {getClassLabel(classItem)}
                </button>
              );
            })}
          </div>

          {/* Month filter select for Class Payment Status */}
          {(() => {
            // Derive unique months from all invoices belonging to the visible students
            const monthSet = new Set();
            classStatusRows.forEach((row) => {
              invoices.forEach((inv) => {
                if (String(getIdValue(inv.studentId)) === String(row.studentId) && inv.createdAt) {
                  const d = new Date(inv.createdAt);
                  monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                }
              });
            });
            const sortedMonths = Array.from(monthSet).sort().reverse();
            if (sortedMonths.length === 0) return null;
            const monthLabel = (m) => {
              const [y, mo] = m.split("-");
              return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-MY", { month: "short", year: "numeric" });
            };
            return (
              <div className="flex items-center gap-2">
                <select
                  value={classStatusMonth}
                  onChange={(e) => { setClassStatusMonth(e.target.value); setClassStatusPage(1); }}
                  className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block px-4 py-2 hover:bg-gray-50 transition outline-none shadow-sm cursor-pointer"
                >
                  <option value="all">All Months</option>
                  {sortedMonths.map((m) => (
                    <option key={m} value={m}>{monthLabel(m)}</option>
                  ))}
                </select>
              </div>
            );
          })()}


          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              ["paid", "Paid"],
              ["partial", "Partial"],
              ["unpaid", "Unpaid"],
              ["no-fees", "No Fees"],
            ].map(([statusKey, title]) => (
              <div
                key={statusKey}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                  {title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {classStatusCounts[statusKey]}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-4">Student</th>
                  <th className="px-4 py-4">Class</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Fees</th>
                  <th className="px-4 py-4">Paid</th>
                  <th className="px-4 py-4">Outstanding</th>
                  <th className="px-4 py-4">Latest Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const CS_PAGE_SIZE = 10;

                  // Apply month filter: keep students who have at least one invoice in the selected month
                  const monthFilteredRows = classStatusMonth === "all"
                    ? classStatusRows
                    : classStatusRows.filter((row) =>
                        invoices.some((inv) => {
                          if (String(getIdValue(inv.studentId)) !== String(row.studentId)) return false;
                          if (!inv.createdAt) return false;
                          const d = new Date(inv.createdAt);
                          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                          return key === classStatusMonth;
                        })
                      );

                  const sortedRows = [...monthFilteredRows].sort((a, b) =>
                    a.studentName.toLowerCase().localeCompare(b.studentName.toLowerCase())
                  );
                  const totalCsPages = Math.max(1, Math.ceil(sortedRows.length / CS_PAGE_SIZE));
                  const safeCsPage = Math.min(classStatusPage, totalCsPages);
                  const csSlice = sortedRows.slice((safeCsPage - 1) * CS_PAGE_SIZE, safeCsPage * CS_PAGE_SIZE);

                  return (
                    <>
                      {csSlice.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            {classStatusView === "history"
                              ? "No historical students found for this class."
                              : "No active students found for this class."}
                          </td>
                        </tr>
                      ) : (
                        csSlice.map((row) => (
                          <tr key={row.studentId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">{row.studentName}</div>
                              {row.recordStatus !== "active" && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatStudentLifecycleStatus(row.recordStatus)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-gray-500">{row.classLabel}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_META[row.paymentStatus].className}`}
                              >
                                {row.paymentStatus === "paid" ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                {STATUS_META[row.paymentStatus].label}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-gray-900">
                              {row.invoiceCount} invoice{row.invoiceCount === 1 ? "" : "s"}
                            </td>
                            <td className="px-4 py-4 text-green-600 font-semibold">
                              RM {formatMoney(row.paid)}
                            </td>
                            <td className="px-4 py-4 text-red-500 font-semibold">
                              RM {formatMoney(row.outstanding)}
                            </td>
                            <td className="px-4 py-4 text-gray-500">
                              {row.latestDue ? new Date(row.latestDue).toLocaleDateString() : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>

            {/* Class Status Pagination */}
            {(() => {
              const CS_PAGE_SIZE = 10;
              const monthFilteredRows = classStatusMonth === "all"
                ? classStatusRows
                : classStatusRows.filter((row) =>
                    invoices.some((inv) => {
                      if (String(getIdValue(inv.studentId)) !== String(row.studentId)) return false;
                      if (!inv.createdAt) return false;
                      const d = new Date(inv.createdAt);
                      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                      return key === classStatusMonth;
                    })
                  );
              const sortedRows = [...monthFilteredRows].sort((a, b) =>
                a.studentName.toLowerCase().localeCompare(b.studentName.toLowerCase())
              );
              const totalCsPages = Math.max(1, Math.ceil(sortedRows.length / CS_PAGE_SIZE));
              const safeCsPage = Math.min(classStatusPage, totalCsPages);
              if (totalCsPages <= 1) return null;
              return (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                  <p className="text-xs text-gray-500">
                    Showing {(safeCsPage - 1) * CS_PAGE_SIZE + 1}–{Math.min(safeCsPage * CS_PAGE_SIZE, sortedRows.length)} of {sortedRows.length} students
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={safeCsPage === 1}
                      onClick={() => setClassStatusPage(safeCsPage - 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ‹ Prev
                    </button>
                    {Array.from({ length: totalCsPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setClassStatusPage(pg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          pg === safeCsPage
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={safeCsPage === totalCsPages}
                      onClick={() => setClassStatusPage(safeCsPage + 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

            {activeTab === "invoices" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isAdmin && (() => {
            // Derive unique months from displayedInvoices for month tab
            const monthSet = new Set();
            displayedInvoices.forEach((inv) => {
              if (inv.createdAt) {
                const d = new Date(inv.createdAt);
                monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
              }
            });
            const sortedMonths = Array.from(monthSet).sort().reverse();
            const monthLabel = (m) => {
              const [y, mo] = m.split("-");
              return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-MY", { month: "short", year: "numeric" });
            };

            // Sort alphabetically by student name
            const sortedInvoices = [...displayedInvoices].sort((a, b) => {
              const nameA = getStudentName(a.studentId).toLowerCase();
              const nameB = getStudentName(b.studentId).toLowerCase();
              return nameA.localeCompare(nameB);
            });

            // Apply month filter
            const monthFiltered = adminInvoiceMonth === "all"
              ? sortedInvoices
              : sortedInvoices.filter((inv) => {
                  if (!inv.createdAt) return false;
                  const d = new Date(inv.createdAt);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                  return key === adminInvoiceMonth;
                });

            // Apply status filter
            const statusFiltered =
              adminInvoiceFilter === "all"
                ? monthFiltered
                : adminInvoiceFilter === "paid"
                ? monthFiltered.filter((inv) => inv.status === "paid")
                : monthFiltered.filter((inv) => inv.status !== "paid");

            // Apply search filter
            const searchTerm = adminInvoiceSearch.trim().toLowerCase();
            const filteredInvoices = searchTerm
              ? statusFiltered.filter((inv) =>
                  getStudentName(inv.studentId).toLowerCase().includes(searchTerm)
                )
              : statusFiltered;

            const unpaidCount = monthFiltered.filter((inv) => inv.status !== "paid").length;
            const paidCount = monthFiltered.filter((inv) => inv.status === "paid").length;

            const tabCls = (key) =>
              `px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                adminInvoiceFilter === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`;

            return (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
                  {/* Title + record count */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Invoice / Fee Records</p>
                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                      {filteredInvoices.length} record{filteredInvoices.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {/* Month filter select */}
                  {sortedMonths.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={adminInvoiceMonth}
                        onChange={(e) => { setAdminInvoiceMonth(e.target.value); setAdminInvoicePage(1); }}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block px-4 py-2 hover:bg-gray-50 transition outline-none shadow-sm cursor-pointer"
                      >
                        <option value="all">All Months</option>
                        {sortedMonths.map((m) => (
                          <option key={m} value={m}>{monthLabel(m)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Filter tabs + search row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                      <button type="button" className={tabCls("all")} onClick={() => { setAdminInvoiceFilter("all"); setAdminInvoicePage(1); }}>
                        All ({sortedInvoices.length})
                      </button>
                      <button type="button" className={tabCls("unpaid")} onClick={() => { setAdminInvoiceFilter("unpaid"); setAdminInvoicePage(1); }}>
                        Unpaid ({unpaidCount})
                      </button>
                      <button type="button" className={tabCls("paid")} onClick={() => { setAdminInvoiceFilter("paid"); setAdminInvoicePage(1); }}>
                        Paid ({paidCount})
                      </button>
                    </div>
                    {/* Search bar */}
                    <div className="relative flex-1 max-w-xs">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search student name…"
                        value={adminInvoiceSearch}
                        onChange={(e) => { setAdminInvoiceSearch(e.target.value); setAdminInvoicePage(1); }}
                        className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                      {adminInvoiceSearch && (
                        <button
                          type="button"
                          onClick={() => { setAdminInvoiceSearch(""); setAdminInvoicePage(1); }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── ADMIN VIEW: flat table ── */}
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4 w-10">#</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Fee</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Issued / Due</th>
                      <th className="px-6 py-4">Receipt</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(() => {
                        const PAGE_SIZE = 10;
                        const totalInvPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
                        const safePage = Math.min(adminInvoicePage, totalInvPages);
                        const pageSlice = filteredInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

                        const pageBtnCls = (active) =>
                          `px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            active ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`;

                        return (
                          <>
                            {pageSlice.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                  {adminInvoiceSearch
                                    ? `No results for "${adminInvoiceSearch}".`
                                    : adminInvoiceFilter !== "all"
                                    ? `No ${adminInvoiceFilter} invoices found.`
                                    : "No invoices found."}
                                </td>
                              </tr>
                            ) : (
                              pageSlice.map((invoice, idx) => {
                                const globalIndex = (safePage - 1) * PAGE_SIZE + idx;
                                const invoicePayments = getPaymentsForInvoice(invoice._id);
                                const withReceipt = invoicePayments.find((p) => p.receiptUrl);
                                return (
                                  <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-400 font-bold text-sm select-none">{globalIndex + 1}.</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{getStudentName(invoice.studentId)}</td>
                                    <td className="px-6 py-4">
                                      <div className="font-medium text-gray-900">{invoice.feeItem || invoice.category || "Fee"}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {invoice.category || "Uncategorized"}
                                        {invoice.isAutomated ? " • Automated" : " • Manual"}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900">RM {formatMoney(invoice.amount)}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max ${STATUS_META[invoice.status || "unpaid"].className}`}>
                                        {invoice.status === "paid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {STATUS_META[invoice.status || "unpaid"].label}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                      <div>{new Date(invoice.createdAt).toLocaleDateString()}</div>
                                      <div className="text-xs mt-1">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      {withReceipt ? (
                                        <a
                                          href={`http://localhost:5000${withReceipt.receiptUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition"
                                        >
                                          <Paperclip className="w-3.5 h-3.5" /> View Receipt
                                        </a>
                                      ) : (
                                        <span className="text-gray-400 text-xs italic">None</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      {invoice.status !== "paid" ? (
                                        <button
                                          onClick={() => openPaymentModal(invoice)}
                                          className="text-xs bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                                        >
                                          Record Payment
                                        </button>
                                      ) : (
                                        <span className="text-xs text-gray-400 font-medium">Cleared</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </>
                        );
                      })()}
                  </tbody>
                </table>

                {/* Pagination bar */}
                {(() => {
                  const PAGE_SIZE = 10;
                  const totalInvPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
                  const safePage = Math.min(adminInvoicePage, totalInvPages);
                  if (totalInvPages <= 1) return null;
                  return (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/40">
                      <p className="text-xs text-gray-500">
                        Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredInvoices.length)} of {filteredInvoices.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={safePage === 1}
                          onClick={() => setAdminInvoicePage(safePage - 1)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          ‹ Prev
                        </button>
                        {Array.from({ length: totalInvPages }, (_, i) => i + 1).map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setAdminInvoicePage(pg)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              pg === safePage
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {pg}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={safePage === totalInvPages}
                          onClick={() => setAdminInvoicePage(safePage + 1)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Next ›
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}

          {/* ── PARENT VIEW: consolidated outstanding + individual paid ── */}
          {!isAdmin && (() => {
            const byStudent = {};
            for (const inv of displayedInvoices) {
              const sid = getIdValue(inv.studentId);
              if (!byStudent[sid]) byStudent[sid] = { outstanding: [], paid: [], pendingVerification: [] };
              if (inv.status === "paid") {
                byStudent[sid].paid.push(inv);
              } else {
                // Check if this invoice has a pending payment
                const hasPending = payments.some(
                  p => getIdValue(p.invoiceId) === String(inv._id) && p.status === "pending_verification"
                );
                if (hasPending) {
                  byStudent[sid].pendingVerification.push(inv);
                } else {
                  byStudent[sid].outstanding.push(inv);
                }
              }
            }
            const studentIds = Object.keys(byStudent);
            if (studentIds.length === 0) {
              return (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  No invoices found.
                </div>
              );
            }
            return (
              <div className="p-5 space-y-6">
                {studentIds.map((sid) => {
                  const { outstanding, paid, pendingVerification } = byStudent[sid];
                  const studentName = getStudentName(sid);
                  const totalOutstanding = outstanding.reduce(
                    (sum, inv) => sum + getInvoiceBalance(inv), 0
                  );
                  const earliestDue = outstanding
                    .filter((inv) => inv.dueDate)
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
                  return (
                    <div key={sid} className="space-y-3">
                      <p className="text-sm font-bold text-gray-700">{studentName}</p>

                      {outstanding.length > 0 && (
                        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                                Outstanding Statement
                              </p>
                              <p className="text-2xl font-extrabold text-gray-900">
                                RM {formatMoney(totalOutstanding)}
                              </p>
                              {earliestDue && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Earliest due:{" "}
                                  {new Date(earliestDue.dueDate).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                                </p>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              {outstanding.length} item{outstanding.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className="divide-y divide-amber-200 rounded-xl border border-amber-200 bg-white overflow-hidden">
                            {outstanding.map((inv) => (
                              <div key={inv._id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {inv.feeItem || inv.category || "Fee"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {inv.category || "Uncategorized"} &middot;{" "}
                                    {inv.dueDate
                                      ? `Due ${new Date(inv.dueDate).toLocaleDateString()}`
                                      : "No due date"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900">
                                    RM {formatMoney(inv.amount)}
                                  </p>
                                  {inv.status === "partial" && (
                                    <p className="text-xs text-amber-600">
                                      Balance: RM {formatMoney(getInvoiceBalance(inv))}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setConsolidatedPreviewInvoices(outstanding);
                                setShowConsolidatedPreview(true);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition"
                            >
                              <FileText className="w-4 h-4" /> View Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => openParentPayModal(outstanding)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-green-600 px-4 py-2.5 rounded-xl hover:bg-green-700 transition"
                            >
                              Pay Now
                            </button>
                          </div>
                        </div>
                      )}

                      {pendingVerification.length > 0 && (
                        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                              Payment Pending Admin Verification
                            </p>
                          </div>
                          <p className="text-xs text-blue-600">
                            Your payment has been received and is being reviewed by the admin. Your invoice will be updated once verified.
                          </p>
                          <div className="divide-y divide-blue-100 rounded-xl border border-blue-100 bg-white overflow-hidden">
                            {pendingVerification.map((inv) => (
                              <div key={inv._id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <div>
                                  <p className="font-semibold text-gray-800">{inv.feeItem || inv.category || "Fee"}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{inv.category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">RM {formatMoney(inv.amount)}</p>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    <Clock className="w-3 h-3" /> Under Review
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {paid.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Cleared Invoices
                          </p>
                          {paid.map((inv) => (
                            <div
                              key={inv._id}
                              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm hover:bg-gray-50 transition"
                            >
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {inv.feeItem || inv.category || "Fee"}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {inv.category} &middot;{" "}
                                  {new Date(inv.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-gray-900">
                                  RM {formatMoney(inv.amount)}
                                </p>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3" /> Paid
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadInvoiceReceiptPdf(
                                      inv,
                                      getPaymentsForInvoice(inv._id)
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                                >
                                  <Download className="w-3 h-3" /> PDF Receipt
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "pending-verification" && isAdmin && (() => {
        const pending = payments.filter(p => p.status === "pending_verification");

        const handleVerify = async (paymentId) => {
          if (!window.confirm("Verify this payment? The invoice will be updated.")) return;
          try {
            await verifyPayment(paymentId);
            await fetchData();
          } catch (e) {
            alert("Failed to verify payment.");
          }
        };

        const handleReject = async (paymentId) => {
          if (!window.confirm("Reject this payment? The parent will be notified.")) return;
          try {
            await rejectPayment(paymentId);
            await fetchData();
          } catch (e) {
            alert("Failed to reject payment.");
          }
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">Pending Payment Verification</h3>
              <span className="text-sm text-gray-500">{pending.length} submission{pending.length !== 1 ? "s" : ""} awaiting review</span>
            </div>

            {pending.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">All caught up! No pending payments.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-amber-50 text-amber-800 uppercase text-xs font-semibold border-b border-amber-100">
                    <tr>
                      <th className="px-5 py-4">#</th>
                      <th className="px-5 py-4">Student</th>
                      <th className="px-5 py-4">Invoice / Fee</th>
                      <th className="px-5 py-4">Date Submitted</th>
                      <th className="px-5 py-4">Method</th>
                      <th className="px-5 py-4">Receipt</th>
                      <th className="px-5 py-4 text-right">Amount</th>
                      <th className="px-5 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pending.map((p, i) => (
                      <tr key={p._id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-5 py-4 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {p.studentId?.name || "—"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {p.invoiceId?.feeItem || p.invoiceId?.category || "Invoice"}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                        </td>
                        <td className="px-5 py-4">{p.method || "—"}</td>
                        <td className="px-5 py-4">
                          {p.receiptUrl ? (
                            <a
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                            >
                              <Paperclip className="w-3 h-3" /> View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">No receipt</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-gray-900">
                          RM {formatMoney(p.amountPaid)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleVerify(p._id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Verify
                            </button>
                            <button
                              onClick={() => handleReject(p._id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === "ledger" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 w-10">#</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4 text-right font-bold text-gray-900">
                  Amount Paid
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400 font-bold text-sm select-none">
                      {index + 1}.
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(payment.paidAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {getStudentName(payment.studentId)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {payment.note || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {payment.receiptUrl ? (
                        <a
                          href={`http://localhost:5000${payment.receiptUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-lg"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      RM {formatMoney(payment.amountPaid)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showFeeModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingFeeTemplateId ? "Edit Fee Setup" : "Create Fee Setup"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Build compulsory monthly and enrollment fees, or assign material
                  and custom fees to selected students.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFeeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeeSubmit} className="space-y-5 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. April Monthly Fee"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={feeForm.name}
                    onChange={(event) =>
                      setFeeForm({ ...feeForm, name: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={feeForm.feeType}
                    disabled={Boolean(editingFeeTemplateId)}
                    onChange={(event) => handleFeeTypeChange(event.target.value)}
                  >
                    {Object.entries(FEE_TYPE_META).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (RM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={feeForm.amount}
                    onChange={(event) =>
                      setFeeForm({ ...feeForm, amount: event.target.value })
                    }
                  />
                </div>
                {feeForm.feeType === "monthly" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Day Each Month
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      required
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={feeForm.dueDay}
                      onChange={(event) =>
                        setFeeForm({ ...feeForm, dueDay: event.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center">
                    <p className="text-sm text-gray-600">
                      {getTemplateMeta(feeForm.feeType).description}
                    </p>
                  </div>
                )}
              </div>

              {feeForm.feeType === "monthly" && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                    Automation Period (School Year)
                  </p>
                  <p className="text-xs text-indigo-600">
                    Set the school year range. Monthly invoices will only be generated within these months. Leave blank to always run.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Month
                      </label>
                      <input
                        type="month"
                        className="w-full p-2.5 border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        value={feeForm.startMonth}
                        onChange={(event) =>
                          setFeeForm({ ...feeForm, startMonth: event.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Month
                      </label>
                      <input
                        type="month"
                        className="w-full p-2.5 border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        value={feeForm.endMonth}
                        onChange={(event) =>
                          setFeeForm({ ...feeForm, endMonth: event.target.value })
                        }
                      />
                    </div>
                  </div>
                  {feeForm.startMonth && feeForm.endMonth && (
                    <p className="text-xs text-indigo-700 font-medium">
                      ✓ Automation runs from{" "}
                      {new Date(feeForm.startMonth + "-01").toLocaleDateString("en-MY", { month: "long", year: "numeric" })}{" "}
                      to{" "}
                      {new Date(feeForm.endMonth + "-01").toLocaleDateString("en-MY", { month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={feeForm.description}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, description: event.target.value })
                  }
                />
              </div>

              {(feeForm.feeType === "material" || feeForm.feeType === "custom") && (
                <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Assign Students
                      </h4>
                      <p className="text-sm text-gray-500">
                        Pick which students must pay this optional fee.
                      </p>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sortedStudents.map((student) => {
                      const studentId = getIdValue(student);
                      const selected = feeForm.targetStudentIds.includes(studentId);

                      return (
                        <label
                          key={studentId}
                          className={`rounded-xl border p-3 cursor-pointer transition ${
                            selected
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selected}
                              onChange={() => handleToggleFeeStudent(studentId)}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {getClassLabel(student.classId)}
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={feeForm.isActive}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, isActive: event.target.checked })
                  }
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Fee setup is active
                  </p>
                  <p className="text-xs text-gray-500">
                    Inactive fee setups stay in the list but stop generating new
                    invoices.
                  </p>
                </div>
              </label>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeFeeModal}
                  className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium"
                >
                  {formSubmitting
                    ? "Saving..."
                    : editingFeeTemplateId
                      ? "Update Fee Setup"
                      : "Create Fee Setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create Manual Invoice
            </h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                  value={invoiceForm.studentId}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, studentId: event.target.value })
                  }
                  required
                >
                  <option value="">Select a student...</option>
                  {sortedStudents.map((student) => (
                    <option key={getIdValue(student)} value={getIdValue(student)}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports Day Fee"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={invoiceForm.feeItem}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, feeItem: event.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (RM)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={invoiceForm.amount}
                    onChange={(event) =>
                      setInvoiceForm({ ...invoiceForm, amount: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={invoiceForm.category}
                    onChange={(event) =>
                      setInvoiceForm({ ...invoiceForm, category: event.target.value })
                    }
                  >
                    {MANUAL_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={invoiceForm.dueDate}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, dueDate: event.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceForm(DEFAULT_INVOICE_FORM);
                    setShowInvoiceModal(false);
                  }}
                  className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Record Payment
            </h3>
            <div className="mb-4 space-y-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p>
                <span className="text-gray-500">Invoice Amount:</span>{" "}
                <strong className="float-right text-gray-900">
                  RM {formatMoney(selectedInvoice.amount)}
                </strong>
              </p>
              <p>
                <span className="text-gray-500">Student:</span>{" "}
                <strong className="float-right text-gray-900">
                  {getStudentName(selectedInvoice.studentId)}
                </strong>
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Paid (RM)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                    value={paymentForm.amountPaid}
                    onChange={(event) =>
                      setPaymentForm({
                        ...paymentForm,
                        amountPaid: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    value={paymentForm.method}
                    onChange={(event) =>
                      setPaymentForm({ ...paymentForm, method: event.target.value })
                    }
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Txn #123456"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  value={paymentForm.note}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, note: event.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showParentPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Submit Payment</h3>
              <button
                onClick={() => setShowParentPayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <img
                src="/qr_code.png"
                alt="Static QR"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl shadow-sm bg-white p-2 flex-shrink-0"
              />
              <div className="text-center sm:text-left flex flex-col justify-center h-full sm:mt-6">
                <p className="font-bold text-indigo-900 text-lg">
                  Tadika Dunia Cahaya
                </p>
                <p className="text-base font-semibold text-indigo-800 font-mono mt-2 bg-indigo-100 inline-block px-3 py-1.5 rounded-lg">
                  Maybank: 1122 3344 5566
                </p>
                <p className="text-sm text-indigo-600 mt-4 leading-relaxed">
                  Scan the QR code to the left or transfer manually to the account
                  above.
                </p>
              </div>
            </div>

            <form onSubmit={handleParentPaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paying Amount (RM)
                </label>
                <input
                  type="number"
                  required
                  readOnly
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none cursor-not-allowed font-bold"
                  value={parentPayForm.amountPaid}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Receipt Image/PDF
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl relative group hover:border-indigo-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          required
                          onChange={(event) =>
                            setParentPayForm({
                              ...parentPayForm,
                              receipt: event.target.files[0],
                            })
                          }
                        />
                      </label>
                    </div>
                    {parentPayForm.receipt ? (
                      <p className="text-xs text-green-600 font-medium break-all">
                        {parentPayForm.receipt.name}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 flex justify-center items-center gap-2"
                >
                  {formSubmitting ? "Uploading..." : "Submit Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBillingPreview && previewInvoice && (() => {
        const invId = String(previewInvoice._id || "");
        const invoiceNo = invId ? `INV-${invId.slice(-8).toUpperCase()}` : `INV-?`;
        const amountDue = Number(previewInvoice.amount || 0);
        const dueDate = previewInvoice.dueDate
          ? new Date(previewInvoice.dueDate).toLocaleDateString("en-MY", { dateStyle: "medium" })
          : "—";
        const issuedDate = previewInvoice.createdAt
          ? new Date(previewInvoice.createdAt).toLocaleDateString("en-MY", { dateStyle: "medium" })
          : new Date().toLocaleDateString("en-MY", { dateStyle: "medium" });
        const studentName = getStudentName(previewInvoice.studentId);
        const payerName = user?.name || "Parent / Guardian";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col">

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Billing Invoice Preview</p>
                    <p className="text-xs text-gray-400">{invoiceNo}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowBillingPreview(false); setPreviewInvoice(null); }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Invoice body */}
              <div className="px-6 py-5 space-y-5 flex-1">

                {/* School name / title */}
                <div className="text-center pb-2 border-b border-dashed border-gray-200">
                  <p className="text-base font-extrabold text-gray-900 tracking-wide">Tadika Dunia Cahaya</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mt-1">Billing Invoice</p>
                  <p className="text-xs text-gray-400 mt-1">This is a billing notice. Payment is required by the due date below.</p>
                </div>

                {/* Info rows */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ["Invoice Ref", invoiceNo],
                    ["Issued Date", issuedDate],
                    ["Due Date", dueDate],
                    ["Billed To", payerName],
                    ["Student", studentName],
                    ["Category", previewInvoice.category || "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-medium">Fee Description</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {previewInvoice.feeItem || previewInvoice.category || "—"}
                    </p>
                  </div>
                </div>

                {/* Amount due highlight */}
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-blue-800">TOTAL AMOUNT DUE</p>
                  <p className="text-2xl font-extrabold text-blue-900">
                    RM {Number(amountDue).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Payment instructions */}
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Payment Instructions</p>
                  <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                    <li>Transfer the amount due to the kindergarten bank account.</li>
                    <li>After payment, click <strong>Pay Now</strong> and upload your transfer receipt.</li>
                    <li>Your payment will be verified by admin and a receipt issued upon clearance.</li>
                    <li>For enquiries, please contact the kindergarten office.</li>
                  </ul>
                </div>

                <p className="text-center text-xs text-gray-400">
                  Generated by KMMS &nbsp;·&nbsp; {invoiceNo}
                </p>
              </div>

              {/* Footer actions */}
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowBillingPreview(false); setPreviewInvoice(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadInvoiceBillingPdf({
                      payerName,
                      studentName,
                      invoice: previewInvoice,
                    })
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

            </div>
          </div>
        );
      })()}
      {showConsolidatedPreview && consolidatedPreviewInvoices.length > 0 && (() => {
        const payerName = user?.name || "Parent / Guardian";
        const studentName = getStudentName(consolidatedPreviewInvoices[0].studentId);
        const totalDue = consolidatedPreviewInvoices.reduce(
          (sum, inv) => sum + getInvoiceBalance(inv), 0
        );
        const earliestDue = consolidatedPreviewInvoices
          .filter((inv) => inv.dueDate)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
        const refNo = `STMT-${Date.now().toString(36).toUpperCase().slice(-6)}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Consolidated Invoice Preview</p>
                    <p className="text-xs text-gray-400">{refNo}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowConsolidatedPreview(false); setConsolidatedPreviewInvoices([]); }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5 flex-1">

                <div className="text-center pb-2 border-b border-dashed border-gray-200">
                  <p className="text-base font-extrabold text-gray-900 tracking-wide">Tadika Dunia Cahaya</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mt-1">Outstanding Fee Statement</p>
                  <p className="text-xs text-gray-400 mt-1">This statement combines all your outstanding fees. Please pay the total amount due.</p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ["Statement Ref", refNo],
                    ["Date Issued", new Date().toLocaleDateString("en-MY", { dateStyle: "medium" })],
                    ["Earliest Due", earliestDue ? new Date(earliestDue.dueDate).toLocaleDateString("en-MY", { dateStyle: "medium" }) : "—"],
                    ["Billed To", payerName],
                    ["Student", studentName],
                    ["Items", `${consolidatedPreviewInvoices.length} fee item${consolidatedPreviewInvoices.length !== 1 ? "s" : ""}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Fee line items */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Fee Items</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {consolidatedPreviewInvoices.map((inv) => (
                      <div key={inv._id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-gray-800">{inv.feeItem || inv.category || "Fee"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {inv.category || "Uncategorized"}
                            {inv.dueDate ? ` · Due ${new Date(inv.dueDate).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">RM {formatMoney(inv.amount)}</p>
                          {inv.status === "partial" && (
                            <p className="text-xs text-amber-600">Balance: RM {formatMoney(getInvoiceBalance(inv))}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total due */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-amber-800">TOTAL AMOUNT DUE</p>
                  <p className="text-2xl font-extrabold text-amber-900">
                    RM {Number(totalDue).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Instructions */}
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Payment Instructions</p>
                  <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                    <li>Transfer the total amount due to the kindergarten bank account.</li>
                    <li>After payment, click <strong>Pay Now</strong> and upload your transfer receipt.</li>
                    <li>Admin will verify and a receipt will be issued upon clearance.</li>
                    <li>For enquiries, please contact the kindergarten office.</li>
                  </ul>
                </div>

                <p className="text-center text-xs text-gray-400">Generated by KMMS &nbsp;·&nbsp; {refNo}</p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowConsolidatedPreview(false); setConsolidatedPreviewInvoices([]); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const headerInvoice = {
                      _id: refNo,
                      amount: totalDue,
                      dueDate: earliestDue?.dueDate || null,
                      createdAt: new Date().toISOString(),
                    };
                    downloadInvoiceBillingPdf({
                      payerName,
                      studentName,
                      invoice: headerInvoice,
                      invoiceItems: consolidatedPreviewInvoices,
                    });
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PaymentManagement;
