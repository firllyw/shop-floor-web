"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/components/ModalProvider";

const LineLayoutEditor = dynamic(() => import("@/components/AreaLayoutEditor"), { ssr: false });

export default function EditLinePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showAlert } = useModal();
  
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLine();
    }
  }, [id]);

  const fetchLine = async () => {
    try {
      const res = await api.get(`/areas/${id}`);
      setFormData({
        name: res.data.name || "",
        description: res.data.description || ""
      });
    } catch (error) {
      console.error("Failed to fetch line", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/areas/${id}`, formData);
      showAlert("Success", "Line details saved successfully!", "success");
    } catch (error) {
      console.error("Failed to update line", error);
      showAlert("Error", "Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading Line...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/supervisor/line-setup" className="p-2 text-gray-500 hover:text-blue-600 bg-white rounded-full border shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">Edit Line Setup</h1>
          <p className="text-muted-foreground text-gray-500">Update line details and configure its Gemba Layout map.</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Top: Details Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Line Details</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Line Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl flex items-center justify-center font-medium shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Details"}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 h-[100px]"
              />
            </div>
          </form>
        </div>

        {/* Bottom: Gemba Layout */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Gemba Layout Mapper</h2>
            <p className="text-sm text-gray-500 italic">Drag and drop assets to configure the physical layout of {formData.name || 'this line'}. Asset positions are automatically synced.</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-4">
             <LineLayoutEditor lineId={id as string} />
          </div>
        </div>

      </div>
    </div>
  );
}
