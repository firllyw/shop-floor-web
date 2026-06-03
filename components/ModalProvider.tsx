"use client";

import React, { createContext, useContext, useState } from "react";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

interface ModalContextType {
  showAlert: (title: string, message: string, type?: "success" | "error" | "info") => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ModalContext = createContext<ModalContextType>({
  showAlert: () => {},
  showConfirm: () => {},
});

export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  const closeAlert = () => setAlertState(null);
  const closeConfirm = () => setConfirmState(null);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Alert Modal */}
      {alertState?.isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-4 flex items-center space-x-3 border-b ${alertState.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : alertState.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
              {alertState.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {alertState.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {alertState.type === 'info' && <Info className="w-5 h-5" />}
              <h3 className="font-semibold">{alertState.title}</h3>
            </div>
            <div className="p-5 text-gray-600 text-sm leading-relaxed">
              {alertState.message}
            </div>
            <div className="p-4 bg-gray-50 flex justify-end">
              <button onClick={closeAlert} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState?.isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 flex items-center space-x-3 border-b bg-yellow-50 text-yellow-800 border-yellow-100">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">{confirmState.title}</h3>
            </div>
            <div className="p-5 text-gray-600 text-sm leading-relaxed">
              {confirmState.message}
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3">
              <button onClick={closeConfirm} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmState.onConfirm();
                  closeConfirm();
                }} 
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
