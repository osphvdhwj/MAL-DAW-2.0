import React, { useMemo, useState, useRef } from 'react';
import { LibraryEntry, LibraryStatus, LibraryFilter, SortOption } from '../types';
import { AnimeCard } from './AnimeCard';
import { 
  TrashIcon, 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon, 
  ChartBarIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  MinusIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface LibraryViewProps {
  library: LibraryEntry[];
  onSelectAnime: (anime: any) => void;
  onDeleteEntry: (id: number) => void;
  onImportLibrary: (entries: LibraryEntry[]) => void;
  onUpdateProgress: (id: number, newProgress: number) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  library, 
  onSelectAnime, 
  onDeleteEntry, 
  onImportLibrary, 
  onUpdateProgress 
}) => {
  const [activeTab, setActiveTab] = useState<LibraryStatus | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('date_added');
  const [sortAsc, setSortAsc] = useState(false);

  // Filtering State
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>({ genres: [], years: [], studios: [] });
  
  // Extract available options from library for filter chips
  const availableGenres = useMemo(() => [...new Set(library.flatMap(e => e.anime.genres?.map(g => g.name) || []))].sort(), [library]);
  const availableYears = useMemo(() => [...new Set(library.map(e => e.anime.year).filter(y => y))].sort((a,b) => (b as number) - (a as number)), [library]);
  const availableStudios = useMemo(() => [...new Set(library.flatMap(e => e.anime.studios?.map(s => s.name) || []))].sort(), [library]);

  const filteredLibrary = useMemo(() => {
    let data = library;

    // 1. Status Filter
    if (activeTab !== 'All') {
      data = data.filter(entry => entry.status === activeTab);
    }

    // 2. Search Filter
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        data = data.filter(entry => 
            entry.anime.title.toLowerCase().includes(lower) || 
            entry.anime.title_english?.toLowerCase().includes(lower)
        );
    }

    // 3. Advanced Filters
    if (activeFilter.genres.length > 0) {
      data = data.filter(entry => entry.anime.genres?.some(g => activeFilter.genres.includes(g.name)));
    }
    if (activeFilter.years.length > 0) {
      data = data.filter(entry => activeFilter.years.includes(entry.anime.year || 0));
    }
    if (activeFilter.studios.length > 0) {
      data = data.filter(entry => entry.anime.studios?.some(s => activeFilter.studios.includes(s.name)));
    }

    // 4. Sorting
    data = [...data].sort((a, b) => {
        let valA: any, valB: any;
        switch(sortBy) {
            case 'score': valA = a.anime.score || 0; valB = b.anime.score || 0; break;
            case 'title': valA = a.anime.title; valB = b.anime.title; break;
            case 'progress': valA = a.progress; valB = b.progress; break;
            case 'date_added': default: valA = a.dateAdded; valB = b.dateAdded; break;
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    return data;
  }, [library, activeTab, activeFilter, searchQuery, sortBy, sortAsc]);

  const handleExport = () => {
      if (library.length === 0) {
          alert("Library is empty!");
          return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `mal_down_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
              onImportLibrary(json);
              alert(`Successfully imported ${json.length} entries.`);
          }
      } catch (e) {
          alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const toggleFilter = (type: 'genres' | 'years' | 'studios', value: string | number) => {
    setActiveFilter(prev => {
      const list = prev[type] as any[];
      if (list.includes(value)) {
        return { ...prev, [type]: list.filter(i => i !== value) };
      } else {
        return { ...prev, [type]: [...list, value] };
      }
    });
  };

  const isFilterActive = activeFilter.genres.length > 0 || activeFilter.years.length > 0 || activeFilter.studios.length > 0;

  return (
    <div className="w-full pb-24 min-h-screen bg-black animate-fade-in">
      {/* Sticky Header */}
      <div className="bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-gray-800 shadow-xl">
        <div className="px-4 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Collection 
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{filteredLibrary.length}</span>
            </h2>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-full active:bg-[#333] transition-colors ${isFilterActive ? 'bg-blue-900 text-blue-200 ring-1 ring-blue-500' : 'bg-[#1e1e1e] text-gray-300'}`}
                >
                    <FunnelIcon className="h-5 w-5" />
                </button>
                <button 
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2 rounded-full bg-[#1e1e1e] text-gray-300 active:bg-[#333] transition-colors"
                >
                    {viewMode === 'grid' ? <ListBulletIcon className="h-5 w-5" /> : <Squares2X2Icon className="h-5 w-5" />}
                </button>
                <button onClick={handleExport} className="p-2 rounded-full bg-[#1e1e1e] text-gray-300 hover:text-yellow-500 active:bg-[#333] transition-colors">
                   <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full bg-[#1e1e1e] text-gray-300 hover:text-green-500 active:bg-[#333] transition-colors">
                   <ArrowUpTrayIcon className="h-5 w-5" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
            </div>
        </div>

        {/* Search Bar inside Library */}
        <div className="px-4 pb-3">
            <div className="relative bg-[#111] rounded-lg flex items-center border border-gray-800">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 ml-3" />
                <input 
                    type="text" 
                    placeholder="Filter by title..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-sm p-3 text-white focus:ring-0 placeholder-gray-600"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mr-3 text-gray-500">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="px-4 pb-4 border-b border-gray-800 bg-[#0a0a0a] animate-fade-in max-h-[60vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 mt-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-blue-500" /> Filters & Sort
                </h3>
                <button onClick={() => setActiveFilter({ genres: [], years: [], studios: [] })} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
             </div>
             
             {/* Sort Section */}
             <div className="mb-4 bg-[#111] p-3 rounded-lg border border-gray-800">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500 uppercase font-bold">Sort By</p>
                    <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 text-xs text-blue-400">
                        <ArrowsUpDownIcon className="h-3 w-3" /> {sortAsc ? 'Ascending' : 'Descending'}
                    </button>
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                     {(['date_added', 'score', 'title', 'progress'] as SortOption[]).map(opt => (
                         <button 
                            key={opt}
                            onClick={() => setSortBy(opt)}
                            className={`text-xs py-1.5 rounded border ${sortBy === opt ? 'bg-blue-900/50 border-blue-600 text-blue-200' : 'border-gray-700 text-gray-400'}`}
                         >
                             {opt.replace('_', ' ')}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="space-y-4">
                {/* Genres */}
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2 font-bold">Genre</p>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map(g => (
                      <button 
                        key={g} 
                        onClick={() => toggleFilter('genres', g)}
                        className={`px-2.5 py-1 rounded-md text-xs border transition-all ${activeFilter.genres.includes(g) ? 'bg-blue-600 border-blue-600 text-white shadow-glow-blue' : 'border-gray-700 bg-[#1a1a1a] text-gray-400'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                 {/* Years */}
                 <div>
                  <p className="text-xs text-gray-500 uppercase mb-2 font-bold">Release Year</p>
                  <div className="flex flex-wrap gap-2">
                    {availableYears.map(y => (
                      <button 
                        key={y as number} 
                        onClick={() => toggleFilter('years', y as number)}
                        className={`px-2.5 py-1 rounded-md text-xs border transition-all ${activeFilter.years.includes(y as number) ? 'bg-purple-600 border-purple-600 text-white shadow-glow-purple' : 'border-gray-700 bg-[#1a1a1a] text-gray-400'}`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-2 pb-0 flex gap-2 overflow-x-auto no-scrollbar">
            {['All', ...Object.values(LibraryStatus)].map((status) => (
                <button
                key={status}
                onClick={() => setActiveTab(status as LibraryStatus | 'All')}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === status 
                    ? 'text-white' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                >
                {status}
                {activeTab === status && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                </button>
            ))}
        </div>
      </div>

      {/* Library Content */}
      {filteredLibrary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600 animate-fade-in">
          <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-4 shadow-inner">
            <MagnifyingGlassIcon className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-sm font-medium">No anime matches your filters.</p>
          <button onClick={() => {setSearchQuery(''); setActiveFilter({genres:[],years:[],studios:[]});}} className="mt-4 text-blue-500 text-sm">Clear all filters</button>
        </div>
      ) : (
        <div className={`px-3 pt-3 pb-20 ${viewMode === 'grid' ? 'grid grid-cols-3 xs:grid-cols-4 gap-2 xs:gap-3' : 'flex flex-col gap-3'}`}>
          {filteredLibrary.map((entry) => (
            <div key={entry.id} className="relative group">
                {viewMode === 'grid' ? (
                    // Grid View Item
                    <div className="relative">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg bg-[#1e1e1e]">
                            <AnimeCard anime={entry.anime} onClick={() => onSelectAnime(entry.anime)} />
                        </div>
                        {/* Compact Progress Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-1 px-1 flex justify-between items-center">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onUpdateProgress(entry.id, entry.progress - 1); }}
                                className="text-white/70 hover:text-white p-1"
                            >
                                <MinusIcon className="h-3 w-3" />
                            </button>
                            <span className="text-[10px] font-bold text-blue-400 drop-shadow-md">{entry.progress}/{entry.anime.episodes || '?'}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdateProgress(entry.id, entry.progress + 1); }}
                                className="text-white/70 hover:text-white p-1"
                            >
                                <PlusIcon className="h-3 w-3" />
                            </button>
                        </div>
                        {/* Status Dot */}
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full shadow-sm ${
                            entry.status === LibraryStatus.WATCHING ? 'bg-blue-500' : 
                            entry.status === LibraryStatus.COMPLETED ? 'bg-green-500' : 
                            entry.status === LibraryStatus.DROPPED ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        
                        {/* Score Badge if exists */}
                        {entry.score > 0 && (
                            <div className="absolute top-1 left-1 px-1 rounded bg-yellow-500/90 text-black text-[10px] font-bold shadow-sm flex items-center">
                                <StarIcon className="h-2 w-2 mr-0.5" /> {entry.score}
                            </div>
                        )}
                    </div>
                ) : (
                    // List View Item
                    <div 
                        className="flex gap-3 bg-[#111] p-3 rounded-xl border border-gray-800 active:bg-[#1a1a1a] shadow-sm"
                        onClick={() => onSelectAnime(entry.anime)}
                    >
                        <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-[#222]">
                            <img src={entry.anime.images.jpg.large_image_url} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                            <div>
                                <h3 className="font-bold text-white text-sm line-clamp-1">{entry.anime.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                     <span className={`w-2 h-2 rounded-full ${
                                        entry.status === LibraryStatus.WATCHING ? 'bg-blue-500' : 
                                        entry.status === LibraryStatus.COMPLETED ? 'bg-green-500' : 
                                        entry.status === LibraryStatus.DROPPED ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} />
                                    <p className="text-xs text-gray-500">{entry.status}</p>
                                    {entry.score > 0 && (
                                        <span className="text-xs text-yellow-400 flex items-center gap-1 ml-2">
                                            <StarIcon className="h-3 w-3" /> {entry.score}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 bg-[#000] px-2 py-1 rounded-lg border border-gray-800" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onUpdateProgress(entry.id, entry.progress - 1)} className="text-gray-400 p-1 active:text-white"><MinusIcon className="h-3 w-3" /></button>
                                    <span className="text-xs font-mono font-bold text-blue-400 w-10 text-center">
                                        {entry.progress} <span className="text-gray-600">/ {entry.anime.episodes || '?'}</span>
                                    </span>
                                    <button onClick={() => onUpdateProgress(entry.id, entry.progress + 1)} className="text-gray-400 p-1 active:text-white"><PlusIcon className="h-3 w-3" /></button>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(window.confirm('Delete from library?')) onDeleteEntry(entry.id);
                                    }}
                                    className="p-2 text-gray-600 hover:text-red-500"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};