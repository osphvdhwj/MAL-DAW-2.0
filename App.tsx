import React, { useState, useEffect, useRef } from 'react';
import { searchAnime, getTopAnime, getSeasonNow, getRandomAnime, getSchedule } from './services/geminiService';
import { JikanAnime, AppView, LibraryEntry, LibraryStatus, DownloadJob, MalSyncConfig, ToastNotification } from './types';
import { SearchBar } from './components/SearchBar';
import { AnimeCard } from './components/AnimeCard';
import { LibraryView } from './components/LibraryView';
import { DetailsView } from './components/DetailsView';
import { DownloadManager } from './components/DownloadManager';
import { ToastContainer } from './components/Toast';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  RectangleStackIcon,
  FireIcon,
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  RectangleStackIcon as RectangleStackIconSolid
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  
  // --- Data State ---
  const [homeData, setHomeData] = useState<{
    top: JikanAnime[];
    seasonal: JikanAnime[];
    schedule: JikanAnime[];
  }>({ top: [], seasonal: [], schedule: [] });

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [homeMode, setHomeMode] = useState<'top' | 'season' | 'schedule'>('top');
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  
  const [searchResults, setSearchResults] = useState<JikanAnime[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [animeStack, setAnimeStack] = useState<JikanAnime[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHome, setIsLoadingHome] = useState(true);

  // --- Download Manager State ---
  const [downloads, setDownloads] = useState<DownloadJob[]>([]);
  const [showDownloads, setShowDownloads] = useState(false);

  // --- Settings/Sync State ---
  const [showSettings, setShowSettings] = useState(false);
  const [malConfig, setMalConfig] = useState<MalSyncConfig>({ username: '', lastSynced: null, autoSync: false, isLoggedIn: false });
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Toast State ---
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // --- Infinite Scroll Ref ---
  const observerTarget = useRef(null);

  // Load Persistent Data
  useEffect(() => {
    const savedLib = localStorage.getItem('maldown-library');
    if (savedLib) setLibrary(JSON.parse(savedLib));

    const savedDownloads = localStorage.getItem('maldown-downloads');
    if (savedDownloads) setDownloads(JSON.parse(savedDownloads));

    const savedConfig = localStorage.getItem('maldown-sync-config');
    if (savedConfig) setMalConfig(JSON.parse(savedConfig));
  }, []);

  // Save Persistent Data
  useEffect(() => {
    localStorage.setItem('maldown-library', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem('maldown-downloads', JSON.stringify(downloads));
  }, [downloads]);

  useEffect(() => {
    localStorage.setItem('maldown-sync-config', JSON.stringify(malConfig));
  }, [malConfig]);

  // --- API Calls ---

  // Initial Load
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoadingHome(true);
      try {
          const [top, season] = await Promise.all([getTopAnime(1), getSeasonNow(1)]);
          setHomeData(prev => ({ ...prev, top, seasonal: season }));
      } catch (e) {
          console.error("Failed to load home", e);
          addToast('Failed to load anime data', 'error');
      } finally {
          setIsLoadingHome(false);
      }
    };
    loadInitial();
  }, []);

  // Schedule Fetch
  useEffect(() => {
    if (homeMode === 'schedule') {
      setIsLoadingHome(true);
      getSchedule(selectedDay).then(data => {
        setHomeData(prev => ({ ...prev, schedule: data }));
        setIsLoadingHome(false);
      });
    }
  }, [homeMode, selectedDay]);

  // Infinite Scroll Effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoadingHome && view !== AppView.LIBRARY && view !== AppView.SETTINGS && view !== AppView.DOWNLOADS) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoadingHome, view, page, homeMode, currentQuery]);

  const loadMore = async () => {
    setIsFetchingMore(true);
    const nextPage = page + 1;
    
    try {
      let newItems: JikanAnime[] = [];
      
      if (view === AppView.HOME) {
        if (homeMode === 'top') {
          newItems = await getTopAnime(nextPage);
          setHomeData(prev => ({ ...prev, top: [...prev.top, ...newItems] }));
        } else if (homeMode === 'season') {
          newItems = await getSeasonNow(nextPage);
          setHomeData(prev => ({ ...prev, seasonal: [...prev.seasonal, ...newItems] }));
        }
      } else if (view === AppView.SEARCH && currentQuery) {
        newItems = await searchAnime(currentQuery, nextPage);
        setSearchResults(prev => [...prev, ...newItems]);
      }

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setPage(nextPage);
      }
    } catch (e) {
      console.error("Load more failed", e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setCurrentQuery(query);
    setPage(1);
    setHasMore(true);
    try {
        const results = await searchAnime(query, 1);
        setSearchResults(results);
    } catch(e) {
        addToast('Search failed', 'error');
    }
    setIsLoading(false);
  };

  const handleRandom = async () => {
      setIsLoading(true);
      const random = await getRandomAnime();
      setIsLoading(false);
      if (random) setAnimeStack([random]);
      else addToast('Failed to get random anime', 'error');
  };

  // --- Library Logic ---

  const updateLibrary = (status: LibraryStatus) => {
    const currentAnime = animeStack[animeStack.length - 1];
    if (!currentAnime) return;
    setLibrary(prev => {
      const existing = prev.find(e => e.id === currentAnime.mal_id);
      if (existing) {
        addToast(`Updated ${currentAnime.title} to ${status}`, 'success');
        return prev.map(e => e.id === currentAnime.mal_id ? { ...e, status } : e);
      } else {
        addToast(`Added ${currentAnime.title} to Library`, 'success');
        return [...prev, {
          id: currentAnime.mal_id,
          anime: currentAnime,
          status,
          progress: 0,
          totalEpisodes: currentAnime.episodes,
          dateAdded: Date.now()
        }];
      }
    });
  };

  const updateProgress = (id: number, newProgress: number) => {
    if (newProgress < 0) return;
    setLibrary(prev => prev.map(entry => {
      if (entry.id === id) {
        if (entry.anime.episodes && newProgress > entry.anime.episodes) return entry;
        return { ...entry, progress: newProgress };
      }
      return entry;
    }));
  };

  const handleImportLibrary = (newEntries: LibraryEntry[]) => {
      setLibrary(prev => {
          const combined = [...prev];
          newEntries.forEach(newItem => {
              if (!combined.find(c => c.id === newItem.id)) combined.push(newItem);
          });
          return combined;
      });
  };

  // --- Download Logic ---

  const addDownload = (url: string, fileName: string) => {
    const newJob: DownloadJob = {
      id: Math.random().toString(36).substr(2, 9),
      fileName,
      url,
      progress: 0,
      status: 'pending',
      timestamp: Date.now(),
      thumbnail: url
    };
    
    setDownloads(prev => [newJob, ...prev]);
    addToast('Download started', 'info');
    
    setTimeout(() => startDownload(newJob.id), 500); 
  };

  const startDownload = (id: string) => {
      setDownloads(prev => prev.map(j => j.id === id ? {...j, status: 'downloading'} : j));
  };

  // Simulated Download Loop
  useEffect(() => {
      const interval = setInterval(() => {
          setDownloads(prev => prev.map(job => {
              if (job.status === 'downloading') {
                  const speed = Math.random() * 3 + 1;
                  const newProgress = Math.min(100, job.progress + speed);
                  
                  if (newProgress >= 100) {
                      // Complete
                      // Trigger actual browser download
                       const a = document.createElement('a');
                       a.href = job.url;
                       a.download = job.fileName;
                       document.body.appendChild(a);
                       a.click();
                       document.body.removeChild(a);
                       
                       return { ...job, progress: 100, status: 'completed' };
                  }
                  return { ...job, progress: newProgress };
              }
              return job;
          }));
      }, 200);
      
      return () => clearInterval(interval);
  }, []);

  // Download Handlers
  const pauseDownload = (id: string) => {
    setDownloads(prev => prev.map(j => j.id === id ? { ...j, status: 'paused' } : j));
  };

  const resumeDownload = (id: string) => {
    setDownloads(prev => prev.map(j => j.id === id ? { ...j, status: 'downloading' } : j));
  };

  const cancelDownload = (id: string) => {
    setDownloads(prev => prev.filter(j => j.id !== id));
  };
  
  const clearHistory = () => {
    setDownloads(prev => prev.filter(j => j.status === 'downloading' || j.status === 'paused' || j.status === 'pending'));
  };

  // --- Sync Logic ---
  
  const handleSync = () => {
    if (!malConfig.username) {
        addToast('Please enter a username', 'error');
        return;
    }
    setIsSyncing(true);
    // Simulate network request
    setTimeout(() => {
      setIsSyncing(false);
      setMalConfig(prev => ({ ...prev, lastSynced: Date.now(), isLoggedIn: true }));
      addToast('Sync complete! Library updated.', 'success');
    }, 2500);
  };

  // --- Toast Logic ---
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const getDisplayList = () => {
    if (homeMode === 'top') return homeData.top;
    if (homeMode === 'season') return homeData.seasonal;
    return homeData.schedule;
  };

  return (
    <div className="min-h-screen bg-black text-white font-roboto">
      <main className="max-w-md mx-auto min-h-screen bg-black pb-20 relative border-x border-gray-900 shadow-2xl overflow-hidden">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center px-4 pt-5 pb-3 bg-black/90 backdrop-blur z-20 sticky top-0">
          <div className="font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient-x">
             MAL Down
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDownloads(true)} className="relative p-2 rounded-full hover:bg-gray-800 transition-colors">
               <ArrowDownTrayIcon className="h-6 w-6 text-gray-300" />
               {downloads.some(d => d.status === 'downloading') && (
                 <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse border border-black" />
               )}
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
               {malConfig.isLoggedIn ? (
                   <img 
                    src={`https://ui-avatars.com/api/?name=${malConfig.username}&background=random`} 
                    className="h-6 w-6 rounded-full ring-1 ring-gray-500" 
                    alt="Profile"
                   />
               ) : (
                   <Cog6ToothIcon className="h-6 w-6 text-gray-300" />
               )}
            </button>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-[#111] w-full max-w-xs rounded-2xl p-6 border border-gray-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Sync Settings</h2>
                    <button onClick={() => setShowSettings(false)}><CheckBadgeIcon className="h-6 w-6 text-gray-500" /></button>
                </div>
                
                <div className="mb-6">
                  <label className="block text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">MyAnimeList Username</label>
                  <div className="relative">
                    <input 
                        type="text" 
                        value={malConfig.username}
                        onChange={(e) => setMalConfig(p => ({...p, username: e.target.value}))}
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                        placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="mb-6 bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-gray-300">Library Sync</span>
                      {malConfig.lastSynced && <span className="text-[10px] text-green-500 bg-green-900/20 px-2 py-0.5 rounded-full">Active</span>}
                   </div>
                   <button 
                     onClick={handleSync}
                     disabled={isSyncing || !malConfig.username}
                     className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-95 ${isSyncing ? 'bg-gray-800 text-gray-500' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/20'}`}
                   >
                     <ArrowPathIcon className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                     {isSyncing ? 'Syncing Library...' : 'Sync Now'}
                   </button>
                   {malConfig.lastSynced && (
                       <p className="text-[10px] text-center text-gray-600 mt-2">Last synced: {new Date(malConfig.lastSynced).toLocaleString()}</p>
                   )}
                </div>

                <button onClick={() => setShowSettings(false)} className="w-full py-3 border border-gray-700 rounded-lg text-gray-400 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors">Close</button>
             </div>
          </div>
        )}

        {/* Downloads Screen */}
        {showDownloads && (
          <div className="fixed inset-0 z-50 bg-black">
             <DownloadManager 
               downloads={downloads}
               onPause={pauseDownload}
               onResume={resumeDownload}
               onCancel={cancelDownload}
               onClearHistory={clearHistory}
               onClose={() => setShowDownloads(false)}
             />
          </div>
        )}

        {view === AppView.HOME && (
          <div className="animate-fade-in">
             {/* Home Toggle */}
             <div className="px-4 pt-2 pb-4 flex gap-2 overflow-x-auto no-scrollbar mask-image-fade-right">
                <button onClick={() => { setHomeMode('top'); setPage(1); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${homeMode === 'top' ? 'bg-white text-black scale-105' : 'bg-[#1e1e1e] text-gray-400 border border-gray-800'}`}>
                    <FireIcon className="h-4 w-4" /> Top Rated
                </button>
                <button onClick={() => { setHomeMode('season'); setPage(1); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${homeMode === 'season' ? 'bg-white text-black scale-105' : 'bg-[#1e1e1e] text-gray-400 border border-gray-800'}`}>
                    <CalendarIcon className="h-4 w-4" /> Seasonal
                </button>
                <button onClick={() => { setHomeMode('schedule'); setPage(1); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${homeMode === 'schedule' ? 'bg-white text-black scale-105' : 'bg-[#1e1e1e] text-gray-400 border border-gray-800'}`}>
                    <ClockIcon className="h-4 w-4" /> Schedule
                </button>
             </div>

             {homeMode === 'schedule' && (
                <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
                  {days.map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wide transition-colors ${selectedDay === day ? 'bg-purple-900 text-purple-100 border border-purple-500 shadow-glow-purple' : 'bg-[#1e1e1e] text-gray-500 border border-transparent'}`}>
                      {day.slice(0,3)}
                    </button>
                  ))}
                </div>
             )}

             <div className="grid grid-cols-3 gap-3 px-3 pb-4">
               {isLoadingHome && page === 1 ? (
                 [1,2,3,4,5,6,7,8,9].map(i => <AnimeCard key={i} isLoading={true} />)
               ) : (
                 getDisplayList().map((anime) => (
                     <AnimeCard key={`${anime.mal_id}-${homeMode}`} anime={anime} onClick={() => setAnimeStack(prev => [...prev, anime])} />
                 ))
               )}
             </div>
             
             {/* Infinite Scroll Loader */}
             {hasMore && homeMode !== 'schedule' && (
               <div ref={observerTarget} className="h-24 flex items-center justify-center">
                  {isFetchingMore && <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
               </div>
             )}
          </div>
        )}

        {view === AppView.SEARCH && (
          <div className="animate-fade-in min-h-screen">
            <SearchBar onSearch={handleSearch} onRandom={handleRandom} isLoading={isLoading} />
            {searchResults.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                    <MagnifyingGlassIcon className="h-16 w-16 text-gray-700 mb-4" />
                    <p className="text-gray-500">Search for your next favorite.</p>
                </div>
            )}
            <div className="grid grid-cols-3 gap-3 px-3 pt-2 pb-8">
               {isLoading ? [1,2,3,4,5,6].map(i => <AnimeCard key={i} isLoading={true} />) : searchResults.map((anime) => (
                 <AnimeCard key={anime.mal_id} anime={anime} onClick={() => setAnimeStack(prev => [...prev, anime])} />
               ))}
            </div>
            {hasMore && searchResults.length > 0 && (
               <div ref={observerTarget} className="h-24 flex items-center justify-center">
                  {isFetchingMore && <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
               </div>
            )}
          </div>
        )}

        {view === AppView.LIBRARY && (
          <LibraryView 
            library={library} 
            onSelectAnime={(a) => setAnimeStack(prev => [...prev, a])} 
            onDeleteEntry={(id) => {
                setLibrary(prev => prev.filter(e => e.id !== id));
                addToast('Removed from library', 'info');
            }}
            onImportLibrary={handleImportLibrary}
            onUpdateProgress={updateProgress}
          />
        )}

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/95 backdrop-blur-lg border-t border-gray-900 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
            <button onClick={() => setView(AppView.HOME)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.HOME ? 'text-blue-500' : 'text-gray-600 hover:text-gray-400'}`}>
              {view === AppView.HOME ? <HomeIconSolid className="h-6 w-6 animate-bounce-small" /> : <HomeIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </button>
            <button onClick={() => setView(AppView.SEARCH)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.SEARCH ? 'text-blue-500' : 'text-gray-600 hover:text-gray-400'}`}>
              {view === AppView.SEARCH ? <MagnifyingGlassIconSolid className="h-6 w-6 animate-bounce-small" /> : <MagnifyingGlassIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Search</span>
            </button>
            <button onClick={() => setView(AppView.LIBRARY)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.LIBRARY ? 'text-blue-500' : 'text-gray-600 hover:text-gray-400'}`}>
              {view === AppView.LIBRARY ? <RectangleStackIconSolid className="h-6 w-6 animate-bounce-small" /> : <RectangleStackIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Library</span>
            </button>
          </div>
        </nav>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

      </main>

      {/* Detail Modal Overlay */}
      {animeStack.length > 0 && (
        <DetailsView 
          anime={animeStack[animeStack.length - 1]} 
          libraryEntry={library.find(e => e.id === animeStack[animeStack.length - 1].mal_id)}
          onClose={() => setAnimeStack(prev => prev.slice(0, -1))} 
          onUpdateLibrary={updateLibrary}
          onSelectAnime={(a) => setAnimeStack(prev => [...prev, a])}
          onDownloadImage={addDownload}
        />
      )}
    </div>
  );
};

export default App;