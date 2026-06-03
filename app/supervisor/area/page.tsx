"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Search } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";

export default function AreaManagement() {
  const [areas, setAreas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "" });
  const router = useRouter();
  const { showConfirm } = useModal();

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/v1/areas");
      setAreas(res.data);
    } catch (error) {
      console.error("Failed to fetch areas", error);
    }
  };

  const handleOpenModal = () => {
    setEditingArea(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (areaId: string) => {
    router.push(`/supervisor/area/${areaId}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await axios.put(`http://localhost:3000/api/v1/areas/${editingArea.id}`, formData);
      } else {
        await axios.post("http://localhost:3000/api/v1/areas", formData);
      }
      handleCloseModal();
      fetchAreas();
    } catch (error) {
      console.error("Failed to save area", error);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "Delete Area",
      "Are you sure you want to delete this area?",
      async () => {
        try {
          await axios.delete(`http://localhost:3000/api/v1/areas/${id}`);
          fetchAreas();
        } catch (error) {
          console.error("Failed to delete area", error);
        }
      }
    );
  };

  const filteredAreas = areas.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Area Management</h1>
          <p className="text-muted-foreground text-gray-500">Manage shop floor areas and zones.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Area
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center mb-6 max-w-sm px-3 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search areas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Area Name</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {filteredAreas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium">{area.name}</td>
                  <td className="px-6 py-4">{area.description || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(area.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAreas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No areas found.
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
                {editingArea ? "Edit Area" : "Add New Area"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Area PC 2B-2C"
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
                  {editingArea ? "Save Changes" : "Create Area"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
