import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Clock, Search, Filter, Paperclip } from "lucide-react";
import { getAllLeaves, updateLeaveStatus } from "../../api/leaves";

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // ID of the request currently being updated
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await getAllLeaves();
      setLeaves(data);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, action) => {
    setUpdating(id);
    try {
      await updateLeaveStatus(id, action);
      // Refresh list to get updated status
      await fetchLeaves();
    } catch (err) {
      console.error(`Failed to ${action} leave request:`, err);
      alert(`Failed to ${action} leave request. Please try again.`);
    } finally {
      setUpdating(null);
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

  const filteredLeaves = leaves.filter((leave) => {
    const matchesFilter = filter === "all" || leave.status === filter;
    const matchesSearch =
      leave.teacher?.name.toLowerCase().includes(search.toLowerCase()) ||
      leave.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-500 text-sm mt-1">Review and manage teacher leave applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Approved Leaves</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Rejected Requests</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by teacher name or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-2 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leave Request List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Attachment</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No leave requests match your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{req.teacher?.name || "Unknown Teacher"}</span>
                        <span className="text-xs text-gray-400">{req.teacher?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">
                          {new Date(req.startDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          to {new Date(req.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req.attachment ? (
                        <a
                          href={`http://localhost:5000${req.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 font-medium bg-indigo-50 px-2 py-1.5 rounded-lg w-max"
                        >
                          <Paperclip className="w-3 h-3" /> View Document
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No attachment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDecision(req._id, "approve")}
                            disabled={updating === req._id}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                            title="Approve"
                          >
                            {updating === req._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDecision(req._id, "reject")}
                            disabled={updating === req._id}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            title="Reject"
                          >
                            {updating === req._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
