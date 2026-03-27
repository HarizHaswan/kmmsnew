import http from "./http";

export const getInvoices = async () => {
    const res = await http.get("/invoices");
    return res.data;
};

export const getInvoiceById = async (id) => {
    const res = await http.get(`/invoices/${id}`);
    return res.data;
};

export const createInvoice = async (data) => {
    const res = await http.post("/invoices", data);
    return res.data;
};

export const updateInvoice = async (id, data) => {
    const res = await http.put(`/invoices/${id}`, data);
    return res.data;
};

export const deleteInvoice = async (id) => {
    const res = await http.delete(`/invoices/${id}`);
    return res.data;
};
