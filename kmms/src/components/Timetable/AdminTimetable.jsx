import React, { useState, useEffect } from "react";
import { Plus, Save, Calendar, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/use-toast"; // Ensure you have this or use alert()

import TimetableGrid from "./TimetableGrid";
import { getClasses } from "../../api/classes";
import { getTeachers } from "../../api/teachers";
import {
  getTimetableByClass,
  createTimetable,
  deleteTimetable
} from "../../api/timetables"; // Import real API functions

export default function AdminTimetable() {
  const { toast } = useToast(); // Optional: specific toast notification
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [timetableData, setTimetableData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fetchingTimetable, setFetchingTimetable] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    day: "Monday",
    startTime: "08:00",
    endTime: "09:00",
    subject: "",
    teacher: "", // This will store the teacher's NAME for display, or ID if you prefer
  });

  // 1. Fetch Classes & Teachers on Mount
  useEffect(() => {
    async function loadData() {
      try {
        const [classesData, teachersData] = await Promise.all([
          getClasses(),
          getTeachers(),
        ]);
        setClasses(classesData || []);
        setTeachers(teachersData || []);

        // Default to first class
        if (classesData && classesData.length > 0) {
          setSelectedClassId(classesData[0]._id);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Fetch Timetable when Class changes
  useEffect(() => {
    if (!selectedClassId) return;

    async function fetchSlots() {
      setFetchingTimetable(true);
      try {
        const data = await getTimetableByClass(selectedClassId);
        setTimetableData(data || []);
      } catch (err) {
        console.error("Failed to load timetable", err);
        setTimetableData([]);
      } finally {
        setFetchingTimetable(false);
      }
    }

    fetchSlots();
  }, [selectedClassId]);

  // 3. Handle Add Slot (Backend Integration)
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.startTime || !formData.endTime || !selectedClassId) return;

    try {
      // Find the teacher object to send the ID if needed, 
      // OR just send the name if your backend expects a name string.
      // Based on your controller: it expects "teacherId". 
      // If your form stores the "Name" string, you need to find the ID.
      const selectedTeacherObj = teachers.find(t => t.name === formData.teacher);

      const payload = {
        classId: selectedClassId,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject,
        teacherId: selectedTeacherObj ? selectedTeacherObj._id : null,
        // If your backend schema allows teacher name strings, change above line.
        // But usually it's an ObjectId reference.
      };

      await createTimetable(payload);

      // Refresh list
      const updatedData = await getTimetableByClass(selectedClassId);
      setTimetableData(updatedData);

      // Reset Form
      setFormData({
        ...formData,
        subject: "",
        // teacher: "", // Optional: keep teacher selected for faster entry
      });

      if (toast) toast({ title: "Success", description: "Slot added successfully" });

    } catch (err) {
      console.error("Failed to add slot", err);
      alert("Error adding slot. Please check console.");
    }
  };

  // 4. Handle Delete Slot (Backend Integration)
  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;

    try {
      await deleteTimetable(slotId);

      // Remove from UI immediately
      setTimetableData((prev) => prev.filter((slot) => slot._id !== slotId && slot.id !== slotId));

    } catch (err) {
      console.error("Failed to delete slot", err);
      alert("Failed to delete session.");
    }
  };

  if (loading) return <div className="p-6">Loading data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Timetable Management</h2>
      </div>

      {/* --- CLASS TABS --- */}
      <div className="bg-white p-5 rounded-lg border shadow-sm flex flex-col gap-5">
        {classes.length > 0 ? (
          [4, 5, 6, "Other"].map((age) => {
            // Group by yearGroup if it exists, otherwise extract from className leading number
            const ageClasses = classes.filter(c => {
              const parsedYear = c.yearGroup || parseInt((c.className || c.name || "").charAt(0));
              let determinedAge = [4, 5, 6].includes(parsedYear) ? parsedYear : "Other";
              return determinedAge === age;
            });

            if (ageClasses.length === 0) return null;

            return (
              <div key={age} className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {age === "Other" ? "Other Classes" : `${age} Years Old`}
                </h3>
                <div className="flex flex-wrap gap-2 border-l-2 border-primary-light pl-3">
                  {ageClasses.sort((a, b) => (a.className || a.name || "").localeCompare(b.className || b.name || "")).map((cls) => (
                    <button
                      key={cls._id}
                      onClick={() => setSelectedClassId(cls._id)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedClassId === cls._id
                        ? "bg-primary-light text-primary-dark border border-primary-light shadow-sm font-bold"
                        : "bg-white text-gray-600 hover:bg-brand-bg border border-gray-100 shadow-sm"
                        }`}
                    >
                      Class {cls.className || cls.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-sm text-gray-500 px-4">No classes found. Add a class first.</span>
        )}
      </div>

      {/* --- ADD SESSION FORM (top, horizontal layout) --- */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">Add Session</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleAddSlot} className="flex flex-wrap gap-4 items-end">
            {/* Day */}
            <div className="space-y-1 min-w-[130px]">
              <label className="text-xs font-semibold text-gray-500 uppercase">Day</label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {/* Start Time */}
            <div className="space-y-1 min-w-[110px]">
              <label className="text-xs font-semibold text-gray-500 uppercase">Start</label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            {/* End Time */}
            <div className="space-y-1 min-w-[110px]">
              <label className="text-xs font-semibold text-gray-500 uppercase">End</label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
            {/* Subject */}
            <div className="space-y-1 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-gray-500 uppercase">Subject</label>
              <Input
                placeholder="e.g. Mathematics"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            {/* Teacher */}
            <div className="space-y-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-500 uppercase">Teacher</label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            {/* Submit */}
            <Button type="submit" className="bg-primary hover:bg-primary-dark px-5 whitespace-nowrap">
              <Plus className="h-6 w-20 mr-2" /> Add Slot
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- PREVIEW (full width below form) --- */}
      <Card className="min-h-[500px]">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex justify-between items-center text-lg">
            <span>
              Preview: {classes.find(c => c._id === selectedClassId)?.className || "Class"}
            </span>
            <span className="text-sm font-normal text-gray-500 flex items-center">
              {fetchingTimetable && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Calendar className="w-4 h-4 inline mr-1" />
              Weekly Schedule
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <TimetableGrid
            slots={timetableData.map(slot => ({
              ...slot,
              teacher: slot.teacherId?.name || "Unknown Teacher",
              id: slot._id
            }))}
            onDeleteSlot={handleDeleteSlot}
          />
        </CardContent>
      </Card>
    </div>
  );
}