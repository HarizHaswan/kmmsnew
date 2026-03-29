import React, { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
import { Users, Camera, CheckCircle, DollarSign } from "lucide-react";
import { getStudents } from "../../api/students";
import { getTeachers } from "../../api/teachers";   // optional
import { getActivities } from "../../api/activities"; // if exists
import { getPayments } from "../../api/payments";     // if exists
import LiveDateTime from "../Common/LiveDateTime";


// IMPORTANT: ParentDashboard DOES NOT receive student data from context anymore.
// Instead, it loads REAL data from backend.

const ParentDashboard = ({ setActiveTab, user }) => {
  // Backend real data
  const [child, setChild] = useState(null);
  const [teacher, setTeacher] = useState(null);

  // Optional: if you want real activities/payments too
  const [childActivities, setChildActivities] = useState([]);
  const [childPayment, setChildPayment] = useState(null);

  const [loading, setLoading] = useState(true);

  // Parent ID comes from logged-in user
  //const parentId = user?._id || user?.id;

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      setLoading(true);

      // 1️⃣ Load child — backend auto-filters by parentId
      const studentList = await getStudents();
      const myChild = studentList[0]; // parent only has 1 child (usually)

      setChild(myChild);

      // 2️⃣ Load teacher
      if (myChild?.teacherId?._id) {
        const teachers = await getTeachers();
        const match = teachers.find(t => t._id === myChild.teacherId._id);
        setTeacher(match || myChild.teacherId); // fallback to populated data
      }

      // 3️⃣ Load activities (optional, if you have API)
      try {
        const acts = await getActivities();
        const filtered = acts.filter(a => a.studentId === myChild?._id);
        setChildActivities(filtered);
      } catch (_) {}

      // 4️⃣ Load payments (optional, if you have API)
      try {
        const pays = await getPayments();
        const filtered = pays.find(p => p.studentId === myChild?._id);
        setChildPayment(filtered);
      } catch (_) {}

    } catch (err) {
      console.error("Failed to load parent dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading your child’s data...</div>;
  }

  if (!child) {
    return <div className="p-6 text-gray-600">No child assigned yet.</div>;
  }

  return (
    <div className="space-y-6">
      <LiveDateTime />
      <h2 className="text-2xl font-bold text-gray-800">Parent Dashboard</h2>

      {/* Child Info */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold">{child.name}</h3>
            <p className="text-indigo-100">
              Age: {child.age} • Class: {child.className}
            </p>

            <p className="text-indigo-100 text-sm mt-1">
              Teacher: {teacher?.name || child.teacherId?.name || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Today's Activities"
          value={childActivities.length}
          icon={Camera}
          color="bg-accent"
          onClick={() => setActiveTab("child-activities")}
        />

        <DashboardCard
          title="Attendance Rate"
          value="95%" // if you want real attendance I can build it
          icon={CheckCircle}
          color="bg-green-500"
          onClick={() => setActiveTab("child-attendance")}
        />

        <DashboardCard
          title="Payment Status"
          value={childPayment?.status || "N/A"}
          icon={DollarSign}
          color={
            childPayment?.status === "Paid" ? "bg-green-500" : "bg-yellow-500"
          }
          onClick={() => setActiveTab("payments")}
        />
      </div>

      {/* Today’s Activities */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4">Today's Activities</h3>

        {childActivities.length > 0 ? (
          <div className="space-y-3">
            {childActivities.map((act) => (
              <div
                key={act._id}
                className="p-4 bg-indigo-50 rounded-lg border border-indigo-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{act.activity}</p>
                    <p className="text-sm text-gray-600">{act.notes}</p>
                  </div>
                  <span className="text-xs text-indigo-600">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No activities today</p>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
