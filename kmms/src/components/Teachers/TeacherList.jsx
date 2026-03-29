import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
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

// 1. Import the class API
import { getClasses } from "../../api/classes"; 

const TeacherList = ({ teachers = [], onAdd, onUpdate, onDelete }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState("Active"); // "Active" | "Inactive"
  
  // 2. State for storing classes fetched from DB
  const [availableClasses, setAvailableClasses] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    classAssigned: "",
    qualification: "",
    hireDate: "",
    epfNo: "",
    taxNo: "",
    status: "Active",
  });

  // 3. Fetch classes on component mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const data = await getClasses();
        setAvailableClasses(data || []);
      } catch (error) {
        console.error("Failed to load classes:", error);
      }
    }
    fetchClasses();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      classAssigned: "",
      qualification: "",
      hireDate: "",
      epfNo: "",
      taxNo: "",
      status: "Active",
    });
    setEditingTeacher(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      classAssigned: formData.classAssigned,
      qualification: formData.qualification,
      hireDate: formData.hireDate,
      epfNo: formData.epfNo,
      taxNo: formData.taxNo,
      status: formData.status,
    };

    if (!editingTeacher && formData.password) {
      payload.password = formData.password;
    }

    if (editingTeacher) {
      await onUpdate(editingTeacher._id || editingTeacher.id, payload);
    } else {
      await onAdd(payload);
    }

    resetForm();
  };

  const filteredTeachers = teachers.filter(
    (teacher) => (teacher.status || "Active") === activeTab
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Teacher Management</h2>
          <p className="text-sm text-gray-600">
            Manage all teachers and assignments
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary-dark" >
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input
                  placeholder="e.g. Sarah Johnson"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. sarah@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

                  {/* Password - Only for NEW teachers */}
              {!editingTeacher && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Input
                    type="password"
                    placeholder="Set login password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <Input
                  placeholder="e.g. 012-3456789"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              

              {/* Class Assigned - CHANGED TO DROPDOWN */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Class Assigned</label>
                <select
                  className="border rounded-lg p-2 w-full text-sm"
                  value={formData.classAssigned}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classAssigned: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Class</option>
                  {availableClasses.length > 0 ? (
                    availableClasses.map((cls) => (
                      <option key={cls._id} value={cls.className}>
                        {cls.className}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No classes found in database</option>
                  )}
                </select>
              </div>

              {/* Qualification */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Qualification</label>
                <select
                  className="border rounded-lg p-2 w-full text-sm"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      qualification: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Qualification</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Degree">Degree</option>
                </select>
              </div>

              {/* Hire Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Hire Date</label>
                <Input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) =>
                    setFormData({ ...formData, hireDate: e.target.value })
                  }
                  required
                />
              </div>

              {/* EPF Number */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">EPF Number</label>
                <Input
                  placeholder="e.g. 12345678"
                  value={formData.epfNo}
                  onChange={(e) =>
                    setFormData({ ...formData, epfNo: e.target.value })
                  }
                />
              </div>

              {/* Tax Number */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tax Number</label>
                <Input
                  placeholder="e.g. OG 123456789"
                  value={formData.taxNo}
                  onChange={(e) =>
                    setFormData({ ...formData, taxNo: e.target.value })
                  }
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  className="border rounded-lg p-2 w-full text-sm"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingTeacher ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        {["Active", "Inactive"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab} Teachers
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab} Teachers ({filteredTeachers.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>EPF No</TableHead>
                <TableHead>Tax No</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTeachers.map((teacher, index) => (
                <TableRow key={teacher._id || teacher.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-bold text-lg min-w-[24px]">
                        {index + 1}.
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {teacher.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.phone || "-"}</TableCell>
                  <TableCell>{teacher.classAssigned || "-"}</TableCell>
                  <TableCell>{teacher.qualification || "-"}</TableCell>
                  <TableCell>
                    {teacher.hireDate
                      ? new Date(teacher.hireDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{teacher.epfNo || "-"}</TableCell>
                  <TableCell>{teacher.taxNo || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        teacher.status === "Active"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        teacher.status === "Active"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-brand-bg text-gray-700 hover:bg-brand-bg"
                      }
                    >
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTeacher(teacher);
                        setFormData({
                          name: teacher.name || "",
                          email: teacher.email || "",
                          phone: teacher.phone || "",
                          password: "",
                          classAssigned: teacher.classAssigned || "",
                          qualification: teacher.qualification || "",
                          hireDate: teacher.hireDate
                            ? teacher.hireDate.split("T")[0]
                            : "",
                          epfNo: teacher.epfNo || "",
                          taxNo: teacher.taxNo || "",
                          status: teacher.status || "Active",
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 text-white-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredTeachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500 h-24">
                    No {activeTab.toLowerCase()} teachers found.
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

export default TeacherList;