import React, { useState, useEffect } from "react";
import { DollarSign, Download, Plus, CheckCircle, Clock, FileText, X, UploadCloud, Paperclip } from "lucide-react";
import { getInvoices, createInvoice, updateInvoice } from "../../api/invoices";
import { getPayments, createPayment, uploadPaymentReceipt } from "../../api/payments";
import { getStudents } from "../../api/students";

const PaymentManagement = ({ userId, role }) => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState("invoices"); // invoices | ledger
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showParentPayModal, setShowParentPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({ studentId: "", amount: "", category: "Tuition", dueDate: "" });
  const [paymentForm, setPaymentForm] = useState({ amountPaid: "", method: "Cash", note: "" });
  const [parentPayForm, setParentPayForm] = useState({ amountPaid: "", receipt: null });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [role, userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invData, payData, studData] = await Promise.all([
        getInvoices(),
        getPayments(),
        getStudents()
      ]);

      // Filter for parents
      if (role === "Parent" || role === "parent") {
        // Backend already filters studData to only include the parent's children
        const parentChildren = studData.map(s => String(s._id || s.id));

        // Ensure studentId exists and matches
        setInvoices(invData.filter(i => {
          const sid = String(i.studentId?._id || i.studentId);
          return parentChildren.includes(sid);
        }));
        setPayments(payData.filter(p => {
          const sid = String(p.studentId?._id || p.studentId);
          return parentChildren.includes(sid);
        }));
        setStudents(studData);
      } else {
        setInvoices(invData);
        setPayments(payData);
        setStudents(studData);
      }
    } catch (err) {
      console.error("Failed to load payment data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await createInvoice({
        studentId: invoiceForm.studentId,
        amount: Number(invoiceForm.amount),
        category: invoiceForm.category,
        dueDate: invoiceForm.dueDate || undefined
      });
      setShowInvoiceModal(false);
      setInvoiceForm({ studentId: "", amount: "", category: "Tuition", dueDate: "" });
      fetchData();
    } catch (err) {
      alert("Failed to create invoice");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const amountPaid = Number(paymentForm.amountPaid);
      // Create payment record
      await createPayment({
        invoiceId: selectedInvoice._id,
        studentId: selectedInvoice.studentId._id || selectedInvoice.studentId,
        amountPaid,
        method: paymentForm.method,
        note: paymentForm.note
      });

      // Update invoice status logic
      // Simplification: assume full payment marks as paid. If partial, just mark as partial.
      // We should sum up existing payments for this invoice... but for visual sake, we determine status heuristically here.
      const totalPaidSoFar = payments.filter(p => p.invoiceId?._id === selectedInvoice._id || p.invoiceId === selectedInvoice._id).reduce((acc, curr) => acc + curr.amountPaid, 0);
      const newTotal = totalPaidSoFar + amountPaid;

      let newStatus = selectedInvoice.status;
      if (newTotal >= selectedInvoice.amount) {
        newStatus = "paid";
      } else if (newTotal > 0) {
        newStatus = "partial";
      }

      if (newStatus !== selectedInvoice.status) {
        await updateInvoice(selectedInvoice._id, { status: newStatus });
      }

      setShowPaymentModal(false);
      setPaymentForm({ amountPaid: "", method: "Cash", note: "" });
      fetchData();
    } catch (err) {
      alert("Failed to record payment");
    } finally {
      setFormSubmitting(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const totalPaidSoFar = payments.filter(p => p.invoiceId?._id === invoice._id || p.invoiceId === invoice._id).reduce((acc, curr) => acc + curr.amountPaid, 0);
    const balance = Math.max(0, invoice.amount - totalPaidSoFar);

    setPaymentForm(prev => ({ ...prev, amountPaid: balance }));
    setShowPaymentModal(true);
  };

  const openParentPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    const totalPaidSoFar = payments.filter(p => p.invoiceId?._id === invoice._id || p.invoiceId === invoice._id).reduce((acc, curr) => acc + curr.amountPaid, 0);
    const balance = Math.max(0, invoice.amount - totalPaidSoFar);

    setParentPayForm({ amountPaid: balance, receipt: null });
    setShowParentPayModal(true);
  };

  const handleParentPaySubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    let receiptUrl = null;

    try {
      if (parentPayForm.receipt) {
        const formData = new FormData();
        formData.append("file", parentPayForm.receipt);
        const uploadRes = await uploadPaymentReceipt(formData);
        receiptUrl = uploadRes.url;
      }

      const amountPaid = Number(parentPayForm.amountPaid);
      await createPayment({
        invoiceId: selectedInvoice._id,
        studentId: selectedInvoice.studentId._id || selectedInvoice.studentId,
        amountPaid,
        method: "Bank Transfer",
        note: "Parent Payment Upload",
        receiptUrl
      });

      const totalPaidSoFar = payments.filter(p => p.invoiceId?._id === selectedInvoice._id || p.invoiceId === selectedInvoice._id).reduce((acc, curr) => acc + curr.amountPaid, 0);
      const newTotal = totalPaidSoFar + amountPaid;

      let newStatus = selectedInvoice.status;
      if (newTotal >= selectedInvoice.amount) {
        newStatus = "paid";
      } else if (newTotal > 0) {
        newStatus = "partial";
      }

      if (newStatus !== selectedInvoice.status) {
        await updateInvoice(selectedInvoice._id, { status: newStatus });
      }

      setShowParentPayModal(false);
      setParentPayForm({ amountPaid: "", receipt: null });
      fetchData();
    } catch (err) {
      alert("Failed to submit payment");
    } finally {
      setFormSubmitting(false);
    }
  };

  // derived metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPending = Math.max(0, totalInvoiced - totalPaid);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading ledger data...</div>;
  }

  const isAdmin = role.toLowerCase() === "admin";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payment & Ledger</h2>
          <p className="text-gray-500 text-sm mt-1">{isAdmin ? "Manage invoices and track school revenue." : "Track your child's fees and payments."}</p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-green-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">RM {totalPaid.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-yellow-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding Fes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">RM {totalPending.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue (Invoiced)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">RM {totalInvoiced.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg"><FileText className="w-6 h-6 text-indigo-600" /></div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "invoices"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Invoices / Fees
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "ledger"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Payment Ledger
          </button>
        </nav>
      </div>

      {/* INVOICES TAB */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date Issued</th>
                {isAdmin && <th className="px-6 py-4">Receipt</th>}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No invoices found.</td></tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-white transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {inv.studentId?.name || students.find(s => s._id === inv.studentId)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                        {inv.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">RM {inv.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max ${inv.status === "paid" ? "bg-green-100 text-green-800" :
                        inv.status === "partial" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                        {inv.status === "paid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {(() => {
                          const invPayments = payments.filter(p => String(p.invoiceId?._id || p.invoiceId) === String(inv._id));
                          const withReceipt = invPayments.find(p => p.receiptUrl);
                          if (withReceipt) {
                            return (
                              <a href={`http://localhost:5000${withReceipt.receiptUrl}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition">
                                <Paperclip className="w-3.5 h-3.5" /> View Receipt
                              </a>
                            );
                          }
                          return <span className="text-gray-400 text-xs italic">None</span>;
                        })()}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      {isAdmin && inv.status !== "paid" ? (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="text-xs bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                        >
                          Record Payment
                        </button>
                      ) : isAdmin ? (
                        <span className="text-xs text-gray-400 font-medium">Cleared</span>
                      ) : (
                        // Parent view actions
                        inv.status !== "paid" ? (
                          <button
                            onClick={() => openParentPayModal(inv)}
                            className="text-xs bg-green-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Cleared</span>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LEDGER TAB */}
      {activeTab === "ledger" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4 text-right font-bold text-gray-900">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No payments found.</td></tr>
              ) : (
                payments.map(pay => {
                  let studName = "Unknown";
                  // the DB stores student as a ref or ID, we find it
                  if (pay.studentId?._id) studName = pay.studentId.name;
                  else {
                    const st = students.find(s => s._id === pay.studentId || s.id === pay.studentId);
                    if (st) studName = st.name;
                  }

                  return (
                    <tr key={pay._id} className="hover:bg-white transition-colors">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(pay.paidAt).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-gray-700">{pay.method}</td>
                      <td className="px-6 py-4 text-gray-900">{studName}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{pay.note || "-"}</td>
                      <td className="px-6 py-4">
                        {pay.receiptUrl ? (
                          <a href={`http://localhost:5000${pay.receiptUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-lg">
                            <Paperclip className="w-3.5 h-3.5" /> View
                          </a>
                        ) : <span className="text-gray-400 text-xs italic">N/A</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">RM {pay.amountPaid}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                  value={invoiceForm.studentId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RM)</label>
                  <input type="number" required
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={invoiceForm.category} onChange={e => setInvoiceForm({ ...invoiceForm, category: e.target.value })} >
                    <option value="Tuition">Tuition</option>
                    <option value="Registration">Registration</option>
                    <option value="Materials">Materials</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                <input type="date"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={invoiceForm.dueDate} onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium">Issue Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h3>
            <div className="mb-4 space-y-1 text-sm bg-white p-3 rounded-lg border border-gray-200">
              <p><span className="text-gray-500">Invoice Amount:</span> <strong className="float-right text-gray-900">RM {selectedInvoice.amount}</strong></p>
              <p><span className="text-gray-500">Student:</span> <strong className="float-right text-gray-900">{selectedInvoice.studentId?.name || students.find(s => s._id === selectedInvoice.studentId)?.name || 'Unknown'}</strong></p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (RM)</label>
                  <input type="number" required
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                    value={paymentForm.amountPaid} onChange={e => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })} >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reference (Optional)</label>
                <input type="text" placeholder="e.g. Txn #123456"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  value={paymentForm.note} onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium">Record Payment</button>
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
              <button onClick={() => setShowParentPayModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-6 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <img src="/qr_code.png" alt="Static QR" className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl shadow-sm bg-white p-2 flex-shrink-0" />
              <div className="text-center sm:text-left flex flex-col justify-center h-full sm:mt-6">
                <p className="font-bold text-indigo-900 text-lg">Tadika Khalifah Muda</p>
                <p className="text-base font-semibold text-indigo-800 font-mono mt-2 bg-indigo-100 inline-block px-3 py-1.5 rounded-lg">Maybank: 1122 3344 5566</p>
                <p className="text-sm text-indigo-600 mt-4 leading-relaxed">Scan the QR code to the left or transfer manually to the account above.</p>
              </div>
            </div>

            <form onSubmit={handleParentPaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paying Amount (RM)</label>
                <input type="number" required readOnly
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none cursor-not-allowed font-bold"
                  value={parentPayForm.amountPaid} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt Image/PDF</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl relative group hover:border-indigo-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="receipt-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input id="receipt-upload" name="receipt-upload" type="file" className="sr-only" required
                          onChange={(e) => setParentPayForm({ ...parentPayForm, receipt: e.target.files[0] })} />
                      </label>
                    </div>
                    {parentPayForm.receipt && <p className="text-xs text-green-600 font-medium break-all">{parentPayForm.receipt.name}</p>}
                    {!parentPayForm.receipt && <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={formSubmitting} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 flex justify-center items-center gap-2">
                  {formSubmitting ? "Uploading..." : "Submit Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentManagement;
