"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { useModal } from "@/components/ModalProvider";
import { Search, MapPin, Wrench, Calendar as CalendarIcon, User, AlertTriangle, CheckCircle2, Clock, CheckSquare, X } from "lucide-react";

export default function LineDigitalBoard() {
  const [lines, setLines] = useState<any[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [cards, setCards] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  const [activeCard, setActiveCard] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  const [selectedTagId, setSelectedTagId] = useState("");
  const [tagNotes, setTagNotes] = useState("");

  const { showAlert } = useModal();

  useEffect(() => {
    fetchLines();
    fetchTags();
  }, []);

  useEffect(() => {
    if (selectedLineId && selectedDate) {
      fetchCards();
    } else {
      setCards([]);
    }
  }, [selectedLineId, selectedDate]);

  const fetchLines = async () => {
    try {
      const res = await api.get("/areas"); // using legacy endpoint that now returns lines
      setLines(res.data);
      if (res.data.length > 0) {
        setSelectedLineId(res.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch lines", error);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get("/tasks/tags");
      setTags(res.data);
    } catch (error) {
      console.error("Failed to fetch tags", error);
    }
  };

  const fetchCards = async () => {
    try {
      const res = await api.get(`/tasks/kanban?areaId=${selectedLineId}&date=${selectedDate}`);
      setCards(res.data);
    } catch (error) {
      console.error("Failed to fetch cards", error);
    }
  };

  const handleCardClick = (card: any) => {
    setActiveCard(card);
    setIsModalOpen(true);
  };

  const handleStartTask = async () => {
    try {
      await api.patch(`/tasks/${activeCard.id}/status`, { status: "IN_PROGRESS" });
      fetchCards();
      setIsModalOpen(false);
    } catch (error) {
      showAlert("Error", "Failed to start task.", "error");
    }
  };

  const handleCompleteTask = async () => {
    try {
      await api.patch(`/tasks/${activeCard.id}/status`, { status: "PENDING_SIGNATURE" });
      fetchCards();
      setIsModalOpen(false);
    } catch (error) {
      showAlert("Error", "Failed to complete task.", "error");
    }
  };

  const handleOpenTagModal = () => {
    setIsModalOpen(false);
    setTagModalOpen(true);
  };

  const handleReportProblem = async () => {
    if (!selectedTagId || !tagNotes) {
      showAlert("Required", "Please select a tag color and provide notes.", "error");
      return;
    }

    try {
      await api.post(`/tasks/${activeCard.id}/tag`, { tagId: selectedTagId, notes: tagNotes });
      fetchCards();
      setTagModalOpen(false);
      setSelectedTagId("");
      setTagNotes("");
      setActiveCard(null);
    } catch (error) {
      showAlert("Error", "Failed to report problem.", "error");
    }
  };

  const getRackBin = (status: string) => {
    return cards.filter(c => c.status === status);
  };

  const selectedLine = lines.find(l => l.id === selectedLineId);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-sm flex flex-col">
        <div className="relative px-8 py-6 flex items-center justify-between">
          <div className="z-10 flex flex-col">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
              {selectedLine ? selectedLine.name : "SELECT A LINE"}
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">4S+S Digital Control Board</p>
          </div>

          <div className="absolute inset-x-0 top-0 h-full flex flex-col items-center justify-center pointer-events-none">
            <h2 className="text-2xl font-black text-blue-400 uppercase tracking-widest bg-slate-900 px-6 py-1 rounded-md border border-slate-700 shadow-inner">
              {selectedDate ? format(new Date(selectedDate), "EEEE") : "DAY"}
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wide">
              {selectedDate ? format(new Date(selectedDate), "dd MMMM yyyy") : ""}
            </p>
          </div>

          <div className="z-10 flex space-x-4 items-center">
            <div className="flex space-x-2 border border-slate-700 bg-slate-900 rounded-lg overflow-hidden pointer-events-auto p-1">
              {lines.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLineId(l.id)}
                  className={`px-4 py-2 font-bold text-xs uppercase rounded transition-colors ${selectedLineId === l.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pointer-events-auto shadow-sm">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-200"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col md:flex-row gap-6">

        {/* Left Pane: Planning & Daily Queue */}
        <div className="flex-[2] flex flex-col gap-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-700/50 p-4 border-b border-slate-600 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-400" /> Kotak Kanban Shift Hari Ini (To-Do)</h3>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {getRackBin('TODO_RACK').length} Cards
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
              {getRackBin('TODO_RACK').map(card => (
                <KanbanCard key={card.id} card={card} onClick={() => handleCardClick(card)} />
              ))}
              {getRackBin('TODO_RACK').length === 0 && (
                <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-xl">
                  <CheckSquare className="w-12 h-12 mb-2 opacity-20" />
                  <p>All tasks pulled for this shift!</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl h-[35%] flex flex-col overflow-hidden">
            <div className="bg-slate-700/50 p-4 border-b border-slate-600 flex justify-between items-center">
              <h3 className="font-bold text-lg text-amber-400 flex items-center">In Progress (Active Work)</h3>
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30">
                {getRackBin('IN_PROGRESS').length} Active
              </span>
            </div>
            <div className="p-4 overflow-x-auto flex-1 flex gap-4 items-center">
              {getRackBin('IN_PROGRESS').map(card => (
                <KanbanCard key={card.id} card={card} onClick={() => handleCardClick(card)} compact />
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Escalation & Finish */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-slate-800 rounded-2xl border border-rose-900/50 shadow-xl flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="bg-rose-950/40 p-4 border-b border-rose-900/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-rose-400 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Kotak Delay/Problem</h3>
              <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30">
                {getRackBin('DELAY_PROBLEM').length} Issues
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
              {getRackBin('DELAY_PROBLEM').map(card => (
                <KanbanCard key={card.id} card={card} onClick={() => handleCardClick(card)} variant="danger" />
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-emerald-900/50 shadow-xl flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="bg-emerald-950/40 p-4 border-b border-emerald-900/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-emerald-400 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> Finish / Pending Signature</h3>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                {getRackBin('PENDING_SIGNATURE').length + getRackBin('FINISHED').length} Completed
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
              {getRackBin('PENDING_SIGNATURE').concat(getRackBin('FINISHED')).map(card => (
                <KanbanCard key={card.id} card={card} onClick={() => handleCardClick(card)} variant="success" />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Task Execution Modal */}
      {isModalOpen && activeCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-slate-700 text-blue-400 text-xs font-bold tracking-widest rounded-full mb-3 uppercase">
                    {activeCard.template.category.replace('_', ' ')}
                  </span>
                  <h2 className="text-3xl font-bold text-white leading-tight">{activeCard.template.title}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 p-2 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center text-slate-300 font-medium">
                <MapPin className="w-5 h-5 mr-2 text-rose-400" />
                Zone: {activeCard.template.zone?.name || 'Unassigned'}
              </div>
            </div>

            <div className="p-8 bg-slate-900/50 space-y-8">
              {/* Instructions */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Standard Work Instructions</h4>
                <ul className="space-y-3">
                  {activeCard.template.instructions && Array.isArray(activeCard.template.instructions) ? (
                    activeCard.template.instructions.map((inst: string, idx: number) => (
                      <li key={idx} className="flex items-start bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">{idx + 1}</span>
                        <span className="text-slate-200 text-lg">{inst}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No instructions provided.</p>
                  )}
                </ul>
              </div>

              {/* Required Tools */}
              {activeCard.template.tools && activeCard.template.tools.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Required Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeCard.template.tools.map((tool: any) => (
                      <div key={tool.id} className="flex items-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                        <Wrench className="w-4 h-4 text-amber-400 mr-2" />
                        <span className="font-medium text-slate-300">{tool.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex flex-col sm:flex-row gap-4 bg-slate-800">
              {activeCard.status === 'TODO_RACK' && (
                <button onClick={handleStartTask} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:scale-[1.02]">
                  START TASK (PULL CARD)
                </button>
              )}

              {activeCard.status === 'IN_PROGRESS' && (
                <>
                  <button onClick={handleOpenTagModal} className="flex-1 py-4 bg-rose-900/50 hover:bg-rose-900 border border-rose-700 text-rose-300 text-lg font-bold rounded-xl transition-colors flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 mr-2" /> REPORT PROBLEM
                  </button>
                  <button onClick={handleCompleteTask} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all transform hover:scale-[1.02] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 mr-2" /> COMPLETE TASK
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tagging Abnormality Modal */}
      {tagModalOpen && activeCard && (
        <div className="fixed inset-0 bg-rose-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 rounded-3xl shadow-[0_0_50px_rgba(225,29,72,0.2)] w-full max-w-xl overflow-hidden border border-rose-800 animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-slate-800 bg-rose-900/20">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <AlertTriangle className="w-7 h-7 text-rose-500 mr-3" />
                Tag Abnormality
              </h2>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Select Tag Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTagId(tag.id)}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${selectedTagId === tag.id
                          ? (tag.color === 'RED' ? 'border-rose-500 bg-rose-500/20' : 'border-blue-500 bg-blue-500/20')
                          : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                        }`}
                    >
                      <div className={`w-12 h-16 rounded-sm mb-3 ${tag.color === 'RED' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`}></div>
                      <span className="font-bold text-center text-white">{tag.name}</span>
                      <span className="text-xs mt-1 opacity-70 font-medium">Severity: {tag.severityLevel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Problem Description</label>
                <textarea
                  value={tagNotes}
                  onChange={e => setTagNotes(e.target.value)}
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                  placeholder="Describe what is broken, missing, or abnormal..."
                />
              </div>
            </div>

            <div className="p-6 bg-slate-800 border-t border-slate-700 flex gap-4">
              <button onClick={() => setTagModalOpen(false)} className="flex-1 py-4 text-slate-300 font-bold hover:bg-slate-700 rounded-xl transition-colors">
                CANCEL
              </button>
              <button onClick={handleReportProblem} className="flex-[2] py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all">
                ISSUE TAG & MOVE TO DELAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for the physical-looking card
function KanbanCard({ card, onClick, variant = 'default', compact = false }: { card: any, onClick: () => void, variant?: 'default' | 'danger' | 'success', compact?: boolean }) {
  const getColors = () => {
    switch (variant) {
      case 'danger': return 'bg-rose-950/40 border-rose-800/50 hover:border-rose-500/50 shadow-rose-900/20';
      case 'success': return 'bg-emerald-950/40 border-emerald-800/50 hover:border-emerald-500/50 shadow-emerald-900/20';
      default: return 'bg-slate-800 border-slate-600 hover:border-blue-500 shadow-slate-900/50';
    }
  };

  const getAccent = () => {
    if (card.tags && card.tags.length > 0) {
      return card.tags[0].color === 'RED' ? 'bg-rose-500' : 'bg-blue-500';
    }
    return 'bg-slate-600';
  };

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border-2 ${getColors()} p-4 transition-all hover:shadow-lg transform hover:-translate-y-1 ${compact ? 'min-w-[250px]' : ''}`}
    >
      <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-md ${getAccent()}`}></div>
      <div className="pl-2">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
          {card.template.category.replace('_', ' ')}
        </div>
        <h4 className="font-bold text-white text-base leading-snug mb-2">{card.template.title}</h4>

        <div className="flex items-center text-xs text-slate-400 font-medium mb-3">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="truncate">{card.template.zone?.name || 'No Zone'}</span>
        </div>

        {card.tags && card.tags.length > 0 && (
          <div className="mb-3 flex items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3 mr-1" /> TAG ATTACHED
          </div>
        )}

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex -space-x-2">
            {card.assignee ? (
              <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-800 flex items-center justify-center text-white text-xs font-bold" title={card.assignee.name}>
                {card.assignee.name.charAt(0)}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-slate-400 text-xs">
                <User className="w-3 h-3" />
              </div>
            )}
          </div>

          <span className="text-[10px] uppercase font-bold text-slate-500">
            {card.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
