import React, { useEffect, useState } from "react";
import StudentList from "../../components/Students/StudentList";
import { getStudents } from "../../api/students";

export default function TeacherStudents({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Backend filters students by teacher's classAssigned automatically
      const studentData = await getStudents();
      setStudents(Array.isArray(studentData) ? studentData : []);
    } catch (err) {
      console.error("Failed to load teacher students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    console.warn("Delete action not implemented for teachers");
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading students...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Students</h1>
      </div>

      <StudentList
        students={students}
        onDelete={handleDelete}
        userRole="teacher"
      />
    </div>
  );
}
