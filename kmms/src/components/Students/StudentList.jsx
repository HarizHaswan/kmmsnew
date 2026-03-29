import React, { useMemo, useState } from "react";
import { Plus, Edit, Search, GraduationCap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const StudentList = ({
  students = [],
  teachers = [],
  classes = [],
  onDelete,
  onAdd,
  onUpdate,
  onAddClass,
  userRole = "admin", // <--- 1. Added userRole prop (Default is 'admin')
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentView, setStudentView] = useState("current");
  const [isExistingParent, setIsExistingParent] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    classId: "",
    parentName: "",
    parentEmail: "",
    parentPassword: "",
    teacherId: "",
    status: "active",
  });

  const [classFormData, setClassFormData] = useState({
    className: "",
    yearGroup: "",
  });

  // Helper to safely get age (uses DB age or calculates from DOB)
  const getStudentAge = (student) => {
    if (student.age) return Number(student.age);
    if (student.dateOfBirth) {
      const dob = new Date(student.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    }
    return 0;
  };

  // --- Filtering & search ---
  const filteredStudents = students.filter((student) => {
    // 1. CURRENT vs HISTORY filter
    if (studentView === "current" && (student.status === "graduated" || student.status === "withdrawn")) {
      return false;
    }

    if (studentView === "history" && student.status === "active") {
      return false;
    }

    // 2. Search filter
    const q = searchQuery.toLowerCase();
    const studentName = student.name?.toLowerCase() || "";
    const className = student.classId?.className?.toLowerCase() || "";
    const parentName = student.parentName?.toLowerCase() || "";
    
    const matchesSearch =
      !q ||
      studentName.includes(q) ||
      className.includes(q) ||
      parentName.includes(q);

    // 3. Age filter
    const studentAge = getStudentAge(student);
    const matchesAgeFilter =
      filterAgeGroup === "all" ||
      Number(filterAgeGroup) === studentAge;

    // 4. Class filter
    const studentClassId = typeof student.classId === 'object' ? student.classId?._id : student.classId;
    const matchesClassFilter =
      filterClass === "all" ||
      studentClassId === filterClass;

    // 5. Teacher filter
    const studentTeacherId = typeof student.teacherId === 'object' ? student.teacherId?._id : student.teacherId;
    const matchesTeacherFilter =
      filterTeacher === "all" ||
      studentTeacherId === filterTeacher;

    return matchesSearch && matchesAgeFilter && matchesClassFilter && matchesTeacherFilter;
  });

  // --- Stats cards ---
  const stats = useMemo(
    () => ({
      total: students.filter(s => s.status === "active").length,
      age4: students.filter((s) => getStudentAge(s) === 4 && s.status === "active").length,
      age5: students.filter((s) => getStudentAge(s) === 5 && s.status === "active").length,
      age6: students.filter((s) => getStudentAge(s) === 6 && s.status === "active").length,
    }),
    [students]
  );

  // --- Add student submit handler ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      registrationDate: new Date().toISOString().split('T')[0], // Current date
      classId: formData.classId,
      parentName: formData.parentName,
      parentEmail: formData.parentEmail,
      parentPassword: formData.parentPassword,
      teacherId: formData.teacherId || undefined,
      status: formData.status,
      isExistingParent: isExistingParent
    };

    if (editingStudent) {
      await onUpdate(editingStudent._id || editingStudent.id, payload);
    } else {
      await onAdd(payload);
    }

    // Reset state
    setFormData({
      name: "",
      dateOfBirth: "",
      gender: "",
      classId: "",
      parentName: "",
      parentEmail: "",
      parentPassword: "",
      teacherId: "",
      status: "active",
    });
    setEditingStudent(null);
    setIsAddDialogOpen(false);
    setIsExistingParent(false);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: "bg-green-100 text-green-700",
      graduated: "bg-accent-light text-accent-dark",
      withdrawn: "bg-red-100 text-red-700"
    };
    return statusStyles[status] || statusStyles.active;
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();

    try {
      await onAddClass({
        className: classFormData.className,
        yearGroup: classFormData.yearGroup,
      });

      // Reset form
      setClassFormData({
        className: "",
        yearGroup: "",
      });
      setIsAddClassDialogOpen(false);
    } catch (error) {
      console.error("Failed to add class:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER + ADD BUTTONS */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 text-xl font-bold">
            Student Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage all students and their information
          </p>
        </div>

        {/* --- 2. HIDE BUTTONS FOR NON-ADMINS --- */}
        {userRole === "admin" && (
          <div className="flex gap-3">
            {/* Add Class Button */}
            <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary-dark">
                  <Plus className="w-4 h-4" />
                  Add Class
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleAddClassSubmit} className="space-y-4 py-2">
                  {/* Class Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Name *
                    </label>
                    <Input
                      placeholder="e.g., 4A, 5B, 6C"
                      value={classFormData.className}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, className: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the class name (e.g., 4A for age 4 class A)
                    </p>
                  </div>

                  {/* Year Group (Age) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year Group (Age) *
                    </label>
                    <select
                      className="border rounded-lg p-2 w-full"
                      value={classFormData.yearGroup}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, yearGroup: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Age Group</option>
                      <option value="4">4 Years Old</option>
                      <option value="5">5 Years Old</option>
                      <option value="6">6 Years Old</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      className="flex-1 bg-brand-bg text-gray-800 hover:bg-gray-200"
                      onClick={() => {
                        setIsAddClassDialogOpen(false);
                        setClassFormData({
                          className: "",
                          yearGroup: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                      Save Class
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add Student Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary-dark">
                  <Plus className="w-4 h-4" />
                  Add Student
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? "Edit Student" : "Add New Student"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      className="border rounded-lg p-2 w-full"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class *
                    </label>
                    <select
                      className="border rounded-lg p-2 w-full"
                      value={formData.classId}
                      onChange={(e) =>
                        setFormData({ ...formData, classId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name || c.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Teacher
                    </label>
                    <select
                      className="border rounded-lg p-2 w-full"
                      value={formData.teacherId}
                      onChange={(e) =>
                        setFormData({ ...formData, teacherId: e.target.value })
                      }
                    >
                      <option value="">Select Teacher (Optional)</option>
                      {Array.isArray(teachers) &&
                        teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Parent Section Headers/Toggles */}
                  {!editingStudent && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mt-6 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-800">Parent Details</h3>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-600">Existing Parent?</label>
                          <button
                            type="button"
                            onClick={() => setIsExistingParent(!isExistingParent)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                              isExistingParent ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className="sr-only">Toggle existing parent</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isExistingParent ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {isExistingParent ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Registered Parent Email *
                            </label>
                            <Input
                              type="email"
                              placeholder="Enter parent's exact registered email"
                              value={formData.parentEmail}
                              onChange={(e) =>
                                setFormData({ ...formData, parentEmail: e.target.value })
                              }
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              The system will link this new student to the existing parent associated with this email.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Parent Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Parent Name *
                            </label>
                            <Input
                              placeholder="Enter parent's full name"
                              value={formData.parentName}
                              onChange={(e) =>
                                setFormData({ ...formData, parentName: e.target.value })
                              }
                              required={!isExistingParent}
                            />
                          </div>

                          {/* Parent Email (for registration) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Parent Email (for login) *
                            </label>
                            <Input
                              type="email"
                              placeholder="parent@example.com"
                              value={formData.parentEmail}
                              onChange={(e) =>
                                setFormData({ ...formData, parentEmail: e.target.value })
                              }
                              required={!isExistingParent}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Parent Password (for login) *
                            </label>
                            <Input
                              type="password"
                              placeholder="Enter password for new parent account"
                              value={formData.parentPassword}
                              onChange={(e) =>
                                setFormData({ ...formData, parentPassword: e.target.value })
                              }
                              required={!isExistingParent}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If editing, just show parent name as a regular field (can't easily re-link here) */}
                  {editingStudent && (
                    <div className="space-y-4">
                      {/* Parent Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent Name *
                        </label>
                        <Input
                          placeholder="Enter parent's full name"
                          value={formData.parentName}
                          onChange={(e) =>
                            setFormData({ ...formData, parentName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Status (only show when editing) */}
                  {editingStudent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        className="border rounded-lg p-2 w-full"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        required
                      >
                        <option value="active">Active</option>
                        <option value="graduated">Graduated</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      className="flex-1 bg-brand-bg text-gray-800 hover:bg-gray-200"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingStudent(null);
                        setFormData({
                          name: "",
                          dateOfBirth: "",
                          gender: "",
                          classId: "",
                          parentName: "",
                          parentEmail: "",
                          parentPassword: "",
                          teacherId: "",
                          status: "active",
                        });
                        setIsExistingParent(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingStudent ? "Update" : "Save"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <h3 className="text-lg text-black-600">{stats.total}</h3>
            </div>
            <GraduationCap className="w-10 h-10 text-gray-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">4 Years</p>
              <h3 className="text-lg text-accent">{stats.age4}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
              <span className="text-accent text-sm">4Y</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">5 Years</p>
              <h3 className="text-lg text-green-600">{stats.age5}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-sm">5Y</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">6 Years</p>
              <h3 className="text-lg text-purple-600">{stats.age6}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-sm">6Y</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>All Students ({filteredStudents.length})</CardTitle>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Age filter */}
              <select
                className="border rounded-lg p-2 w-full md:w-40"
                value={filterAgeGroup}
                onChange={(e) => setFilterAgeGroup(e.target.value)}
              >
                <option value="all">All Ages</option>
                <option value="4">4 Years</option>
                <option value="5">5 Years</option>
                <option value="6">6 Years</option>
              </select>

              {/* Class filter */}
              <select
                className="border rounded-lg p-2 w-full md:w-40"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name || c.className}
                  </option>
                ))}
              </select>

              {/* Teacher filter */}
              <select
                className="border rounded-lg p-2 w-full md:w-40"
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
              >
                <option value="all">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="flex gap-2 border-b px-6">
          <button
            onClick={() => setStudentView("current")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              studentView === "current"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Current Students
          </button>

          <button
            onClick={() => setStudentView("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              studentView === "history"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            History
          </button>
        </div>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>  
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Reg. Date</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStudents.map((student, index) => {
                const id = student._id || student.id;
                // Safely handle optional chaining for display
                const displayName = student.name || "Unknown";
                const displayAge = getStudentAge(student);
                const displayClass = student.classId?.className || student.classId?.name || "-";
                const displayTeacher = student.teacherId?.name || "-";
                
                return (
                  <TableRow key={id}>
                    {/* Student name column */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-bold text-lg min-w-[24px]">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {displayName}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Age */}
                    <TableCell>{displayAge || "-"}</TableCell>

                    {/* Gender */}
                    <TableCell>{student.gender || "-"}</TableCell>

                    {/* Date of Birth */}
                    <TableCell>
                      {student.dateOfBirth
                        ? new Date(student.dateOfBirth).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    {/* Registration Date */}
                    <TableCell>
                      {student.registrationDate
                        ? new Date(student.registrationDate).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    {/* Parent */}
                    <TableCell>{student.parentName || "-"}</TableCell>

                    {/* Class */}
                    <TableCell>{displayClass}</TableCell>

                    {/* Teacher */}
                    <TableCell>{displayTeacher}</TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                        {(student.status?.charAt(0).toUpperCase() + student.status?.slice(1)) || "Active"}
                      </span>
                    </TableCell>

                    {/* Actions - CONDITIONALLY RENDERED */}
                    <TableCell className="text-right">
                      {studentView === "current" ? (
                        /* Only show edit if admin */
                        userRole === "admin" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              className="bg-transparent text-gray-600 hover:bg-brand-bg px-2 py-1"
                              onClick={() => {
                                setEditingStudent(student);
                                setFormData({
                                  name: student.name || "",
                                  dateOfBirth: student.dateOfBirth
                                    ? student.dateOfBirth.split("T")[0]
                                    : "",
                                  gender: student.gender || "",
                                  classId: student.classId?._id || student.classId || "",
                                  parentName: student.parentName || "",
                                  parentEmail: "",
                                  parentPassword: "",
                                  teacherId: student.teacherId?._id || student.teacherId || "",
                                  status: student.status || "active",
                                });

                                setIsAddDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Button>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          Archived
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentList;