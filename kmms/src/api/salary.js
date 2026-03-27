import http from "./http";

export const getAllSalaries = async () => {
    const res = await http.get("/salary/all");
    return res.data;
};

export const getMySalaries = async () => {
    const res = await http.get("/salary/my-salaries");
    return res.data;
};

export const generateSalary = async (data) => {
    const res = await http.post("/salary/generate", data);
    return res.data;
};

export const updateSalary = async (id, data) => {
    const res = await http.put(`/salary/${id}`, data);
    return res.data;
};

export const paySalary = async (id) => {
    const res = await http.post(`/salary/${id}/pay`);
    return res.data;
};
