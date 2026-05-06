import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  BarChart3,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Loader2,
  Paperclip,
  Percent,
  Receipt,
  Users,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getClasses } from "../../api/classes";
import { getStudents } from "../../api/students";
import { getMonthlyStats } from "../../api/attendance";
import { getPayments } from "../../api/payments";
import { getInvoices } from "../../api/invoices";

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getMonthKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 7);
};

const getStudentStatus = (student) =>
  String(student?.status || "active").toLowerCase();

const getAttendanceHealthLabel = (percentage) => {
  if (percentage >= 95) return "Excellent";
  if (percentage >= 85) return "Healthy";
  if (percentage >= 75) return "Needs Attention";
  return "Critical";
};

const Reports = () => {
  const [activeReport, setActiveReport] = useState("attendance");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedAttendanceClassId, setSelectedAttendanceClassId] = useState("");
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedLedgerClassId, setSelectedLedgerClassId] = useState("all");
  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [baseLoading, setBaseLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReportData = async () => {
      setBaseLoading(true);

      try {
        const [classData, studentData, paymentData, invoiceData] = await Promise.all([
          getClasses(),
          getStudents(),
          getPayments(),
          getInvoices(),
        ]);

        if (!isMounted) return;

        setClasses(classData || []);
        setStudents(studentData || []);
        setPayments(paymentData || []);
        setInvoices(invoiceData || []);

        if ((classData || []).length > 0) {
          setSelectedAttendanceClassId((current) => current || classData[0]._id);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load reports data", error);
      } finally {
        if (isMounted) {
          setBaseLoading(false);
        }
      }
    };

    loadReportData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAttendanceStats = async () => {
      if (!selectedAttendanceClassId || !selectedAttendanceMonth) {
        setAttendanceStats(null);
        return;
      }

      setAttendanceLoading(true);

      try {
        const stats = await getMonthlyStats(
          selectedAttendanceClassId,
          selectedAttendanceMonth
        );
        if (!isMounted) return;
        setAttendanceStats(stats);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load attendance stats", error);
        setAttendanceStats(null);
      } finally {
        if (isMounted) {
          setAttendanceLoading(false);
        }
      }
    };

    loadAttendanceStats();

    return () => {
      isMounted = false;
    };
  }, [selectedAttendanceClassId, selectedAttendanceMonth]);

  const sortedClasses = useMemo(
    () =>
      [...classes].sort((left, right) => {
        const leftYear = Number(left.yearGroup || 0);
        const rightYear = Number(right.yearGroup || 0);
        if (leftYear !== rightYear) return leftYear - rightYear;
        return String(left.className || "").localeCompare(
          String(right.className || "")
        );
      }),
    [classes]
  );

  const getClassLabel = (classValue) => {
    const classId = getIdValue(classValue);
    const classRecord =
      (typeof classValue === "object" && classValue?.className && classValue) ||
      sortedClasses.find((item) => getIdValue(item) === classId);

    if (!classRecord) return "Unassigned Class";
    if (classRecord.yearGroup) {
      return `${classRecord.className} - ${classRecord.yearGroup} Years`;
    }
    return classRecord.className || "Unassigned Class";
  };

  const getStudentName = (studentValue) => {
    if (studentValue?.name) return studentValue.name;

    const studentId = getIdValue(studentValue);
    return (
      students.find((student) => getIdValue(student) === studentId)?.name ||
      "Unknown Student"
    );
  };

  const selectedAttendanceClassLabel = getClassLabel(selectedAttendanceClassId);
  const attendanceClassStudents = students.filter(
    (student) =>
      getIdValue(student.classId) === selectedAttendanceClassId &&
      getStudentStatus(student) === "active"
  );
  const attendancePercentage = Number(attendanceStats?.percentage || 0);
  const attendanceHealth = getAttendanceHealthLabel(attendancePercentage);
  const attendanceAbsenceRate =
    attendanceStats?.totalRecords > 0 ? 100 - attendancePercentage : 0;

  const ledgerScopeLabel =
    selectedLedgerClassId === "all"
      ? "All Classes"
      : getClassLabel(selectedLedgerClassId);

  const ledgerStudentIds = (
    selectedLedgerClassId === "all"
      ? students
      : students.filter(
          (student) => getIdValue(student.classId) === selectedLedgerClassId
        )
  ).map((student) => getIdValue(student));

  const ledgerScopedInvoices = invoices.filter((invoice) =>
    ledgerStudentIds.includes(getIdValue(invoice.studentId))
  );
  const ledgerScopedPayments = payments.filter((payment) =>
    ledgerStudentIds.includes(getIdValue(payment.studentId))
  );
  const monthlyInvoices = ledgerScopedInvoices.filter(
    (invoice) => getMonthKey(invoice.createdAt) === selectedLedgerMonth
  );
  const monthlyPayments = ledgerScopedPayments.filter(
    (payment) => getMonthKey(payment.paidAt) === selectedLedgerMonth
  );

  const paymentTotalsByInvoiceId = ledgerScopedPayments.reduce(
    (summary, payment) => {
      const invoiceId = getIdValue(payment.invoiceId);
      if (!invoiceId) return summary;
      summary[invoiceId] = (summary[invoiceId] || 0) + Number(payment.amountPaid || 0);
      return summary;
    },
    {}
  );

  const monthlyInvoiceIds = new Set(monthlyInvoices.map((invoice) => getIdValue(invoice)));
  const collectedAgainstMonthlyInvoices = ledgerScopedPayments
    .filter((payment) => monthlyInvoiceIds.has(getIdValue(payment.invoiceId)))
    .reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);

  const totalIssuedThisMonth = monthlyInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0
  );
  const totalCollectedThisMonth = monthlyPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );
  const totalOutstandingBalance = ledgerScopedInvoices.reduce((sum, invoice) => {
    const invoiceId = getIdValue(invoice);
    const paidAmount = Number(paymentTotalsByInvoiceId[invoiceId] || 0);
    return sum + Math.max(0, Number(invoice.amount || 0) - paidAmount);
  }, 0);
  const collectionRate =
    totalIssuedThisMonth > 0
      ? Math.min(
          100,
          Math.round((collectedAgainstMonthlyInvoices / totalIssuedThisMonth) * 100)
        )
      : 0;

  const invoiceStatusSummary = ledgerScopedInvoices.reduce(
    (summary, invoice) => {
      const status = String(invoice.status || "unpaid").toLowerCase();
      if (summary[status] !== undefined) {
        summary[status] += 1;
      }
      return summary;
    },
    { paid: 0, partial: 0, unpaid: 0 }
  );

  const cashCollectionsThisMonth = monthlyPayments
    .filter((payment) => String(payment.method || "").toLowerCase() === "cash")
    .reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);
  const uploadedReceiptsThisMonth = monthlyPayments.filter(
    (payment) => Boolean(payment.receiptUrl)
  ).length;

  const paymentMethodBreakdown = Object.values(
    monthlyPayments.reduce((summary, payment) => {
      const method = payment.method || "Unknown";
      if (!summary[method]) {
        summary[method] = { method, count: 0, amount: 0 };
      }

      summary[method].count += 1;
      summary[method].amount += Number(payment.amountPaid || 0);
      return summary;
    }, {})
  ).sort((left, right) => right.amount - left.amount);

  const highestMethodAmount = Math.max(
    ...paymentMethodBreakdown.map((item) => item.amount),
    1
  );

  const recentPayments = [...monthlyPayments]
    .sort((left, right) => new Date(right.paidAt) - new Date(left.paidAt))
    .slice(0, 8);

  const outstandingInvoices = ledgerScopedInvoices
    .map((invoice) => {
      const invoiceId = getIdValue(invoice);
      const paidAmount = Number(paymentTotalsByInvoiceId[invoiceId] || 0);
      const outstandingAmount = Math.max(0, Number(invoice.amount || 0) - paidAmount);

      return {
        ...invoice,
        paidAmount,
        outstandingAmount,
      };
    })
    .filter((invoice) => invoice.outstandingAmount > 0)
    .sort(
      (left, right) =>
        new Date(left.dueDate || left.createdAt) - new Date(right.dueDate || right.createdAt)
    )
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-500">
            Attendance insights and payment reporting from the live school records.
          </p>
        </div>

        <div className="bg-white p-1 rounded-lg border shadow-sm flex">
          <button
            onClick={() => setActiveReport("attendance")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeReport === "attendance"
                ? "bg-accent-light text-accent-dark shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Attendance Report
          </button>
          <button
            onClick={() => setActiveReport("ledger")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeReport === "ledger"
                ? "bg-green-100 text-green-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Payment & Ledger Report
          </button>
        </div>
      </div>

      {baseLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {activeReport === "attendance" && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex flex-col gap-1.5 w-full md:w-auto">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">
                    Select Class
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-accent">
                    <Users className="w-4 h-4 text-gray-400" />
                    <select
                      className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer w-full md:w-48"
                      value={selectedAttendanceClassId}
                      onChange={(event) =>
                        setSelectedAttendanceClassId(event.target.value)
                      }
                    >
                      {sortedClasses.map((item) => (
                        <option key={item._id} value={item._id}>
                          {getClassLabel(item)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="hidden md:block h-10 w-px bg-gray-200 mt-6" />

                <div className="flex flex-col gap-1.5 w-full md:w-auto">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">
                    Select Month
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-accent">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="month"
                      className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer w-full md:w-auto"
                      value={selectedAttendanceMonth}
                      onChange={(event) =>
                        setSelectedAttendanceMonth(event.target.value)
                      }
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 md:ml-auto md:mt-5 italic">
                  Attendance report is based on the selected month and current active class roster.
                </p>
              </div>

              {attendanceLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-accent" />
                </div>
              ) : attendanceStats && attendanceStats.totalDays > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-accent-light text-accent rounded-full">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Active Students
                          </p>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {attendanceClassStudents.length}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Days Recorded
                          </p>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {attendanceStats.totalDays}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                          <Percent className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Average Attendance
                          </p>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {attendancePercentage}%
                          </h3>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Total Absences
                          </p>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {attendanceStats.totalAbsent}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Monthly Attendance Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="flex justify-between text-sm font-medium text-gray-600">
                          <span>Present ({attendanceStats.totalPresent})</span>
                          <span>Absent ({attendanceStats.totalAbsent})</span>
                        </div>
                        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-green-500 transition-all duration-700"
                            style={{ width: `${attendancePercentage}%` }}
                          />
                          <div
                            className="h-full bg-red-500 transition-all duration-700"
                            style={{ width: `${attendanceAbsenceRate}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                              Attendance Health
                            </p>
                            <p className="text-lg font-bold text-gray-900 mt-2">
                              {attendanceHealth}
                            </p>
                          </div>
                          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                              Present Records
                            </p>
                            <p className="text-lg font-bold text-gray-900 mt-2">
                              {attendanceStats.totalPresent}
                            </p>
                          </div>
                          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                              Records Counted
                            </p>
                            <p className="text-lg font-bold text-gray-900 mt-2">
                              {attendanceStats.totalRecords}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Class Context</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                            Class
                          </p>
                          <p className="text-base font-bold text-gray-900 mt-2">
                            {selectedAttendanceClassLabel}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                            Month
                          </p>
                          <p className="text-base font-bold text-gray-900 mt-2">
                            {selectedAttendanceMonth}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <p className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                            Absence Rate
                          </p>
                          <p className="text-base font-bold text-gray-900 mt-2">
                            {attendanceAbsenceRate}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-dashed">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No attendance data found for this class and month.</p>
                </div>
              )}
            </div>
          )}

          {activeReport === "ledger" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col xl:flex-row gap-4 items-start xl:items-center">
                <div className="flex flex-col gap-1.5 w-full xl:w-auto">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">
                    Filter by Class
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                    <Users className="w-4 h-4 text-gray-400" />
                    <select
                      className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer w-full xl:w-48"
                      value={selectedLedgerClassId}
                      onChange={(event) => setSelectedLedgerClassId(event.target.value)}
                    >
                      <option value="all">All Classes</option>
                      {sortedClasses.map((item) => (
                        <option key={item._id} value={item._id}>
                          {getClassLabel(item)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 w-full xl:w-auto">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">
                    Filter by Month
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="month"
                      className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer w-full xl:w-auto"
                      value={selectedLedgerMonth}
                      onChange={(event) => setSelectedLedgerMonth(event.target.value)}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 xl:ml-auto xl:mt-5 italic">
                  Ledger scope: {ledgerScopeLabel}. Outstanding balances use the current live invoice statuses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                <Card className="xl:col-span-2">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Issued This Month
                        </p>
                        <h3 className="text-2xl font-bold text-indigo-600 mt-2">
                          RM {formatMoney(totalIssuedThisMonth)}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {monthlyInvoices.length} invoice(s)
                        </p>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Receipt className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Collected This Month
                        </p>
                        <h3 className="text-2xl font-bold text-green-600 mt-2">
                          RM {formatMoney(totalCollectedThisMonth)}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {monthlyPayments.length} payment(s)
                        </p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Outstanding
                        </p>
                        <h3 className="text-2xl font-bold text-orange-500 mt-2">
                          RM {formatMoney(totalOutstandingBalance)}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {invoiceStatusSummary.unpaid + invoiceStatusSummary.partial} open invoice(s)
                        </p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Collection Rate
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">
                          {collectionRate}%
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Paid against issued fees
                        </p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                        <Percent className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Paid Invoices
                        </p>
                        <h3 className="text-2xl font-bold text-green-600 mt-2">
                          {invoiceStatusSummary.paid}
                        </h3>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Partial Invoices
                        </p>
                        <h3 className="text-2xl font-bold text-yellow-500 mt-2">
                          {invoiceStatusSummary.partial}
                        </h3>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                        <Percent className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Cash Collected
                        </p>
                        <h3 className="text-2xl font-bold text-emerald-600 mt-2">
                          RM {formatMoney(cashCollectionsThisMonth)}
                        </h3>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <Banknote className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Uploaded Receipts
                        </p>
                        <h3 className="text-2xl font-bold text-blue-600 mt-2">
                          {uploadedReceiptsThisMonth}
                        </h3>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Paperclip className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Payment Methods - {selectedLedgerMonth}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentMethodBreakdown.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 italic">
                        No payments recorded for this month.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {paymentMethodBreakdown.map((item) => (
                          <div key={item.method} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span>{item.method}</span>
                              </div>
                              <span className="text-gray-500">
                                RM {formatMoney(item.amount)}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{
                                  width: `${Math.max(
                                    8,
                                    Math.round((item.amount / highestMethodAmount) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-400">
                              {item.count} transaction{item.count === 1 ? "" : "s"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Payment Activity - {selectedLedgerMonth}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentPayments.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 italic">
                        No payment activity recorded for this month.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {recentPayments.map((payment) => (
                          <div
                            key={payment._id}
                            className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50 transition-colors rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-green-100 text-green-600">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">
                                  {getStudentName(payment.studentId)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {payment.method || "Unknown method"} -{" "}
                                  {new Date(payment.paidAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-green-600">
                                RM {formatMoney(payment.amountPaid)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {payment.receiptUrl ? "Receipt uploaded" : "No receipt"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Outstanding Invoices - {ledgerScopeLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  {outstandingInvoices.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">
                      No outstanding invoices in the current scope.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {outstandingInvoices.map((invoice, index) => (
                        <div
                          key={invoice._id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50"
                        >
                          <div className="flex gap-3">
                            <span className="font-bold text-gray-400 mt-0.5 w-5">{index + 1}.</span>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {getStudentName(invoice.studentId)}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {invoice.feeItem || invoice.category || "Fee"} -{" "}
                                {invoice.category || "Uncategorized"}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Issued {new Date(invoice.createdAt).toLocaleDateString()}
                                {invoice.dueDate
                                  ? ` | Due ${new Date(invoice.dueDate).toLocaleDateString()}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm min-w-[18rem]">
                            <div className="rounded-lg bg-white border border-gray-100 p-3">
                              <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                                Invoice
                              </p>
                              <p className="font-bold text-gray-900 mt-1">
                                RM {formatMoney(invoice.amount)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white border border-gray-100 p-3">
                              <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                                Paid
                              </p>
                              <p className="font-bold text-green-600 mt-1">
                                RM {formatMoney(invoice.paidAmount)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white border border-gray-100 p-3">
                              <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                                Balance
                              </p>
                              <p className="font-bold text-orange-500 mt-1">
                                RM {formatMoney(invoice.outstandingAmount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
