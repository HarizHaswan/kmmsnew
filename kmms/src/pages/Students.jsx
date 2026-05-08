import React, { useEffect, useState } from "react";
import StudentList from "../components/Students/StudentList";
import {
  getStudents,
  addStudent,
  deleteStudent,
  updateStudent,
  approveStudent,
  rejectStudent,
} from "../api/students";
import { getTeachers } from "../api/teachers";
import { getClasses, addClass } from "../api/classes";
import { useToast } from "../components/ui/use-toast";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [studentData, teacherData, classData] = await Promise.all([
        getStudents(),
        getTeachers(),
        getClasses(),
      ]);

      setStudents(Array.isArray(studentData) ? studentData : []);
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setClasses(Array.isArray(classData) ? classData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveStudent(id);
      toast({
        title: "Student Approved",
        description: "The student has been successfully enrolled.",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error.response?.data?.message || "Could not approve student",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectStudent(id);
      toast({
        title: "Student Rejected",
        description: "The enrollment request has been rejected.",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: error.response?.data?.message || "Could not reject student",
        variant: "destructive",
      });
    }
  };

  const handleAddStudent = async (form) => {
    try {
      await addStudent(form);

      toast({
        title: "Student added",
        description: `${form.name} has been successfully added.`,
      });

      loadData();
    } catch (error) {
      toast({
        title: "Failed to add student",
        description:
          error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateStudent = async (id, data) => {
    try {
      await updateStudent(id, data);

      toast({
        title: "Student updated",
        description: "Student information updated successfully.",
      });

      loadData();
    } catch (error) {
      toast({
        title: "Failed to update student",
        description:
          error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteStudent = async (id) => {
    try {
      await deleteStudent(id);
      loadData();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const handleAddClass = async (classData) => {
    try {
      await addClass(classData);

      toast({
        title: "Class added",
        description: `${classData.className} has been successfully created.`,
      });

      loadData();
    } catch (error) {
      toast({
        title: "Failed to add class",
        description:
          error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading student records...
      </div>
    );
  }

  return (
    <div className="p-2 md:p-3">
      <StudentList
        students={students}
        teachers={teachers}
        classes={classes}
        onAdd={handleAddStudent}
        onUpdate={handleUpdateStudent}
        onDelete={handleDeleteStudent}
        onAddClass={handleAddClass}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}