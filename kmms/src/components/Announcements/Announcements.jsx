import React, { useEffect, useState } from "react";
import { Bell, Trash2, PlusCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
} from "../../api/announcements";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetRole: "all",
  });

  // Search + Filters + Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Safe user retrieval
  const saved = localStorage.getItem("kmms-user");
  const currentUser = saved ? JSON.parse(saved) : null;
  const role = currentUser?.role?.toLowerCase() || "";

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addAnnouncement(form);
      setShowForm(false);
      setForm({ title: "", message: "", targetRole: "all" });
      loadAnnouncements();
    } catch (err) {
      console.error("Failed to add announcement:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    loadAnnouncements();
  };

  if (loading) {
    return <p className="p-4 text-gray-600">Loading announcements...</p>;
  }

  // Filtering Logic
  const filtered = announcements
    .filter((a) => {
      // Frontend Role Filter (Only strictly applies if Admin uses the dropdown)
      if (roleFilter === "all") return true;
      return a.targetRole === roleFilter || a.targetRole === "all";
    })
    .filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.message.toLowerCase().includes(search.toLowerCase())
    );

  // Pagination
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-purple-600" />
          Announcements
        </h2>

        {/* Admin Only: Add Announcement */}
        {role === "admin" && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            New Announcement
          </button>
        )}
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search announcements..."
          className="flex-1 p-3 border rounded-lg"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* --- HIDE DROPDOWN IF NOT ADMIN --- */}
        {role === "admin" && (
          <select
            className="p-3 border rounded-lg"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">View All</option>
            <option value="teacher">Teacher Only</option>
            <option value="parent">Parent Only</option>
          </select>
        )}
      </div>

      {/* ADD ANNOUNCEMENT FORM (ADMIN ONLY) */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="text-lg font-semibold">Create Announcement</h3>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Title"
              className="w-full p-3 border rounded-lg"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <textarea
              placeholder="Message (Markdown supported)"
              className="w-full p-3 border rounded-lg"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />

            <select
              className="w-full p-3 border rounded-lg"
              value={form.targetRole}
              onChange={(e) =>
                setForm({ ...form, targetRole: e.target.value })
              }
            >
              <option value="all">All Users</option>
              <option value="teacher">Teachers Only</option>
              <option value="parent">Parents Only</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Post Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ANNOUNCEMENT LIST */}
      {paginated.map((a) => (
        <div
          key={a._id}
          className="bg-white p-4 rounded-xl shadow flex justify-between items-start"
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-lg">{a.title}</p>
              {/* Optional: Show Badge for Admins to know target audience */}
              {role === "admin" && a.targetRole !== "all" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-gray-500 border uppercase font-bold">
                  {a.targetRole}
                </span>
              )}
            </div>

            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-gray-800 mb-2">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-2">{children}</ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {a.message}
            </ReactMarkdown>

            <p className="text-xs text-gray-400 mt-1">
              {new Date(a.createdAt).toLocaleDateString()} •{" "}
              {a.createdBy?.name || "Admin"}
            </p>
          </div>

          {/* Admin Delete Button */}
          {role === "admin" && (
            <button
              onClick={() => handleDelete(a._id)}
              className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {/* PAGINATION */}
      {filtered.length > pageSize && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={start + pageSize >= filtered.length}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}