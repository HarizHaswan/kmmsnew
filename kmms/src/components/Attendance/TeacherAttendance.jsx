import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Save, Calendar, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { getClasses } from "../../api/classes";
import { getAttendance, saveAttendance } from "../../api/attendance";

export default function TeacherAttendance({ user }) {
  const { toast } = useToast();
  
  const [myClass, setMyClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Find My Class
  useEffect(() => {
    async function findMyClass() {
      if (!user.classAssigned) {
        setErrorMsg("You have no class assigned. Contact Admin.");
        return;
      }
      try {
        const allClasses = await getClasses();
        const found = allClasses.find(c => 
          c.className.toLowerCase().trim() === user.classAssigned.toLowerCase().trim()
        );

        if (found) {
          setMyClass(found);
        } else {
          setErrorMsg(`Class "${user.classAssigned}" not found in database.`);
        }
      } catch (err) {
        console.error(err);
      }
    }
    findMyClass();
  }, [user]);

  // 2. Load Attendance (FIXED: Filter Active Only)
  useEffect(() => {
    if (!myClass || !selectedDate) return;

    async function fetchData() {
      setLoading(true);
      try {
        const data = await getAttendance(selectedDate, myClass._id);
        
        const activeRecords = data.records
          .map(r => {
             const studentObj = r.studentId || {};
             return {
               studentId: studentObj._id || r.studentId, 
               name: studentObj.name || "Unknown",
               status: r.status || "Present",
               reason: r.reason || "",
               // Check status
               accountStatus: studentObj.status || "active"
             };
          })
          // FILTER
          .filter(r => r.accountStatus.toLowerCase() === "active");

        setAttendanceRecords(activeRecords);
      } catch (err) {
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [myClass, selectedDate]);

  // Handlers
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
        classId: myClass._id,
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

  if (errorMsg) return <div className="p-10 text-red-500 font-bold text-center">{errorMsg}</div>;
  if (!myClass) return <div className="p-10 text-center">Loading your class info...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Attendance: <span className="text-accent">{myClass.className}</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input 
            type="date" className="border rounded-md p-2 text-sm"
            value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} 
          />
          <Button onClick={handleSave} className="bg-accent hover:bg-accent-dark ml-2">
            <Save className="w-4 h-4 mr-2"/> Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between">
             <span>Student List</span>
             <span className="text-sm font-normal text-gray-500">Total: {attendanceRecords.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" /> : 
            attendanceRecords.length === 0 ? <div className="text-center p-8 text-gray-500">No active students found in your class.</div> : (
            <div className="space-y-2">
               <div className="grid grid-cols-12 gap-4 bg-white p-2 rounded text-sm font-bold text-gray-600">
                 <div className="col-span-4">Name</div>
                 <div className="col-span-4 text-center">Status</div>
                 <div className="col-span-4">Reason</div>
               </div>

               {attendanceRecords.map((r, i) => (
                <div key={r.studentId} className={`grid grid-cols-12 gap-4 items-center p-3 border rounded ${r.status === "Absent" ? "bg-red-50 border-red-100" : "bg-white"}`}>
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
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                          r.status === "Present"
                            ? "bg-white text-green-600 shadow-sm ring-1 ring-gray-200"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(i, "Absent")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                          r.status === "Absent"
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
                      <select className="w-full border p-1 rounded text-sm bg-white" value={r.reason} onChange={(e) => handleReasonChange(i, e.target.value)}>
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