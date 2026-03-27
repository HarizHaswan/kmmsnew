import http from "./http";

export const getPayments = async () => {
    const res = await http.get("/payments");
    return res.data;
};

export const createPayment = async (data) => {
    const res = await http.post("/payments", data);
    return res.data;
};

export const uploadPaymentReceipt = async (formData) => {
    const res = await http.post("/upload/attachment", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
};

export const deletePayment = async (id) => {
    const res = await http.delete(`/payments/${id}`);
    return res.data;
};
