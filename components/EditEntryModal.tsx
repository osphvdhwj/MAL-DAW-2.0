import React, { useState, useEffect } from 'react';
import { JikanAnime, LibraryEntry, LibraryStatus } from '../types';
import { 
  XMarkIcon, 
  CheckIcon, 
  CalendarIcon, 
  TagIcon, 
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface EditEntryModalProps {
  anime: JikanAnime;
  existingEntry?: LibraryEntry;
  theme: string;
  onSave: (entry: LibraryEntry) => void;
  onClose: () => void;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  anime,
  existingEntry,
  theme,
  onSave,
  onClose
}) => {
  // Form State
  const [status, setStatus] = useState<LibraryStatus>(existingEntry?.status || LibraryStatus.PLAN_TO_WATCH);
  const [score, setScore] = useState<number>(existingEntry?.score || 0);
  const [progress, setProgress] = useState<number>(existingEntry?.progress || 0);
  const [startDate, setStartDate] = useState<string>(existingEntry?.startDate || '');
  const [finishDate, setFinishDate] = useState<string>(existingEntry?.finishDate || '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>(existingEntry?.priority || 'Medium');
  const [rewatching, setRewatching] = useState<boolean>(existingEntry?.rewatching || false);
  const [rewatchCount, setRewatchCount] = useState<number>(existingEntry?.rewatchCount || 0);
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState<string>(existingEntry?.notes || '');

  const totalEpisodes = anime.episodes || 0;

  const handleSave = () => {
    const entry: LibraryEntry = {
      id: anime.mal_id,
      anime: anime,
      status,
      progress,
      totalEpisodes: totalEpisodes || null,
      score,
      dateAdded: existingEntry?.dateAdded || Date.now(),
      startDate,
      finishDate,
      priority,
      rewatching,
      rewatchCount,
      tags,
      notes
    };
    onSave(entry);
    onClose();
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const getThemeColor = () => {
    // Simple mapping for dynamic classes logic
    return `text-${theme}-500`;
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 bg-[#111]">
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-bold text-white">Edit Entry</h2>
        <button onClick={handleSave} className={`text-${theme}-500 font-bold flex items-center gap-1`}>
          <CheckIcon className="h-5 w-5" /> Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        {/* Status Section */}
        <section>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(LibraryStatus).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`py-3 px-2 rounded-lg text-sm font-medium border transition-all ${
                  status === s 
                    ? `bg-${theme}-900/30 border-${theme}-500 text-${theme}-400` 
                    : 'bg-[#1a1a1a] border-gray-800 text-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Score & Progress */}
        <section className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Score (0-10)</label>
             <div className="relative">
               <select 
                 value={score} 
                 onChange={(e) => setScore(Number(e.target.value))}
                 className="w-full bg-[#1a1a1a] border border-gray-800 text-white rounded-lg p-3 appearance-none focus:border-blue-500 outline-none"
               >
                 <option value="0">Select Score</option>
                 {[10,9,8,7,6,5,4,3,2,1].map(num => (
                   <option key={num} value={num}>({num}) {num === 10 ? 'Masterpiece' : num === 1 ? 'Appalling' : ''}</option>
                 ))}
               </select>
               <StarIcon className="absolute right-3 top-3.5 h-5 w-5 text-yellow-500 pointer-events-none" />
             </div>
           </div>

           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Progress</label>
             <div className="flex items-center bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
                <input 
                  type="number" 
                  value={progress}
                  onChange={(e) => setProgress(Math.min(totalEpisodes || 9999, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-transparent text-white p-3 outline-none text-center"
                  placeholder="0"
                />
                <div className="px-3 text-gray-500 text-sm border-l border-gray-800">
                  / {totalEpisodes || '?'}
                </div>
             </div>
           </div>
        </section>

        {/* Dates */}
        <section>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Dates Watched
           </label>
           <div className="space-y-3">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                 <span className="text-sm text-gray-400">Start Date</span>
                 <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-white text-right outline-none text-sm"
                 />
              </div>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                 <span className="text-sm text-gray-400">Finish Date</span>
                 <input 
                    type="date" 
                    value={finishDate} 
                    onChange={(e) => setFinishDate(e.target.value)}
                    className="bg-transparent text-white text-right outline-none text-sm"
                 />
              </div>
           </div>
        </section>

        {/* Advanced (Rewatch, Priority) */}
        <section>
           <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
              {/* Priority */}
              <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FlagIcon className="h-4 w-4" /> Priority
                 </div>
                 <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="bg-[#111] border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none"
                 >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                 </select>
              </div>

              {/* Rewatching */}
              <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm text-gray-300">
                    <ArrowPathIcon className="h-4 w-4" /> Is Rewatching?
                 </div>
                 <input 
                   type="checkbox" 
                   checked={rewatching}
                   onChange={(e) => setRewatching(e.target.checked)}
                   className="w-5 h-5 rounded accent-blue-500"
                 />
              </div>

              {/* Rewatch Count */}
              <div className="p-3 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="ml-6">Times Rewatched</span>
                 </div>
                 <input 
                   type="number" 
                   value={rewatchCount}
                   onChange={(e) => setRewatchCount(Number(e.target.value))}
                   className="w-16 bg-[#111] border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none text-center"
                 />
              </div>
           </div>
        </section>

        {/* Tags */}
        <section>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <TagIcon className="h-4 w-4" /> Tags
           </label>
           <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3">
              <div className="flex flex-wrap gap-2 mb-2">
                 {tags.map(tag => (
                    <span key={tag} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                       {tag} <button onClick={() => removeTag(tag)}><XMarkIcon className="h-3 w-3" /></button>
                    </span>
                 ))}
              </div>
              <input 
                 type="text"
                 value={tagInput}
                 onChange={(e) => setTagInput(e.target.value)}
                 onKeyDown={addTag}
                 placeholder="Add tag (Press Enter)..."
                 className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
              />
           </div>
        </section>

        {/* Notes */}
        <section>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4" /> Comments / Notes
           </label>
           <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 text-white text-sm outline-none focus:border-blue-500 resize-none"
              placeholder="Write your thoughts here..."
           />
        </section>

      </div>
    </div>
  );
};