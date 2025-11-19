import React from 'react';
import { DownloadJob } from '../types';
import { 
  ArrowDownTrayIcon, 
  PauseIcon, 
  PlayIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface DownloadManagerProps {
  downloads: DownloadJob[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({ 
  downloads, 
  onPause, 
  onResume, 
  onCancel, 
  onClearHistory,
  onClose 
}) => {
  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'paused' || d.status === 'pending');
  const historyDownloads = downloads.filter(d => d.status === 'completed' || d.status === 'failed');

  return (
    <div className="min-h-screen bg-black text-white pb-24 animate-fade-in flex flex-col">
      <div className="sticky top-0 z-30 bg-[#111]/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex justify-between items-center shadow-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <ArrowDownTrayIcon className="h-6 w-6 text-blue-500" />
            Downloads
        </h2>
        <button onClick={onClose} className="p-2 bg-[#222] rounded-full hover:bg-[#333] transition-colors">
          <XMarkIcon className="h-6 w-6 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-8 overflow-y-auto">
        {/* Active Queue */}
        <section>
          <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Active Queue ({activeDownloads.length})</h3>
          </div>
          
          {activeDownloads.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-8 bg-[#111] rounded-xl border border-gray-800 border-dashed">
                 <CheckCircleIcon className="h-8 w-8 text-gray-600 mb-2" />
                 <div className="text-gray-500 text-sm">No active downloads.</div>
             </div>
          ) : (
            <div className="space-y-3">
              {activeDownloads.map(job => (
                <div key={job.id} className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800 shadow-lg flex gap-3 items-center">
                  <div className="h-12 w-12 bg-gray-800 rounded-lg overflow-hidden shrink-0 relative">
                    {job.thumbnail ? (
                        <img src={job.thumbnail} className="w-full h-full object-cover" alt="Thumb" />
                    ) : (
                        <PhotoIcon className="h-6 w-6 absolute top-3 left-3 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-medium truncate text-white pr-2">{job.fileName}</p>
                      <span className="text-xs font-mono text-blue-400">{Math.round(job.progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ease-out ${job.status === 'paused' ? 'bg-yellow-500' : 'bg-blue-600'}`} 
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-gray-500 capitalize">{job.status}...</p>
                    </div>
                  </div>
                  <div className="flex gap-1 pl-2 border-l border-gray-700">
                    {job.status === 'downloading' ? (
                      <button onClick={() => onPause(job.id)} className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-full"><PauseIcon className="h-5 w-5" /></button>
                    ) : (
                      <button onClick={() => onResume(job.id)} className="p-2 text-green-400 hover:bg-green-400/10 rounded-full"><PlayIcon className="h-5 w-5" /></button>
                    )}
                    <button onClick={() => onCancel(job.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-full"><XMarkIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">History</h3>
             {historyDownloads.length > 0 && (
               <button onClick={onClearHistory} className="text-xs text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-900/20">
                 <TrashIcon className="h-3 w-3" /> Clear All
               </button>
             )}
          </div>
          
          {historyDownloads.length === 0 ? (
             <div className="text-center py-12 text-gray-700">
               <ArrowDownTrayIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
               <p className="text-sm">Download history is empty</p>
             </div>
          ) : (
            <div className="space-y-2">
               {historyDownloads.map(job => (
                 <div key={job.id} className="bg-[#111] rounded-lg p-3 flex items-center gap-3 border border-gray-800/50 hover:border-gray-700 transition-colors">
                    <div className="h-10 w-10 bg-gray-800 rounded overflow-hidden shrink-0 opacity-80">
                      {job.thumbnail && <img src={job.thumbnail} className="w-full h-full object-cover" alt="Thumb" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm text-gray-300 truncate">{job.fileName}</p>
                       <p className="text-[10px] text-gray-500 flex items-center gap-1">
                         {new Date(job.timestamp).toLocaleTimeString()} • 
                         <span className={job.status === 'completed' ? 'text-green-500' : 'text-red-500 capitalize'}>
                            {job.status === 'completed' ? 'Success' : 'Failed'}
                         </span>
                       </p>
                    </div>
                    <div>
                      {job.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};