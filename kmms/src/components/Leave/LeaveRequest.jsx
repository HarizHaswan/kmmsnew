import React, { useState, useEffect, useRef } from "react";
import { Loader2, Calendar, FileText, CheckCircle, XCircle, Clock, Upload, Paperclip } from "lucide-react";
import { submitLeaveRequest, getMyLeaves, uploadAttachment, addLeaveAttachment } from "../../api/leaves";

const LeaveRequest = ({ teacherId }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    reason: "",
    startDate: "",
    endDate: "",
    attachment: null,
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await getMyLeaves();
      setLeaves(data);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev) => ({
        ...prev,
        attachment: e.target.files[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason || !form.startDate || !form.endDate) return;

    setSubmitting(true);
    setError("");

    try {
      let attachmentUrl = null;
      if (form.attachment) {
        const formData = new FormData();
        formData.append("file", form.attachment);
        const uploadRes = await uploadAttachment(formData);
        attachmentUrl = uploadRes.url;
      }

      await submitLeaveRequest({
        reason: form.reason,
        startDate: form.startDate,
        endDate: form.endDate,
        attachment: attachmentUrl
      });

      setForm({ reason: "", startDate: "", endDate: "", attachment: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchLeaves(); // Refresh list
    } catch (err) {
      console.error("Failed to submit leave:", err);
      setError("Failed to submit leave request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFromList = async (leaveId, file) => {
    if (!file) return;
    try {
      setLeaves(leaves.map(l => l._id === leaveId ? { ...l, uploadingAttachment: true } : l));
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await uploadAttachment(formData);

      await addLeaveAttachment(leaveId, uploadRes.url);
      fetchLeaves();
    } catch (err) {
      console.error("Failed to upload attachment from list", err);
      setError("Failed to upload attachment to existing request.");
      fetchLeaves(); // reset loaders
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading leave requests...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Requests</h2>
          <p className="text-gray-500 text-sm mt-1">Submit and track your leave applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <FileText className="w-5 h-5" />
              <h3 className="font-bold text-lg">New Application</h3>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
                <textarea
                  name="reason"
                  placeholder="Please describe why you need leave..."
                  value={form.reason}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                  rows="4"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Certificate (Optional)</label>
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-medium
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100 transition-colors
                      cursor-pointer border border-gray-200 rounded-xl pr-3"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            My History <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{leaves.length}</span>
          </h3>

          {leaves.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-gray-900 font-medium">No leave requests found</h4>
              <p className="text-gray-500 text-sm mt-1">Your leave history will appear here once you submit a request.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Attachment</th>
                      <th className="px-6 py-4">Submitted</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaves.map((leave) => (
                      <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">
                              {new Date(leave.startDate).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-400">
                              to {new Date(leave.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {leave.attachment ? (
                            <a
                              href={`http://localhost:5000${leave.attachment}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 font-medium bg-indigo-50 px-2 py-1.5 rounded-lg w-max"
                            >
                              <Paperclip className="w-3 h-3" /> View Document
                            </a>
                          ) : (
                            leave.status === "approved" ? (
                              leave.uploadingAttachment ? (
                                <span className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>
                              ) : (
                                <label className="text-indigo-600 hover:text-indigo-800 cursor-pointer text-xs flex items-center gap-1 font-medium bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg transition-colors w-max">
                                  <Upload className="w-3 h-3" /> Add Certificate
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => handleUploadFromList(leave._id, e.target.files[0])}
                                  />
                                </label>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs italic">No attachment</span>
                            )
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {new Date(leave.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            {getStatusBadge(leave.status)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
