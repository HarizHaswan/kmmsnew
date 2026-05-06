import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  Loader2,
  Pencil,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import {
  createProgressReport,
  getProgressReports,
  updateProgressReport,
} from "../../api/progress";
import { getStudents } from "../../api/students";

const DEFAULT_FORM = {
  studentId: "",
  summary: "",
};

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const getStudentStatus = (student) =>
  String(student?.status || "active").toLowerCase();

const ProgressReports = ({ role, user }) => {
  const normalizedRole = String(role || "").toLowerCase();
  const isTeacher = normalizedRole === "teacher";
  const isParent = normalizedRole === "parent";

  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("all");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [normalizedRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentData, reportData] = await Promise.all([
        getStudents(),
        getProgressReports(),
      ]);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setReports(Array.isArray(reportData) ? reportData : []);
    } catch (error) {
      console.error("Failed to load progress reports", error);
      setStudents([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedStudents = useMemo(
    () =>
      [...students].sort((left, right) =>
        String(left.name || "").localeCompare(String(right.name || ""))
      ),
    [students]
  );

  const activeStudents = useMemo(
    () => sortedStudents.filter((student) => getStudentStatus(student) === "active"),
    [sortedStudents]
  );

  const filteredReports = useMemo(() => {
    const base = [...reports].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
    );

    if (selectedStudentFilter === "all") return base;

    return base.filter(
      (report) => getIdValue(report.studentId) === selectedStudentFilter
    );
  }, [reports, selectedStudentFilter]);

  const latestReportsByStudent = useMemo(
    () =>
      activeStudents.map((student) => {
        const studentReports = reports
          .filter((report) => getIdValue(report.studentId) === getIdValue(student))
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

        return {
          student,
          latestReport: studentReports[0] || null,
          reportCount: studentReports.length,
        };
      }),
    [activeStudents, reports]
  );

  const latestReportDate = reports[0]?.createdAt
    ? new Date(reports[0].createdAt).toLocaleDateString()
    : "No reports yet";

  const openCreateModal = (studentId = "") => {
    setEditingReport(null);
    setForm({
      studentId,
      summary: "",
    });
    setShowModal(true);
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setForm({
      studentId: getIdValue(report.studentId),
      summary: report.summary || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReport(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    try {
      if (editingReport) {
        await updateProgressReport(editingReport._id, form);
      } else {
        await createProgressReport(form);
      }

      closeModal();
      await fetchData();
    } catch (error) {
      alert("Failed to save progress report");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Progress Reports</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage progress reports for your class{user?.classAssigned ? `: ${user.classAssigned}` : ""}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateModal(activeStudents[0]?._id || "")}
            className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Progress Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Active Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{activeStudents.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Reports Written</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{reports.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Latest Update</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{latestReportDate}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Latest Reports by Student</h3>
              <p className="text-sm text-gray-500 mt-1">
                Each active student in your class can have a progress note and report history.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <UserRound className="w-4 h-4 text-gray-400" />
              <select
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={selectedStudentFilter}
                onChange={(event) => setSelectedStudentFilter(event.target.value)}
              >
                <option value="all">All Students</option>
                {activeStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {latestReportsByStudent.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No students found in your class.
            </div>
          ) : (
            <div className="space-y-4">
              {latestReportsByStudent
                .filter(({ student }) =>
                  selectedStudentFilter === "all"
                    ? true
                    : getIdValue(student) === selectedStudentFilter
                )
                .map(({ student, latestReport, reportCount }) => (
                  <div
                    key={student._id}
                    className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm items-start"
                  >
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-gray-900">{student.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {student.classId?.className || user?.classAssigned || "Assigned Class"}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          {reportCount} report{reportCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      {latestReport ? (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(latestReport.createdAt).toLocaleDateString()}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {latestReport.summary}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                          No progress report written yet for this student.
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 w-full md:w-auto md:min-w-[140px] pt-1">
                      <button
                        type="button"
                        onClick={() => openCreateModal(student._id)}
                        className="flex-1 md:flex-none w-full px-3 py-2 rounded-xl border border-accent/20 text-accent font-medium text-sm hover:bg-accent/5 flex justify-center items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> New Report
                      </button>
                      {latestReport && (
                        <button
                          type="button"
                          onClick={() => openEditModal(latestReport)}
                          className="flex-1 md:flex-none w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                          <Pencil className="w-4 h-4" /> Edit Latest
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Report History</h3>
            <p className="text-sm text-gray-500 mt-1">
              Recent reports written for your class.
            </p>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No reports found.</div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="w-3.5 h-3.5" />
                      {report.studentId?.name || "Student"}
                      <span>•</span>
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(report.createdAt).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(report)}
                    className="self-start px-3 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-white flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingReport ? "Edit Progress Report" : "Create Progress Report"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Save a progress note for a student in your class.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm bg-white"
                    value={form.studentId}
                    onChange={(event) =>
                      setForm({ ...form, studentId: event.target.value })
                    }
                    required
                  >
                    <option value="">Select student...</option>
                    {activeStudents.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Summary
                  </label>
                  <textarea
                    rows="8"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Write the student's learning progress, strengths, behavior, and any follow-up notes..."
                    value={form.summary}
                    onChange={(event) =>
                      setForm({ ...form, summary: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-xl font-medium"
                  >
                    {formSubmitting
                      ? "Saving..."
                      : editingReport
                        ? "Update Report"
                        : "Create Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Reports</h2>
          <p className="text-gray-500 text-sm mt-1">
            View your child&apos;s learning updates and teacher progress notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Children Linked</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{students.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Reports Available</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{reports.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Latest Report</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{latestReportDate}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Child Reports</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select a child to focus on a specific report history.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <UserRound className="w-4 h-4 text-gray-400" />
              <select
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={selectedStudentFilter}
                onChange={(event) => setSelectedStudentFilter(event.target.value)}
              >
                <option value="all">All Children</option>
                {sortedStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
              No progress reports available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">
                        {report.studentId?.name || "Student"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.studentId?.classId?.className || "Class not assigned"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                      {report.teacherId?.name || "Teacher"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(report.createdAt).toLocaleString()}
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {report.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
      Progress reports are not available for this role.
    </div>
  );
};

export default ProgressReports;
