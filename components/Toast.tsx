import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ToastNotification } from '../types';

interface ToastProps {
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center space-y-2 pointer-events-none px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastNotification; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const bg = toast.type === 'success' ? 'bg-green-900/90 border-green-700' 
           : toast.type === 'error' ? 'bg-red-900/90 border-red-700' 
           : 'bg-blue-900/90 border-blue-700';
  
  const Icon = toast.type === 'success' ? CheckCircleIcon 
             : toast.type === 'error' ? XCircleIcon 
             : InformationCircleIcon;

  return (
    <div className={`${bg} backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 min-w-[200px] max-w-sm animate-fade-in-up transition-all transform pointer-events-auto`}>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
};