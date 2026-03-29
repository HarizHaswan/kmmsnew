import React, { useState } from "react";
import { X } from "lucide-react";

const EditTeacherModal = ({ teacher, onClose, onSave }) => {
  const [form, setForm] = useState(teacher);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg">
        <div className="p-4 border-b flex justify-between">
          <h3 className="text-lg font-bold">Edit Teacher</h3>
          <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="text"
            name="class"
            value={form.class}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <input
            type="text"
            name="subjects"
            value={form.subjects}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <button className="w-full p-3 bg-accent text-white rounded-lg hover:bg-accent-dark mt-2">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTeacherModal;
