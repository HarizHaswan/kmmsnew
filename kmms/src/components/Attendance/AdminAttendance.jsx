import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Save, Calendar, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { getClasses } from "../../api/classes";
import { getAttendance, saveAttendance } from "../../api/attendance";
import LiveDateTime from "../Common/LiveDateTime";

export default function AdminAttendance() {
  const { toast } = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Load All Classes
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

  // 2. Load Attendance (FIXED: Filter Active Only)
  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    async function fetchData() {
      setLoading(true);
      try {
        const data = await getAttendance(selectedDate, selectedClassId);

        const activeRecords = data.records
          .map(r => {
            // Handle populated student object
            const studentObj = r.studentId || {};
            return {
              studentId: studentObj._id || r.studentId,
              name: studentObj.name || "Unknown",
              status: r.status || "Present",
              reason: r.reason || "",
              // Capture student account status (active/graduated/withdrawn)
              accountStatus: studentObj.status || "active"
            };
          })
          // FILTER: Only show "active" students
          .filter(r => r.accountStatus.toLowerCase() === "active");

        setAttendanceRecords(activeRecords);
      } catch (err) {
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedClassId, selectedDate]);

  const handleStatusChange = (index, newStatus) => {
    const newRecords = [...attendanceRecords];
    if (newRecords[index].status !== newStatus) {
      newRecords[index].status = newStatus;
      if (newStatus === "Present") newRecords[index].reason = "";
      setAttendanceRecords(newRecords);
    }
  };

  const handleReasonChange = (index, value) => {
    const newRecords = [...attendanceRecords];
    newRecords[index].reason = value;
    setAttendanceRecords(newRecords);
  };

  const handleSave = async () => {
    try {
      const payload = {
        date: selectedDate,
        classId: selectedClassId,
        records: attendanceRecords.map(r => ({
          studentId: r.studentId,
          status: r.status,
          reason: r.reason
        }))
      };
      await saveAttendance(payload);
      toast({ title: "Success", description: "Attendance saved!" });
    } catch (err) {
      alert("Failed to save.");
    }
  };

  return (
    <div className="space-y-6">
      <LiveDateTime />
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Attendance (Admin)</h2>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input
            type="date" className="border rounded-md p-2 text-sm"
            value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Button onClick={handleSave} className="bg-primary hover:bg-primary-dark ml-2">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      {/* Admin Tabs Grouped by Year */}
      <div className="bg-white p-5 rounded-lg border shadow-sm flex flex-col gap-5">
        {classes.length > 0 ? (
          [4, 5, 6, "Other"].map((age) => {
            // Group by yearGroup if it exists, otherwise extract from className leading number
            const ageClasses = classes.filter(c => {
               const parsedYear = c.yearGroup || parseInt(c.className.charAt(0));
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
                  {ageClasses.sort((a, b) => a.className.localeCompare(b.className)).map((cls) => (
                    <button
                      key={cls._id}
                      onClick={() => setSelectedClassId(cls._id)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedClassId === cls._id
                        ? "bg-primary-light text-primary-dark border border-primary-light shadow-sm font-bold"
                        : "bg-white text-gray-600 hover:bg-brand-bg border border-gray-100 shadow-sm"
                        }`}
                    >
                      {cls.className}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-sm text-gray-500 px-4">No classes found.</span>
        )}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between">
            <span>Student List</span>
            <span className="text-sm font-normal text-gray-500">Total: {attendanceRecords.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No active students found in this class.</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 bg-white p-2 rounded text-sm font-bold text-gray-600">
                <div className="col-span-4">Name</div>
                <div className="col-span-4 text-center">Status</div>
                <div className="col-span-4">Reason</div>
              </div>

              {attendanceRecords.map((r, i) => (
                <div
                  key={r.studentId}
                  className={`grid grid-cols-12 gap-4 items-center p-3 border rounded ${r.status === "Absent" ? "bg-red-50 border-red-100" : "bg-white"
                    }`}
                >
                  <div className="col-span-4 font-medium truncate flex items-center gap-3">
                    <span className="text-gray-400 font-bold text-sm select-none min-w-[20px]">
                      {i + 1}.
                    </span>
                    <span title={r.name}>{r.name}</span>
                  </div>

                  <div className="col-span-4 flex justify-center">
                    <div className="flex p-1 bg-brand-bg rounded-lg w-max shadow-inner border border-gray-200/60">
                      <button
                        onClick={() => handleStatusChange(i, "Present")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${r.status === "Present"
                          ? "bg-white text-green-600 shadow-sm ring-1 ring-gray-200"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                          }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(i, "Absent")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${r.status === "Absent"
                          ? "bg-white text-red-600 shadow-sm ring-1 ring-gray-200"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                          }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Absent
                      </button>
                    </div>
                  </div>

                  <div className="col-span-4">
                    {r.status === "Absent" && (
                      <select
                        className="w-full border p-1 rounded text-sm bg-white"
                        value={r.reason}
                        onChange={(e) => handleReasonChange(i, e.target.value)}
                      >
                        <option value="">Select Reason...</option>
                        <option value="Sick">Sick</option>
                        <option value="Family Matter">Family Matter</option>
                        <option value="Emergency">Emergency</option>
                        <option value="MIA">MIA</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}