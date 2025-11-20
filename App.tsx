import React, { useState, useEffect, useRef } from 'react';
import { searchAnime, getTopAnime, getSeasonNow, getRandomAnime, getSchedule, getUserLibrary, prefetchAnimeData } from './services/geminiService';
import { JikanAnime, AppView, LibraryEntry, LibraryStatus, DownloadJob, MalSyncConfig, ToastNotification, AppSettings, AppTheme, OfflineProgress } from './types';
import { SearchBar } from './components/SearchBar';
import { AnimeCard } from './components/AnimeCard';
import { LibraryView } from './components/LibraryView';
import { DetailsView } from './components/DetailsView';
import { DownloadManager } from './components/DownloadManager';
import { ProfileView } from './components/ProfileView';
import { ToastContainer } from './components/Toast';
import { EditEntryModal } from './components/EditEntryModal';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  RectangleStackIcon,
  FireIcon,
  CalendarIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  UserCircleIcon as UserCircleIconSolid
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
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // --- App Settings State ---
  const [settings, setSettings] = useState<AppSettings>({
      theme: 'blue',
      hapticsEnabled: true,
      dataSaver: false,
      showAdult: false
  });

  // --- Download Manager State ---
  const [downloads, setDownloads] = useState<DownloadJob[]>([]);
  const [showDownloads, setShowDownloads] = useState(false);
  
  // --- Offline Manager State ---
  const [offlineProgress, setOfflineProgress] = useState<OfflineProgress>({ active: false, current: 0, total: 0, currentItemName: '' });

  // --- Settings/Sync State ---
  const [malConfig, setMalConfig] = useState<MalSyncConfig>({ username: '', lastSynced: null, autoSync: false, isLoggedIn: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

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

    const savedSettings = localStorage.getItem('maldown-settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  // Save Persistent Data
  useEffect(() => { localStorage.setItem('maldown-library', JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem('maldown-downloads', JSON.stringify(downloads)); }, [downloads]);
  useEffect(() => { localStorage.setItem('maldown-sync-config', JSON.stringify(malConfig)); }, [malConfig]);
  useEffect(() => { localStorage.setItem('maldown-settings', JSON.stringify(settings)); }, [settings]);

  // PWA Install & Offline Logic
  useEffect(() => {
      window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          setInstallPrompt(e);
          console.log('Install prompt captured');
      });
      
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  const handleInstall = () => {
      if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.then((choiceResult: any) => {
              if (choiceResult.outcome === 'accepted') setInstallPrompt(null);
          });
      }
  };

  // Helper for Haptics
  const triggerHaptic = () => {
      if (settings.hapticsEnabled && navigator.vibrate) navigator.vibrate(15);
  };

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
          addToast(isOffline ? 'Offline Mode Active' : 'Failed to load data', isOffline ? 'info' : 'error');
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
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoadingHome && view !== AppView.LIBRARY && view !== AppView.PROFILE && view !== AppView.DOWNLOADS) {
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
      triggerHaptic();
      const random = await getRandomAnime();
      setIsLoading(false);
      if (random) setAnimeStack([random]);
      else addToast('Failed to get random anime', 'error');
  };

  // --- Library Logic ---

  const handleSaveEntry = (newEntry: LibraryEntry) => {
    setLibrary(prev => {
      const exists = prev.find(e => e.id === newEntry.id);
      if (exists) {
        addToast(`Updated ${newEntry.anime.title}`, 'success');
        return prev.map(e => e.id === newEntry.id ? newEntry : e);
      } else {
        addToast(`Added ${newEntry.anime.title}`, 'success');
        return [...prev, newEntry];
      }
    });
  };

  const updateProgress = (id: number, newProgress: number) => {
    if (newProgress < 0) return;
    triggerHaptic();
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

  // --- Sync Logic (Real) ---

  const performSync = async (isBackground: boolean = false) => {
      if(!malConfig.username) return;
      if (!isBackground) setIsSyncing(true);
      
      try {
          const realMalData = await getUserLibrary(malConfig.username);
          if(realMalData.length === 0) {
              if (!isBackground) addToast('No public list found or list empty', 'error');
          } else {
              handleImportLibrary(realMalData);
              setMalConfig(prev => ({...prev, lastSynced: Date.now(), isLoggedIn: true}));
              if (!isBackground) addToast(`Synced ${realMalData.length} items from MAL`, 'success');
          }
      } catch (e) {
          if (!isBackground) addToast('Sync failed. Check username or internet.', 'error');
      } finally {
          if (!isBackground) setIsSyncing(false);
      }
  };

  // Auto Sync Logic
  useEffect(() => {
    if (!isOffline && malConfig.autoSync && malConfig.username && malConfig.isLoggedIn) {
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();
        const last = malConfig.lastSynced || 0;
        
        if (now - last > ONE_HOUR) {
            performSync(true);
        }
    }
  }, [isOffline, malConfig.autoSync, malConfig.username, malConfig.lastSynced, malConfig.isLoggedIn]);

  // --- Offline Library Download Logic ---
  
  const handleDownloadLibrary = async () => {
      if (library.length === 0) return;
      
      setOfflineProgress({ active: true, current: 0, total: library.length, currentItemName: 'Starting...' });
      
      for (let i = 0; i < library.length; i++) {
          const entry = library[i];
          setOfflineProgress({ 
              active: true, 
              current: i + 1, 
              total: library.length, 
              currentItemName: entry.anime.title 
          });
          
          // Prefetch all data for this entry
          await prefetchAnimeData(entry.id);
          
          // Small delay to be nice to API/CPU
          await new Promise(r => setTimeout(r, 200));
      }
      
      setOfflineProgress({ active: false, current: 0, total: 0, currentItemName: '' });
      addToast('Library available offline!', 'success');
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

  useEffect(() => {
      const interval = setInterval(() => {
          setDownloads(prev => prev.map(job => {
              if (job.status === 'downloading') {
                  const speed = Math.random() * 3 + 1;
                  const newProgress = Math.min(100, job.progress + speed);
                  
                  if (newProgress >= 100) {
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

  const pauseDownload = (id: string) => setDownloads(prev => prev.map(j => j.id === id ? { ...j, status: 'paused' } : j));
  const resumeDownload = (id: string) => setDownloads(prev => prev.map(j => j.id === id ? { ...j, status: 'downloading' } : j));
  const cancelDownload = (id: string) => setDownloads(prev => prev.filter(j => j.id !== id));
  const clearHistory = () => setDownloads(prev => prev.filter(j => j.status === 'downloading' || j.status === 'paused' || j.status === 'pending'));

  // --- Toast Logic ---
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const getDisplayList = () => {
    if (homeMode === 'top') return homeData.top;
    if (homeMode === 'season') return homeData.seasonal;
    return homeData.schedule;
  };

  return (
    <div className={`min-h-screen bg-black text-white font-roboto theme-${settings.theme}`}>
      <main className="max-w-md mx-auto min-h-screen bg-black pb-20 relative border-x border-gray-900 shadow-2xl overflow-hidden">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center px-4 pt-5 pb-3 bg-black/90 backdrop-blur z-20 sticky top-0">
          <div className="flex flex-col">
            <div className="font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                MAL Down
            </div>
            {isOffline && (
                <span className="text-[10px] text-red-400 flex items-center gap-1"><SignalSlashIcon className="h-3 w-3" /> Offline Mode</span>
            )}
          </div>
          <div className="flex gap-2">
            {installPrompt && (
                <button 
                    onClick={handleInstall} 
                    className={`flex items-center gap-1 px-4 py-1.5 rounded-full bg-${settings.theme}-600 text-white text-xs font-bold shadow-lg animate-bounce-small hover:bg-${settings.theme}-500 transition-colors`}
                    aria-label="Install App"
                >
                    <DevicePhoneMobileIcon className="h-4 w-4" /> Install App
                </button>
            )}
            <button onClick={() => setShowDownloads(true)} className="relative p-2 rounded-full hover:bg-gray-800 transition-colors">
               <ArrowDownTrayIcon className="h-6 w-6 text-gray-300" />
               {downloads.some(d => d.status === 'downloading') && (
                 <span className={`absolute top-2 right-2 h-2.5 w-2.5 bg-${settings.theme}-500 rounded-full animate-pulse border border-black`} />
               )}
            </button>
          </div>
        </div>

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

        {/* Edit Entry Modal */}
        {showEditModal && animeStack.length > 0 && (
          <EditEntryModal 
            anime={animeStack[animeStack.length - 1]}
            existingEntry={library.find(e => e.id === animeStack[animeStack.length - 1].mal_id)}
            theme={settings.theme}
            onSave={handleSaveEntry}
            onClose={() => setShowEditModal(false)}
          />
        )}

        {view === AppView.HOME && (
          <div className="animate-fade-in">
             {/* Home Toggle */}
             <div className="px-4 pt-2 pb-4 flex gap-2 overflow-x-auto no-scrollbar mask-image-fade-right">
                <button onClick={() => { triggerHaptic(); setHomeMode('top'); setPage(1); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${homeMode === 'top' ? 'bg-white text-black scale-105' : 'bg-[#1e1e1e] text-gray-400 border border-gray-800'}`}>
                    <FireIcon className="h-4 w-4" /> Top Rated
                </button>
                <button onClick={() => { triggerHaptic(); setHomeMode('season'); setPage(1); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${homeMode === 'season' ? 'bg-white text-black scale-105' : 'bg-[#1e1e1e] text-gray-400 border border-gray-800'}`}>
                    <CalendarIcon className="h-4 w-4" /> Seasonal
                </button>
                <button onClick={() => { triggerHaptic(); setHomeMode('schedule'); setPage(1); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${homeMode === 'schedule' ? 'bg-white text-black scale-105' : 'bg-[#1e1e1e] text-gray-400 border border-gray-800'}`}>
                    <ClockIcon className="h-4 w-4" /> Schedule
                </button>
             </div>

             {homeMode === 'schedule' && (
                <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
                  {days.map(day => (
                    <button key={day} onClick={() => { triggerHaptic(); setSelectedDay(day); }} className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wide transition-colors ${selectedDay === day ? `bg-${settings.theme}-900 text-${settings.theme}-100 border border-${settings.theme}-500` : 'bg-[#1e1e1e] text-gray-500 border border-transparent'}`}>
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
                     <AnimeCard key={`${anime.mal_id}-${homeMode}`} anime={anime} onClick={() => { triggerHaptic(); setAnimeStack(prev => [...prev, anime]); }} />
                 ))
               )}
             </div>
             
             {/* Infinite Scroll Loader */}
             {hasMore && homeMode !== 'schedule' && (
               <div ref={observerTarget} className="h-24 flex items-center justify-center">
                  {isFetchingMore && <div className={`w-6 h-6 border-2 border-${settings.theme}-500 border-t-transparent rounded-full animate-spin`}></div>}
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
                 <AnimeCard key={anime.mal_id} anime={anime} onClick={() => { triggerHaptic(); setAnimeStack(prev => [...prev, anime]); }} />
               ))}
            </div>
            {hasMore && searchResults.length > 0 && (
               <div ref={observerTarget} className="h-24 flex items-center justify-center">
                  {isFetchingMore && <div className={`w-6 h-6 border-2 border-${settings.theme}-500 border-t-transparent rounded-full animate-spin`}></div>}
               </div>
            )}
          </div>
        )}

        {view === AppView.LIBRARY && (
          <LibraryView 
            library={library} 
            onSelectAnime={(a) => { triggerHaptic(); setAnimeStack(prev => [...prev, a]); }} 
            onDeleteEntry={(id) => {
                setLibrary(prev => prev.filter(e => e.id !== id));
                addToast('Removed from library', 'info');
            }}
            onImportLibrary={handleImportLibrary}
            onUpdateProgress={updateProgress}
          />
        )}

        {view === AppView.PROFILE && (
            <ProfileView 
                library={library}
                settings={settings}
                syncConfig={malConfig}
                offlineProgress={offlineProgress}
                onUpdateSettings={setSettings}
                onUpdateSyncConfig={setMalConfig}
                onSyncNow={() => performSync(false)}
                onDownloadLibrary={handleDownloadLibrary}
                onClearCache={() => {
                     localStorage.removeItem('maldown-library');
                     localStorage.removeItem('maldown-downloads');
                     window.location.reload();
                 }}
                isSyncing={isSyncing}
            />
        )}

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/95 backdrop-blur-lg border-t border-gray-900 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
            <button onClick={() => { triggerHaptic(); setView(AppView.HOME); }} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.HOME ? `text-${settings.theme}-500` : 'text-gray-600 hover:text-gray-400'}`}>
              {view === AppView.HOME ? <HomeIconSolid className="h-6 w-6 animate-bounce-small" /> : <HomeIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </button>
            <button onClick={() => { triggerHaptic(); setView(AppView.SEARCH); }} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.SEARCH ? `text-${settings.theme}-500` : 'text-gray-600 hover:text-gray-400'}`}>
              {view === AppView.SEARCH ? <MagnifyingGlassIconSolid className="h-6 w-6 animate-bounce-small" /> : <MagnifyingGlassIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Search</span>
            </button>
            <button onClick={() => { triggerHaptic(); setView(AppView.LIBRARY); }} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.LIBRARY ? `text-${settings.theme}-500` : 'text-gray-600 hover:text-gray-400'}`}>
              {view === AppView.LIBRARY ? <RectangleStackIconSolid className="h-6 w-6 animate-bounce-small" /> : <RectangleStackIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Library</span>
            </button>
            <button onClick={() => { triggerHaptic(); setView(AppView.PROFILE); }} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.PROFILE ? `text-${settings.theme}-500` : 'text-gray-600 hover:text-gray-400'}`}>
              {view === AppView.PROFILE ? <UserCircleIconSolid className="h-6 w-6 animate-bounce-small" /> : <UserCircleIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Profile</span>
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
          theme={settings.theme}
          hapticsEnabled={settings.hapticsEnabled}
          onClose={() => setAnimeStack(prev => prev.slice(0, -1))} 
          onEditEntry={() => setShowEditModal(true)}
          onSelectAnime={(a) => setAnimeStack(prev => [...prev, a])}
          onDownloadImage={addDownload}
        />
      )}
    </div>
  );
};

export default App;