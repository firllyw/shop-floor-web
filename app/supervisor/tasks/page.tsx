"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { useModal } from "@/components/ModalProvider";
import { Search, MapPin, Wrench, Calendar as CalendarIcon, User, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Define Task interface
interface Tool {
  id: string;
  name: string;
}

interface TaskTemplate {
  name: string;
  tools: Tool[];
}

interface Asset {
  name: string;
}

interface Assignee {
  name: string;
}

interface Task {
  id: string;
  status: "TODO" | "IN_PROGRESS" | "PENDING_REVIEW" | "DONE";
  template: TaskTemplate;
  asset: Asset;
  assignee?: Assignee;
  notes?: string;
}

interface Area {
  id: string;
  name: string;
}

const COLUMNS = [
  { id: "TODO", title: "To Do", bgColor: "bg-gray-100", headerColor: "text-gray-700" },
  { id: "IN_PROGRESS", title: "In Progress", bgColor: "bg-blue-50", headerColor: "text-blue-700" },
  { id: "PENDING_REVIEW", title: "Pending Review", bgColor: "bg-yellow-50", headerColor: "text-yellow-700" },
  { id: "DONE", title: "Done", bgColor: "bg-green-50", headerColor: "text-green-700" },
];

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing mb-3 hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-sm leading-tight">{task.template.name}</h4>
      </div>
      
      <div className="flex items-center text-xs text-gray-500 mb-3">
        <MapPin className="w-3 h-3 mr-1" />
        <span className="truncate">{task.asset.name}</span>
      </div>

      {task.template.tools && task.template.tools.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.template.tools.map((tool) => (
            <span key={tool.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
              <Wrench className="w-2.5 h-2.5 mr-1" />
              {tool.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end items-center mt-2 pt-2 border-t border-gray-100">
        {task.assignee ? (
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold" title={task.assignee.name}>
              {task.assignee.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex items-center text-xs text-gray-400">
            <User className="w-3 h-3 mr-1" /> Unassigned
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Leader Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [taskToReview, setTaskToReview] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { showAlert } = useModal();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (selectedArea && selectedDate) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [selectedArea, selectedDate]);

  const fetchAreas = async () => {
    try {
      const res = await api.get("/areas");
      setAreas(res.data);
      if (res.data.length > 0) {
        setSelectedArea(res.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch areas", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/kanban?areaId=${selectedArea}&date=${selectedDate}`);
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status, notes });
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert if failed (simplified: just refetch)
      fetchTasks();
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id; // It could be a column or another task

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Find target status
    let newStatus = activeTask.status;
    const overColumn = COLUMNS.find(c => c.id === overId);
    if (overColumn) {
      newStatus = overColumn.id as any;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (activeTask.status === newStatus) return; // No change

    // If moving to PENDING_REVIEW -> trigger Leader Review
    if (newStatus === "PENDING_REVIEW") {
      setTaskToReview(activeTask);
      setReviewModalOpen(true);
      return;
    }

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t));
    updateTaskStatus(activeId, newStatus);
  };

  const handleApprove = () => {
    if (!taskToReview) return;
    setTasks(prev => prev.map(t => t.id === taskToReview.id ? { ...t, status: "DONE" } : t));
    updateTaskStatus(taskToReview.id, "DONE");
    closeReviewModal();
  };

  const handleReject = () => {
    if (!taskToReview) return;
    if (!rejectReason.trim()) {
      showAlert("Missing Information", "Please provide a rejection reason.", "error");
      return;
    }
    setTasks(prev => prev.map(t => t.id === taskToReview.id ? { ...t, status: "IN_PROGRESS", notes: rejectReason } : t));
    updateTaskStatus(taskToReview.id, "IN_PROGRESS", rejectReason);
    closeReviewModal();
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setTaskToReview(null);
    setRejectReason("");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b shadow-sm flex flex-col">
        {/* Top Header: Title and centered Date */}
        <div className="relative px-8 py-6 flex items-center justify-between">
          <div className="absolute inset-x-0 top-0 h-full flex flex-col items-center justify-center pointer-events-none">
            <h2 className="text-2xl md:text-3xl font-black text-pink-600 uppercase tracking-widest bg-pink-50 px-6 py-1 rounded-md border border-pink-100">
              {selectedDate ? format(new Date(selectedDate), "EEEE") : "DAY"}
            </h2>
            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wide">
              {selectedDate ? format(new Date(selectedDate), "dd MMMM yyyy") : ""}
            </p>
          </div>

          <div className="z-10">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">KANBAN 4S+S</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Execution Board</p>
          </div>

          <div className="z-10 flex items-center space-x-2 bg-gray-50 border rounded-lg px-3 py-2 pointer-events-auto shadow-sm">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-gray-700"
            />
          </div>
        </div>

        {/* Tabs for Areas */}
        <div className="px-8 flex space-x-2 overflow-x-auto pt-2">
          {areas.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedArea(a.id)}
              className={`px-8 py-3 font-bold text-sm uppercase rounded-t-lg transition-colors border-b-4 whitespace-nowrap ${
                selectedArea === a.id
                  ? "bg-slate-900 text-white border-pink-500"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 border-transparent"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full space-x-6 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const columnTasks = tasks.filter(t => t.status === col.id);
              
              return (
                <div key={col.id} className={`flex-shrink-0 w-80 rounded-xl flex flex-col ${col.bgColor} border border-gray-200/60`}>
                  <div className="p-4 border-b border-gray-200/40 flex justify-between items-center">
                    <h3 className={`font-semibold ${col.headerColor}`}>{col.title}</h3>
                    <span className="bg-white text-gray-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      {columnTasks.length}
                    </span>
                  </div>
                  
                  {/* Drop zone for column */}
                  <div className="flex-1 p-3 overflow-y-auto" id={col.id}>
                    <SortableContext
                      id={col.id}
                      items={columnTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnTasks.map(task => (
                        <SortableTaskCard key={task.id} task={task} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-sm text-gray-400 border-2 border-dashed border-gray-200 w-full text-center py-8 rounded-xl">Drop tasks here</p>
                        </div>
                      )}
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? <SortableTaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Leader Review Modal */}
      {reviewModalOpen && taskToReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b bg-yellow-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="bg-yellow-400 w-2 h-6 rounded-full mr-3"></span>
                Leader Review Required
              </h2>
              <button onClick={closeReviewModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Verification</h4>
                <p className="text-lg font-medium text-gray-900 mb-1">{taskToReview.template.name}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1.5" /> {taskToReview.asset.name}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-3">Please perform a Gemba walk to verify this task. Has the work been completed according to standard?</p>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">If Rejecting, provide a reason:</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., Oil residue still present on sensor..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleReject}
                  className="flex-1 py-3 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 font-semibold rounded-xl transition-colors"
                >
                  Reject (NG)
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 py-3 text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 font-semibold rounded-xl transition-colors"
                >
                  Approve (OK)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
