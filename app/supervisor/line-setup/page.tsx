"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Search } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";

export default function LineManagement() {
  const [lines, setLines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "" });
  const router = useRouter();
  const { showConfirm } = useModal();

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    try {
      const res = await api.get("/areas");
      setLines(res.data);
    } catch (error) {
      console.error("Failed to fetch lines", error);
    }
  };

  const handleOpenModal = () => {
    setEditingLine(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (lineId: string) => {
    router.push(`/supervisor/line-setup/${lineId}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLine) {
        await api.put(`/areas/${editingLine.id}`, formData);
      } else {
        await api.post("/areas", formData);
      }
      handleCloseModal();
      fetchLines();
    } catch (error) {
      console.error("Failed to save line", error);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "Delete Line",
      "Are you sure you want to delete this line?",
      async () => {
        try {
          await api.delete(`/areas/${id}`);
          fetchLines();
        } catch (error) {
          console.error("Failed to delete line", error);
        }
      }
    );
  };

  const filteredLines = lines.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Line Management</h1>
          <p className="text-muted-foreground text-gray-500">Manage production lines and zones.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Line
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center mb-6 max-w-sm px-3 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search lines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Line Name</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {filteredLines.map((line) => (
                <tr key={line.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium">{line.name}</td>
                  <td className="px-6 py-4">{line.description || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(line.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(line.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLines.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No lines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingLine ? "Edit Line" : "Add New Line"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Line Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Line 4S+S 01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Optional description..."
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  {editingLine ? "Save Changes" : "Create Line"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
