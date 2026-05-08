// src/api/students.js
import api from "./http";

export const getStudents = async () => {
  const res = await api.get("/students");
  return res.data;
};

export const addStudent = async (student) => {
  const res = await api.post("/students", student);
  return res.data;
};

export const deleteStudent = async (id) => {
  const res = await api.delete(`/students/${id}`);
  return res.data;
};

export const updateStudent = async (id, data) => {
  const res = await api.put(`/students/${id}`, data);
  return res.data;
};

export const enrollStudent = async (student) => {
  const res = await api.post("/students/enroll", student);
  return res.data;
};

export const getPendingStudents = async () => {
  const res = await api.get("/students/pending");
  return res.data;
};

export const approveStudent = async (id) => {
  const res = await api.put(`/students/${id}/approve`);
  return res.data;
};

export const rejectStudent = async (id) => {
  const res = await api.put(`/students/${id}/reject`);
  return res.data;
};
