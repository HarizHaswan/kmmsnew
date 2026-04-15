import React, { useState, useEffect } from "react";
import { Loader2, Plus, CheckCircle, Clock, Search, Edit2, Check } from "lucide-react";
import { getAllSalaries, generateSalary, paySalary, updateSalary } from "../../api/salary";
import { getTeachers } from "../../api/teachers";

const AdminPayroll = () => {
    const [salaries, setSalaries] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal for generating
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ baseSalary: 0, allowance: 0, deduction: 0 });

    const [form, setForm] = useState({
        teacher: "",
        baseSalary: "",
        allowance: "0",
        deduction: "0",
        month: new Date().toLocaleString("default", { month: "long" }),
        year: new Date().getFullYear(),
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [salaryData, teacherData] = await Promise.all([
                getAllSalaries(),
                getTeachers(),
            ]);
            setSalaries(salaryData);
            setTeachers(teacherData);
        } catch (err) {
            console.error("Failed to fetch payroll data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!form.teacher || !form.baseSalary || !form.month || !form.year) {
            setError("Missing required fields.");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            await generateSalary({
                teacher: form.teacher,
                baseSalary: Number(form.baseSalary),
                allowance: Number(form.allowance),
                deduction: Number(form.deduction),
                month: form.month,
                year: Number(form.year)
            });
            setShowModal(false);
            setForm({ ...form, teacher: "", baseSalary: "", allowance: "0", deduction: "0" });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate salary");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePay = async (id) => {
        if (!window.confirm("Mark this salary as Paid?")) return;
        try {
            await paySalary(id);
            fetchData();
        } catch (err) {
            alert("Failed to pay salary");
        }
    };

    const startEditing = (salary) => {
        if (salary.status === 'paid') return;
        setEditingId(salary._id);
        setEditForm({
            baseSalary: salary.baseSalary,
            allowance: salary.allowance,
            deduction: salary.deduction
        });
    };

    const saveEdit = async (id) => {
        try {
            await updateSalary(id, {
                baseSalary: Number(editForm.baseSalary),
                allowance: Number(editForm.allowance),
                deduction: Number(editForm.deduction)
            });
            setEditingId(null);
            fetchData();
        } catch (err) {
            alert("Failed to update salary");
        }
    };

    const stats = {
        unpaid: salaries.filter(s => s.status === 'unpaid').length,
        paid: salaries.filter(s => s.status === 'paid').length,
        totalPaidAmount: salaries.filter(s => s.status === 'paid').reduce((acc, curr) => acc + (curr.baseSalary + curr.allowance - curr.deduction), 0)
    };

    const filteredSalaries = salaries.filter((s) =>
        s.teacher?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.month.toLowerCase().includes(search.toLowerCase())
    );

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading payroll data...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Generate and manage teacher salaries</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Generate Payslip
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Unpaid Slips</p>
                        <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.unpaid}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                        <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Paid Slips</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Payouts</p>
                        <p className="text-2xl font-bold text-primary mt-1">RM {stats.totalPaidAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-primary-light rounded-lg">
                        <span className="text-xl font-bold text-primary">RM</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Search by teacher name or month..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-sm outline-none"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4 w-10">#</th>
                                <th className="px-6 py-4">Teacher</th>
                                <th className="px-6 py-4">Period</th>
                                <th className="px-6 py-4 text-right">Base (RM)</th>
                                <th className="px-6 py-4 text-right">Allowances</th>
                                <th className="px-6 py-4 text-right">Deductions</th>
                                <th className="px-6 py-4 text-right">Net Pay</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSalaries.length === 0 ? (
                                <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-500">No salary records found.</td></tr>
                            ) : (
                                filteredSalaries.map((salary, index) => {
                                    const isEditing = editingId === salary._id;
                                    const base = isEditing ? Number(editForm.baseSalary) : salary.baseSalary;
                                    const allow = isEditing ? Number(editForm.allowance) : salary.allowance;
                                    const deduc = isEditing ? Number(editForm.deduction) : salary.deduction;
                                    const net = base + allow - deduc;

                                    return (
                                        <tr key={salary._id} className="hover:bg-white transition-colors">
                                            <td className="px-6 py-4 text-gray-400 font-bold text-sm select-none">{index + 1}.</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{salary.teacher?.name || 'Unknown'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="bg-primary-light text-primary-dark px-2 py-1 rounded-md font-medium text-xs">
                                                    {salary.month} {salary.year}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isEditing ? (
                                                    <input type="number" className="w-20 border rounded px-1 text-right" value={editForm.baseSalary} onChange={(e) => setEditForm({ ...editForm, baseSalary: e.target.value })} />
                                                ) : salary.baseSalary.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-600 font-medium">
                                                {isEditing ? (
                                                    <input type="number" className="w-20 border rounded px-1 text-right" value={editForm.allowance} onChange={(e) => setEditForm({ ...editForm, allowance: e.target.value })} />
                                                ) : `+${salary.allowance.toLocaleString()}`}
                                            </td>
                                            <td className="px-6 py-4 text-right text-red-600 font-medium">
                                                {isEditing ? (
                                                    <input type="number" className="w-20 border rounded px-1 text-right" value={editForm.deduction} onChange={(e) => setEditForm({ ...editForm, deduction: e.target.value })} />
                                                ) : `-${salary.deduction.toLocaleString()}`}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                {net.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {salary.status === 'paid' ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Paid</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium"><Clock className="w-3 h-3" /> Unpaid</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isEditing ? (
                                                        <button onClick={() => saveEdit(salary._id)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Save">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        salary.status === 'unpaid' && (
                                                            <>
                                                                <button onClick={() => startEditing(salary)} className="p-1.5 bg-white text-gray-600 rounded-lg hover:bg-brand-bg" title="Edit Amounts">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handlePay(salary._id)} className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700" title="Mark as Paid">
                                                                    Mark Paid
                                                                </button>
                                                            </>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Generate Payslip</h3>
                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-sm bg-white"
                                    value={form.teacher}
                                    onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                                    required
                                >
                                    <option value="">Select a teacher...</option>
                                    {teachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-sm bg-white"
                                        value={form.month}
                                        onChange={(e) => setForm({ ...form, month: e.target.value })}
                                        required
                                    >
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                        value={form.year}
                                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (RM)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                    value={form.baseSalary}
                                    onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (RM)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                        value={form.allowance}
                                        onChange={(e) => setForm({ ...form, allowance: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (RM)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-sm"
                                        value={form.deduction}
                                        onChange={(e) => setForm({ ...form, deduction: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 flex justify-center items-center"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayroll;
