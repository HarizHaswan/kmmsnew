import api from "./http";

export const getMessages = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  const res = await api.get(`/messages?${query}`);
  return res.data;
};

export const getUsersForMessaging = async () => {
  const res = await api.get("/messages/users");
  return res.data;
};

export const markMessagesAsRead = async (senderId) => {
  const res = await api.put(`/messages/read/${senderId}`);
  return res.data;
};

export const createMessage = async (data) => {
  const res = await api.post("/messages", data);
  return res.data;
};

export const deleteMessage = async (id) => {
  const res = await api.delete(`/messages/${id}`);
  return res.data;
};
