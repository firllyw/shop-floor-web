"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { useModal } from "@/components/ModalProvider";

const GembaCanvas = dynamic(() => import("@/components/GembaCanvas"), { ssr: false });

export default function MonthlyPlanningPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const { showAlert } = useModal();

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [areasRes, templatesRes, usersRes] = await Promise.all([
        axios.get("http://localhost:3000/api/v1/areas"),
        axios.get("http://localhost:3000/api/v1/task-templates"),
        axios.get("http://localhost:3000/api/v1/users")
      ]);
      setAreas(areasRes.data);
      if (areasRes.data.length > 0) setSelectedArea(areasRes.data[0].id);
      setTemplates(templatesRes.data);
      // Filter out only OPERATORS
      setUsers(usersRes.data.filter((u: any) => u.role === "OPERATOR"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedAsset || !selectedTemplate || !selectedOperator || !selectedDate || !selectedArea) {
      showAlert("Missing Information", "Please select an asset from the map, a template, an operator, and a date.", "error");
      return;
    }

    const d = new Date(selectedDate);
    
    try {
      await axios.post("http://localhost:3000/api/v1/tasks/bulk", {
        areaId: selectedArea,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        assetId: selectedAsset.id,
        templateId: selectedTemplate,
        assigneeId: selectedOperator,
        dates: [selectedDate] // Simplified for MVP: adding one specific date, can be expanded to multiple
      });
      showAlert("Success", "Tasks successfully added to the Monthly Plan!", "success");
      setSelectedAsset(null); // Reset
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to add tasks.", "error");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Monthly Planning Board</h1>
        <p className="text-muted-foreground text-gray-500">Select machines on the Gemba Canvas to assign PM routines.</p>
      </div>

      <div className="flex space-x-4 mb-4">
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Top Pane: Gemba Canvas */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <GembaCanvas onSelectAsset={(asset) => setSelectedAsset(asset)} />
      </div>

      {/* Bottom Pane: Assignment Form */}
      {selectedAsset && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            Task Assignment for: <span className="text-blue-600 ml-2">{selectedAsset.name}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Routine</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="">Select Routine...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Operator</label>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                <option value="">Select Operator...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleBulkAdd}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Add to Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
