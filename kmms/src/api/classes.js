// src/api/classes.js
import api from "./http";

export const getClasses = async () => {
  const res = await api.get("/classes");
  return res.data;
};

export const getPublicClasses = async () => {
  const res = await api.get("/classes/public");
  return res.data;
};

export const addClass = async (classData) => {
  const res = await api.post("/classes", classData);
  return res.data;
};

export const updateClass = async (id, data) => {
  const res = await api.put(`/classes/${id}`, data);
  return res.data;
};

export const deleteClass = async (id) => {
  const res = await api.delete(`/classes/${id}`);
  return res.data;
};