import React, { useMemo, useState, useRef } from 'react';
import { LibraryEntry, LibraryStatus } from '../types';
import { AnimeCard } from './AnimeCard';
import { TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface LibraryViewProps {
  library: LibraryEntry[];
  onSelectAnime: (anime: any) => void;
  onDeleteEntry: (id: number) => void;
  onImportLibrary: (entries: LibraryEntry[]) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ library, onSelectAnime, onDeleteEntry, onImportLibrary }) => {
  const [activeTab, setActiveTab] = useState<LibraryStatus | 'All'>('All');
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLibrary = useMemo(() => {
    if (activeTab === 'All') return library;
    return library.filter(entry => entry.status === activeTab);
  }, [library, activeTab]);

  const stats = useMemo(() => {
    const counts = {
      [LibraryStatus.WATCHING]: 0,
      [LibraryStatus.COMPLETED]: 0,
      [LibraryStatus.PLAN_TO_WATCH]: 0,
      [LibraryStatus.DROPPED]: 0,
    };
    library.forEach(entry => {
      if (counts[entry.status] !== undefined) counts[entry.status]++;
    });
    return counts;
  }, [library]);

  const handleExport = () => {
      if (library.length === 0) {
          alert("Library is empty!");
          return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "mal_down_library.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Try parsing JSON first (Native format)
      try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
              onImportLibrary(json);
              alert(`Imported ${json.length} entries from JSON backup.`);
              return;
          }
      } catch (e) {
          // Not JSON, try XML
      }

      // XML parsing logic for MAL export
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const animeNodes = xmlDoc.getElementsByTagName("anime");
        
        const newEntries: LibraryEntry[] = [];
        Array.from(animeNodes).forEach(node => {
            const id = parseInt(node.getElementsByTagName("series_animedb_id")[0]?.textContent || "0");
            const title = node.getElementsByTagName("series_title")[0]?.textContent || "Unknown";
            const statusRaw = node.getElementsByTagName("my_status")[0]?.textContent || "";
            const image = node.getElementsByTagName("series_image")[0]?.textContent || "";
            
            let status = LibraryStatus.PLAN_TO_WATCH;
            if (statusRaw === "Completed") status = LibraryStatus.COMPLETED;
            if (statusRaw === "Watching") status = LibraryStatus.WATCHING;
            if (statusRaw === "Dropped") status = LibraryStatus.DROPPED;

            if (id && !library.find(l => l.id === id)) {
                const partialAnime: any = {
                    mal_id: id,
                    title: title,
                    images: { jpg: { large_image_url: image } },
                    year: 0,
                    score: 0,
                    status: 'Unknown',
                    type: 'TV'
                };

                newEntries.push({
                    id,
                    anime: partialAnime,
                    status,
                    progress: 0,
                    dateAdded: Date.now()
                });
            }
        });

        if (newEntries.length > 0) {
            onImportLibrary(newEntries);
            alert(`Successfully imported ${newEntries.length} entries from XML!`);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full pb-24">
      <div className="bg-black sticky top-0 z-20 border-b border-gray-900">
        <div className="px-4 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">My Collection</h2>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowStats(!showStats)}
                    className="p-2 rounded-full bg-[#1e1e1e] text-blue-400 active:bg-[#333]"
                    title="Stats"
                >
                    <ChartBarIcon className="h-6 w-6" />
                </button>
                <button 
                    onClick={handleExport}
                    className="p-2 rounded-full bg-[#1e1e1e] text-yellow-400 active:bg-[#333]"
                    title="Export JSON"
                >
                    <ArrowDownTrayIcon className="h-6 w-6" />
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full bg-[#1e1e1e] text-green-400 active:bg-[#333]"
                    title="Import XML/JSON"
                >
                    <ArrowUpTrayIcon className="h-6 w-6" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".xml,.json" 
                    className="hidden" 
                />
            </div>
        </div>

        {/* Stats Dashboard */}
        {showStats && (
            <div className="px-4 pb-4 animate-fade-in">
                <div className="bg-[#111] rounded-xl p-4 border border-gray-800">
                    <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50">
                            <div className="text-2xl font-bold text-blue-400">{stats[LibraryStatus.WATCHING]}</div>
                            <div className="text-xs text-gray-400">Watching</div>
                        </div>
                        <div className="bg-green-900/20 p-3 rounded border border-green-900/50">
                            <div className="text-2xl font-bold text-green-400">{stats[LibraryStatus.COMPLETED]}</div>
                            <div className="text-xs text-gray-400">Completed</div>
                        </div>
                        <div className="bg-yellow-900/20 p-3 rounded border border-yellow-900/50">
                            <div className="text-2xl font-bold text-yellow-400">{stats[LibraryStatus.PLAN_TO_WATCH]}</div>
                            <div className="text-xs text-gray-400">Planned</div>
                        </div>
                        <div className="bg-red-900/20 p-3 rounded border border-red-900/50">
                            <div className="text-2xl font-bold text-red-400">{stats[LibraryStatus.DROPPED]}</div>
                            <div className="text-xs text-gray-400">Dropped</div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {['All', ...Object.values(LibraryStatus)].map((status) => (
            <button
            key={status}
            onClick={() => setActiveTab(status as LibraryStatus | 'All')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === status 
                ? 'bg-white text-black' 
                : 'bg-[#1e1e1e] text-gray-400 border border-gray-800'
            }`}
            >
            {status}
            </button>
        ))}
        </div>
      </div>

      {filteredLibrary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <div className="w-16 h-16 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📂</span>
          </div>
          <p>No anime in this list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 px-3 pt-3">
          {filteredLibrary.map((entry) => (
            <div key={entry.id} className="relative group">
                <div className="aspect-[2/3]">
                    <AnimeCard anime={entry.anime} onClick={() => onSelectAnime(entry.anime)} />
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm('Remove from library?')) onDeleteEntry(entry.id);
                        }}
                        className="p-1.5 bg-black/70 backdrop-blur-md text-red-400 rounded-full shadow-lg"
                    >
                        <TrashIcon className="h-3 w-3" />
                    </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};