import React, { useState, useEffect } from 'react';
import { searchAnime, getTopAnime, getSeasonNow, getRandomAnime } from './services/geminiService';
import { JikanAnime, AppView, LibraryEntry, LibraryStatus } from './types';
import { SearchBar } from './components/SearchBar';
import { AnimeCard } from './components/AnimeCard';
import { LibraryView } from './components/LibraryView';
import { DetailsView } from './components/DetailsView';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  RectangleStackIcon,
  FireIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  RectangleStackIcon as RectangleStackIconSolid
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  
  // Home Data
  const [topAnime, setTopAnime] = useState<JikanAnime[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<JikanAnime[]>([]);
  const [homeMode, setHomeMode] = useState<'top' | 'season'>('top');
  
  const [searchResults, setSearchResults] = useState<JikanAnime[]>([]);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  
  // Stack of selected animes to support drilling down via recommendations
  const [animeStack, setAnimeStack] = useState<JikanAnime[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHome, setIsLoadingHome] = useState(false);

  // Load library and initial data
  useEffect(() => {
    const saved = localStorage.getItem('maldown-library');
    if (saved) setLibrary(JSON.parse(saved));
    
    setIsLoadingHome(true);
    Promise.all([getTopAnime(), getSeasonNow()]).then(([top, season]) => {
        setTopAnime(top);
        setSeasonalAnime(season);
        setIsLoadingHome(false);
    });
  }, []);

  // Save library
  useEffect(() => {
    localStorage.setItem('maldown-library', JSON.stringify(library));
  }, [library]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    const results = await searchAnime(query);
    setSearchResults(results);
    setIsLoading(false);
  };

  const handleRandom = async () => {
      setIsLoading(true);
      const random = await getRandomAnime();
      setIsLoading(false);
      if (random) {
          setAnimeStack([random]);
      }
  };

  const updateLibrary = (status: LibraryStatus) => {
    const currentAnime = animeStack[animeStack.length - 1];
    if (!currentAnime) return;

    setLibrary(prev => {
      const existing = prev.find(e => e.id === currentAnime.mal_id);
      if (existing) {
        return prev.map(e => e.id === currentAnime.mal_id ? { ...e, status } : e);
      } else {
        const newEntry: LibraryEntry = {
          id: currentAnime.mal_id,
          anime: currentAnime,
          status,
          progress: 0,
          dateAdded: Date.now()
        };
        return [...prev, newEntry];
      }
    });
  };

  const handleImportLibrary = (newEntries: LibraryEntry[]) => {
      setLibrary(prev => {
          const combined = [...prev];
          newEntries.forEach(newItem => {
              if (!combined.find(c => c.id === newItem.id)) {
                  combined.push(newItem);
              }
          });
          return combined;
      });
  };

  const deleteFromLibrary = (id: number) => {
    setLibrary(prev => prev.filter(e => e.id !== id));
  };

  const getActiveLibraryEntry = () => {
    const currentAnime = animeStack[animeStack.length - 1];
    return currentAnime ? library.find(e => e.id === currentAnime.mal_id) : undefined;
  };

  // Navigation Handlers
  const pushAnime = (anime: JikanAnime) => {
      setAnimeStack(prev => [...prev, anime]);
  };

  const popAnime = () => {
      setAnimeStack(prev => prev.slice(0, -1));
  };

  const currentAnime = animeStack.length > 0 ? animeStack[animeStack.length - 1] : null;

  return (
    <div className="min-h-screen bg-black text-white font-roboto">
      
      <main className="max-w-md mx-auto min-h-screen bg-black pb-20 relative border-x border-gray-900 shadow-2xl">
        
        {view === AppView.HOME && (
          <div className="animate-fade-in">
             <div className="p-6 pt-8 bg-gradient-to-b from-[#111] to-black">
               <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-1 tracking-tight">MAL Down</h1>
               <p className="text-gray-500 text-sm font-medium">Your ultimate anime collection manager</p>
             </div>
             
             {/* Home Toggle */}
             <div className="px-4 pt-2 pb-4 flex gap-4">
                <button 
                    onClick={() => setHomeMode('top')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${homeMode === 'top' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-[#1e1e1e] text-gray-400'}`}
                >
                    <FireIcon className="h-4 w-4" /> Top Rated
                </button>
                <button 
                    onClick={() => setHomeMode('season')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${homeMode === 'season' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'bg-[#1e1e1e] text-gray-400'}`}
                >
                    <CalendarIcon className="h-4 w-4" /> Seasonal
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4 px-4 pb-8">
               {isLoadingHome ? (
                 <div className="col-span-2 flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 text-sm">Loading charts...</span>
                 </div>
               ) : (
                   (homeMode === 'top' ? topAnime : seasonalAnime).map((anime) => (
                     <AnimeCard 
                       key={anime.mal_id} 
                       anime={anime} 
                       onClick={() => pushAnime(anime)} 
                     />
                   ))
               )}
             </div>
          </div>
        )}

        {view === AppView.SEARCH && (
          <div className="animate-fade-in min-h-screen">
            <SearchBar onSearch={handleSearch} onRandom={handleRandom} isLoading={isLoading} />
            <div className="grid grid-cols-2 gap-4 px-4 pt-2 pb-8">
               {searchResults.map((anime) => (
                 <AnimeCard 
                   key={anime.mal_id} 
                   anime={anime} 
                   onClick={() => pushAnime(anime)} 
                 />
               ))}
               {searchResults.length === 0 && !isLoading && (
                 <div className="col-span-2 flex flex-col items-center justify-center py-32 text-gray-800">
                    <MagnifyingGlassIcon className="h-16 w-16 mb-4 opacity-20" />
                    <p>Search or roll the dice!</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {view === AppView.LIBRARY && (
          <LibraryView 
            library={library} 
            onSelectAnime={pushAnime} 
            onDeleteEntry={deleteFromLibrary}
            onImportLibrary={handleImportLibrary}
          />
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-t border-gray-800 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center h-16">
            <button 
              onClick={() => setView(AppView.HOME)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.HOME ? 'text-blue-500' : 'text-gray-600'}`}
            >
              {view === AppView.HOME ? <HomeIconSolid className="h-6 w-6" /> : <HomeIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </button>
            <button 
              onClick={() => setView(AppView.SEARCH)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.SEARCH ? 'text-blue-500' : 'text-gray-600'}`}
            >
              {view === AppView.SEARCH ? <MagnifyingGlassIconSolid className="h-6 w-6" /> : <MagnifyingGlassIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Search</span>
            </button>
            <button 
              onClick={() => setView(AppView.LIBRARY)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === AppView.LIBRARY ? 'text-blue-500' : 'text-gray-600'}`}
            >
              {view === AppView.LIBRARY ? <RectangleStackIconSolid className="h-6 w-6" /> : <RectangleStackIcon className="h-6 w-6" />}
              <span className="text-[10px] mt-1 font-medium">Library</span>
            </button>
          </div>
        </nav>

      </main>

      {/* Details Modal */}
      {currentAnime && (
        <DetailsView 
          anime={currentAnime} 
          libraryEntry={getActiveLibraryEntry()}
          onClose={popAnime} 
          onUpdateLibrary={updateLibrary}
          onSelectAnime={pushAnime}
        />
      )}
    </div>
  );
};

export default App;