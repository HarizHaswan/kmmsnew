import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Percent,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  Banknote,
  Receipt
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getClasses } from "../../api/classes";
import { getMonthlyStats } from "../../api/attendance";
import { getAllSalaries } from "../../api/salary";
import { getPayments } from "../../api/payments";
import { getInvoices } from "../../api/invoices";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("attendance");

  // --- ATTENDANCE STATE ---
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- FINANCIAL STATE (Live) ---
  const [finLoading, setFinLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [finMonth, setFinMonth] = useState(new Date().toISOString().slice(0, 7));

  // 1. Load Classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const data = await getClasses();
        setClasses(data || []);
        if (data && data.length > 0) setSelectedClassId(data[0]._id);
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    }
    loadClasses();
  }, []);

  // 2. Fetch Attendance Stats
  useEffect(() => {
    if (!selectedClassId || !selectedMonth) return;
    if (activeReport !== "attendance") return;
    async function fetchStats() {
      setLoading(true);
      try {
        const data = await getMonthlyStats(selectedClassId, selectedMonth);
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [selectedClassId, selectedMonth, activeReport]);

  // 3. Fetch Financial Data when tab switches
  useEffect(() => {
    if (activeReport !== "financial") return;
    async function fetchFinancials() {
      setFinLoading(true);
      try {
        const [payData, salData, invData] = await Promise.all([
          getPayments(),
          getAllSalaries(),
          getInvoices()
        ]);
        setPayments(payData || []);
        setSalaries(salData || []);
        setInvoices(invData || []);
      } catch (err) {
        console.error("Failed to load financial data", err);
      } finally {
        setFinLoading(false);
      }
    }
    fetchFinancials();
  }, [activeReport]);

  // --- FINANCIAL DERIVED METRICS ---
  const [filterYear, filterMonth] = finMonth.split("-");

  const filteredPayments = payments.filter(p => {
    const d = new Date(p.paidAt);
    return d.getFullYear() === Number(filterYear) && (d.getMonth() + 1) === Number(filterMonth);
  });

  const filteredSalaries = salaries.filter(s =>
    String(s.year) === filterYear && String(s.month).padStart(2, "0") === filterMonth
  );

  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalSalaryExpenses = filteredSalaries.reduce((sum, s) =>
    sum + (s.baseSalary || 0) + (s.allowance || 0) - (s.deduction || 0), 0);
  const netBalance = totalRevenue - totalSalaryExpenses;

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstanding = Math.max(0, totalInvoiced - totalPaid);

  const incomeItems = filteredPayments.map(p => ({
    id: p._id,
    desc: `Fee Payment — ${p.studentId?.name || "Student"}`,
    amount: p.amountPaid,
    date: new Date(p.paidAt).toLocaleDateString(),
    type: "income"
  }));

  const expenseItems = filteredSalaries.map(s => ({
    id: s._id,
    desc: `Salary — ${s.teacher?.name || "Teacher"} (${s.month}/${s.year})`,
    amount: (s.baseSalary || 0) + (s.allowance || 0) - (s.deduction || 0),
    date: s.paidAt ? new Date(s.paidAt).toLocaleDateString() : "Pending",
    type: "expense"
  }));

  const allTransactions = [...incomeItems, ...expenseItems]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const maxBar = Math.max(totalRevenue, totalSalaryExpenses, 1);
  const incomePct = Math.round((totalRevenue / maxBar) * 100);
  const expensePct = Math.round((totalSalaryExpenses / maxBar) * 100);

  return (
    <div className="space-y-6">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-500">Overview of school performance and finances</p>
        </div>

        <div className="bg-white p-1 rounded-lg border shadow-sm flex">
          <button
            onClick={() => setActiveReport("attendance")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeReport === "attendance" ? "bg-accent-light text-accent-dark shadow-sm" : "text-gray-600 hover:bg-white"
              }`}
          >
            Attendance Report
          </button>
          <button
            onClick={() => setActiveReport("financial")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeReport === "financial" ? "bg-green-100 text-green-700 shadow-sm" : "text-gray-600 hover:bg-white"
              }`}
          >
            Financial Report
          </button>
        </div>
      </div>

      {/* ======================= ATTENDANCE REPORT ======================= */}
      {activeReport === "attendance" && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Select Class</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-accent">
                <Users className="w-4 h-4 text-gray-400" />
                <select
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer w-full md:w-40"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.className}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="hidden md:block h-10 w-px bg-gray-200 mt-6"></div>
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Select Month</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-accent">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input type="month" className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer w-full md:w-auto"
                  value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>
          ) : stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-accent-light text-accent rounded-full"><Calendar className="w-6 h-6" /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Days Recorded</p><h3 className="text-2xl font-bold text-gray-900">{stats.totalDays}</h3></div>
                </CardContent></Card>
                <Card><CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-full ${stats.percentage >= 80 ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}><Percent className="w-6 h-6" /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Avg Attendance</p><h3 className="text-2xl font-bold text-gray-900">{stats.percentage}%</h3></div>
                </CardContent></Card>
                <Card><CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full"><CheckCircle className="w-6 h-6" /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Total Present</p><h3 className="text-2xl font-bold text-gray-900">{stats.totalPresent}</h3></div>
                </CardContent></Card>
                <Card><CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full"><XCircle className="w-6 h-6" /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Total Absent</p><h3 className="text-2xl font-bold text-gray-900">{stats.totalAbsent}</h3></div>
                </CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Monthly Overview</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Present ({stats.totalPresent})</span><span>Absent ({stats.totalAbsent})</span>
                    </div>
                    <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${stats.percentage}%` }} />
                      <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${100 - stats.percentage}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 text-center pt-2">Based on {stats.totalRecords} student records.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-dashed">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No attendance data found for this month.</p>
            </div>
          )}
        </div>
      )}

      {/* ======================= FINANCIAL REPORT (LIVE) ======================= */}
      {activeReport === "financial" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">

          {/* Month Filter */}
          <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Filter by Month</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input type="month" className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                  value={finMonth} onChange={e => setFinMonth(e.target.value)} />
              </div>
            </div>
            <p className="text-sm text-gray-500 md:ml-auto md:mt-5 italic">Data reflects transactions recorded for the selected month.</p>
          </div>

          {finLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-green-500" /></div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fee Revenue</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-2">RM {totalRevenue.toLocaleString()}</h3>
                        <p className="text-xs text-gray-400 mt-1">{filteredPayments.length} payment(s)</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-5 h-5" /></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Salary Expenses</p>
                        <h3 className="text-2xl font-bold text-red-500 mt-2">RM {totalSalaryExpenses.toLocaleString()}</h3>
                        <p className="text-xs text-gray-400 mt-1">{filteredSalaries.length} payslip(s)</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded-lg text-red-600"><Banknote className="w-5 h-5" /></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Net Balance</p>
                        <h3 className={`text-2xl font-bold mt-2 ${netBalance >= 0 ? "text-accent" : "text-red-600"}`}>
                          {netBalance < 0 ? "-" : ""}RM {Math.abs(netBalance).toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Revenue minus salaries</p>
                      </div>
                      <div className={`p-2 rounded-lg ${netBalance >= 0 ? "bg-brand-bg text-accent" : "bg-red-50 text-red-600"}`}>
                        {netBalance >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Outstanding Fees</p>
                        <h3 className="text-2xl font-bold text-orange-500 mt-2">RM {outstanding.toLocaleString()}</h3>
                        <p className="text-xs text-gray-400 mt-1">All-time unpaid invoices</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><AlertCircle className="w-5 h-5" /></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bar chart + Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-center gap-12 px-4 pb-4">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-green-700">RM {totalRevenue.toLocaleString()}</span>
                        <div className="w-16 bg-green-500 rounded-t-lg transition-all duration-700 hover:bg-green-600"
                          style={{ height: `${Math.max(incomePct, 4)}%`, minHeight: "8px" }} />
                        <span className="text-xs text-gray-500 font-medium">Income</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-red-600">RM {totalSalaryExpenses.toLocaleString()}</span>
                        <div className="w-16 bg-red-400 rounded-t-lg transition-all duration-700 hover:bg-red-500"
                          style={{ height: `${Math.max(expensePct, 4)}%`, minHeight: "8px" }} />
                        <span className="text-xs text-gray-500 font-medium">Expenses</span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-8 text-sm font-medium text-gray-600 border-t pt-4">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div>Income</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full"></div>Expenses</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>Transactions — {finMonth}</CardTitle></CardHeader>
                  <CardContent>
                    {allTransactions.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 italic">No transactions recorded for this month.</div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {allTransactions.map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-white transition-colors rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${t.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                {t.type === "income" ? <Receipt className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">{t.desc}</p>
                                <p className="text-xs text-gray-500">{t.date}</p>
                              </div>
                            </div>
                            <span className={`font-bold text-sm ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                              {t.type === "income" ? "+" : "-"} RM {t.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;