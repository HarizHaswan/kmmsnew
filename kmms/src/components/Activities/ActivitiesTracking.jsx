import React, { useContext, useState, useEffect } from "react";
import { KMMSContext } from "../../context/KMMSContext";
import {
  Camera,
  Users,
  Trash2,
  Upload,
  Send
} from "lucide-react";

import {
  getActivities,
  addActivityApi,
  deleteActivityApi
} from "../../api/activities";

const ActivitiesTracking = ({ teacherId }) => {
  const { students } = useContext(KMMSContext);

  // Only students belonging to this teacher
  const myStudents = students.filter(
    (s) => String(s.teacherId) === String(teacherId)
  );

  const [activities, setActivities] = useState([]);

  const [form, setForm] = useState({
    studentId: "",
    activity: "",
    notes: "",
  });

  // Load activities for teacher's students
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getActivities();
        // Only include activities for THIS teacher's students
        const filtered = res.filter((a) =>
          myStudents.find((s) => s._id === a.studentId)
        );
        setActivities(filtered.reverse()); // recent first
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    };

    loadData();
  }, [students]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!form.studentId || !form.activity) return;

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      const newRec = await addActivityApi({
        studentId: form.studentId, // MongoDB _id
        activity: form.activity,
        notes: form.notes,
        date,
        time,
      });

      setActivities((prev) => [newRec, ...prev]);

      // Reset form
      setForm({
        studentId: "",
        activity: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving activity:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteActivityApi(id);
      setActivities((prev) => prev.filter((a) => a._id !== id));
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-800">Daily Activities</h2>

      {/* Record Activity Form */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-4">Record New Activity</h3>

        <div className="space-y-3">
          <select
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Select Student</option>
            {myStudents.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="activity"
            placeholder="Activity name (e.g., Art Class, Reading Time)"
            value={form.activity}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <textarea
            name="notes"
            placeholder="Notes or observations"
            value={form.notes}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            rows="3"
          />

          <div className="flex gap-2">
            <button className="flex-1 p-3 bg-brand-bg text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Photo
            </button>

            <button
              onClick={handleSave}
              className="flex-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Save Activity
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-bold mb-4">Recent Activities</h3>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-3">
              No activities recorded.
            </p>
          ) : (
            activities.map((act) => {
              const student = students.find(
                (s) => s._id === act.studentId
              );

              return (
                <div
                  key={act._id}
                  className="p-4 bg-gradient-to-r from-brand-bg to-indigo-50 rounded-lg border border-blue-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Camera className="w-5 h-5 text-indigo-600 mt-1" />

                      <div>
                        <p className="font-semibold text-indigo-900">
                          {student?.name}
                        </p>
                        <p className="text-sm text-indigo-600 font-medium">
                          {act.activity}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {act.notes}
                        </p>

                        <p className="text-xs text-gray-500 mt-2">
                          {act.date} • {act.time}
                        </p>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(act._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesTracking;
