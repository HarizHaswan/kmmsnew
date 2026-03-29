import React, { useState, useEffect } from "react";
import { Loader2, Download, CheckCircle, Clock, Search, FileText } from "lucide-react";
import { getMySalaries } from "../../api/salary";

const TeacherPayslips = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSlip, setSelectedSlip] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getMySalaries();
            setSalaries(data);
        } catch (err) {
            console.error("Failed to fetch personal salary data:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSalaries = salaries.filter((s) =>
        s.month.toLowerCase().includes(search.toLowerCase()) ||
        s.year.toString().includes(search)
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading your payslips...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Payslips</h2>
                <p className="text-gray-500 text-sm mt-1">View your salary history and download payslips.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Search by month or year..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-sm outline-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSalaries.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        No payslips found matching your search.
                    </div>
                ) : (
                    filteredSalaries.map(salary => {
                        const netPay = salary.baseSalary + salary.allowance - salary.deduction;

                        return (
                            <div key={salary._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{salary.month} {salary.year}</h3>
                                        <p className="text-xs text-gray-400 mt-1">Generated {new Date(salary.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    {salary.status === 'paid' ? (
                                        <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                            <CheckCircle className="w-3.5 h-3.5" /> Paid
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                            <Clock className="w-3.5 h-3.5" /> Unpaid
                                        </span>
                                    )}
                                </div>

                                <div className="p-6 bg-white/50 flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-500">Net Pay</span>
                                        <span className="text-xl font-bold text-indigo-600">RM {netPay.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-white border-t border-gray-50 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setSelectedSlip(salary)}
                                        className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                                    >
                                        View Breakdown
                                    </button>
                                    {/* Note: In a real app, clicking Download would generate a PDF */}
                                    <button
                                        className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        disabled={salary.status !== 'paid'}
                                        onClick={() => alert("PDF download feature not implemented yet.")}
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {selectedSlip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="bg-indigo-600 p-6 text-white text-center">
                            <h3 className="text-2xl font-bold mb-1">Payslip</h3>
                            <p className="text-indigo-100 text-sm">{selectedSlip.month} {selectedSlip.year}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-500 text-sm">Base Salary</span>
                                <span className="font-semibold text-gray-900">RM {selectedSlip.baseSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-500 text-sm">Allowances</span>
                                <span className="font-semibold text-green-600">+RM {selectedSlip.allowance.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-500 text-sm">Deductions</span>
                                <span className="font-semibold text-red-600">-RM {selectedSlip.deduction.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center py-4 mt-2 bg-white rounded-xl px-4">
                                <span className="font-bold text-gray-700">Net Pay</span>
                                <span className="font-bold text-xl text-indigo-600">RM {(selectedSlip.baseSalary + selectedSlip.allowance - selectedSlip.deduction).toLocaleString()}</span>
                            </div>

                            <button
                                onClick={() => setSelectedSlip(null)}
                                className="w-full mt-4 bg-brand-bg hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherPayslips;
