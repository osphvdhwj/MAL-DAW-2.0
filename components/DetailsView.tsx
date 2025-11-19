import React, { useState, useEffect } from 'react';
import { JikanAnime, LibraryEntry, LibraryStatus, JikanCharacter, JikanRecommendation } from '../types';
import { getAnimePictures, getAnimeCharacters, getAnimeRecommendations } from '../services/geminiService';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  PlusIcon,
  PhotoIcon,
  InformationCircleIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface DetailsViewProps {
  anime: JikanAnime;
  libraryEntry?: LibraryEntry;
  onClose: () => void;
  onUpdateLibrary: (status: LibraryStatus) => void;
  onSelectAnime: (anime: JikanAnime) => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({ anime, libraryEntry, onClose, onUpdateLibrary, onSelectAnime }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'gallery' | 'chars' | 'recs'>('info');
  
  // Data states
  const [pictures, setPictures] = useState<string[]>([]);
  const [characters, setCharacters] = useState<JikanCharacter[]>([]);
  const [recommendations, setRecommendations] = useState<JikanRecommendation[]>([]);
  
  // Loading states
  const [loadingPics, setLoadingPics] = useState(false);
  const [loadingChars, setLoadingChars] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Lazy load data when tabs change
  useEffect(() => {
    if (activeTab === 'gallery' && pictures.length === 0 && !loadingPics) {
      setLoadingPics(true);
      getAnimePictures(anime.mal_id).then(pics => {
        setPictures(pics);
        setLoadingPics(false);
      });
    }
    if (activeTab === 'chars' && characters.length === 0 && !loadingChars) {
      setLoadingChars(true);
      getAnimeCharacters(anime.mal_id).then(chars => {
        setCharacters(chars);
        setLoadingChars(false);
      });
    }
    if (activeTab === 'recs' && recommendations.length === 0 && !loadingRecs) {
      setLoadingRecs(true);
      getAnimeRecommendations(anime.mal_id).then(recs => {
        setRecommendations(recs);
        setLoadingRecs(false);
      });
    }
  }, [activeTab, anime.mal_id]);

  // Reset state when anime changes
  useEffect(() => {
    setActiveTab('info');
    setPictures([]);
    setCharacters([]);
    setRecommendations([]);
  }, [anime.mal_id]);

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `mal_down_${anime.mal_id}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      window.open(url, '_blank');
    }
  };

  // Helper to convert recommendation to JikanAnime format for the card click
  const handleRecClick = (rec: JikanRecommendation) => {
    // Construct a minimal anime object to switch views
    // We might not have full data, but we have ID and Title/Image
    const minimalAnime: any = {
        mal_id: rec.entry.mal_id,
        title: rec.entry.title,
        images: rec.entry.images,
        status: 'Loading...',
        type: 'Unknown',
        score: 0
    };
    onSelectAnime(minimalAnime);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-slide-up overflow-hidden">
      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur flex items-center justify-center p-2" onClick={() => setSelectedImage(null)}>
           <img 
                src={selectedImage} 
                className="max-w-full max-h-full object-contain shadow-2xl" 
                alt="Full view" 
                onClick={(e) => e.stopPropagation()}
           />
           <div className="absolute bottom-10 flex gap-4 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(selectedImage); }} 
                className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95 transition-transform"
              >
                <ArrowDownTrayIcon className="h-5 w-5" /> Download
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} 
                className="bg-[#333] text-white px-6 py-3 rounded-full font-bold active:scale-95 transition-transform"
              >
                Close
              </button>
           </div>
        </div>
      )}

      {/* Header Image */}
      <div className="relative h-72 shrink-0">
        <img 
          src={anime.images.jpg.large_image_url} 
          alt={anime.title}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white active:bg-black/50 z-10"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="absolute bottom-0 left-0 p-6 w-full">
            <h1 className="text-2xl font-bold text-white leading-tight mb-2 shadow-black drop-shadow-md line-clamp-2">{anime.title}</h1>
            <div className="flex items-center text-sm text-gray-300 space-x-3 flex-wrap gap-y-2">
                <span className="bg-blue-600 px-2 py-0.5 rounded text-xs font-bold text-white">{anime.type || 'TV'}</span>
                {anime.year && <span>{anime.year}</span>}
                <span className="flex items-center text-yellow-400 font-bold">{anime.score || 'N/A'} <span className="text-[10px] ml-0.5">★</span></span>
                <span className={`px-2 py-0.5 rounded text-xs ${anime.status === 'Currently Airing' ? 'bg-green-900 text-green-200' : 'bg-gray-800'}`}>{anime.status}</span>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black">
        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'info', icon: InformationCircleIcon, label: 'Info' },
            { id: 'chars', icon: UserGroupIcon, label: 'Cast' },
            { id: 'recs', icon: SparklesIcon, label: 'Recs' },
            { id: 'gallery', icon: PhotoIcon, label: 'Gallery' },
          ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[80px] pb-3 pt-2 text-xs font-medium uppercase tracking-wider border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'}`}
             >
                <div className="flex flex-col items-center justify-center gap-1">
                    <tab.icon className="h-5 w-5" /> {tab.label}
                </div>
             </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          {activeTab === 'info' && (
            <div className="space-y-6 animate-fade-in">
               {/* Library Actions */}
               <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => onUpdateLibrary(LibraryStatus.WATCHING)}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-colors active:scale-95 ${libraryEntry?.status === LibraryStatus.WATCHING ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'border-gray-700 text-gray-300 bg-[#111]'}`}
                   >
                       <PlusIcon className="h-5 w-5" /> Watching
                   </button>
                   <button 
                    onClick={() => onUpdateLibrary(LibraryStatus.COMPLETED)}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-colors active:scale-95 ${libraryEntry?.status === LibraryStatus.COMPLETED ? 'bg-green-600 border-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'border-gray-700 text-gray-300 bg-[#111]'}`}
                   >
                       <CheckCircleIcon className="h-5 w-5" /> Completed
                   </button>
               </div>

               <div>
                   <h3 className="text-lg font-bold text-white mb-2">Synopsis</h3>
                   <p className="text-gray-400 text-sm leading-relaxed">{anime.synopsis || 'No synopsis available.'}</p>
               </div>

               <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="bg-[#111] p-3 rounded border border-gray-800">
                       <div className="text-gray-500 text-xs mb-1">Studio</div>
                       <div className="text-white font-medium truncate">{anime.studios?.[0]?.name || 'Unknown'}</div>
                   </div>
                   <div className="bg-[#111] p-3 rounded border border-gray-800">
                       <div className="text-gray-500 text-xs mb-1">Episodes</div>
                       <div className="text-white font-medium">{anime.episodes || '?'}</div>
                   </div>
                   <div className="bg-[#111] p-3 rounded border border-gray-800">
                       <div className="text-gray-500 text-xs mb-1">Rank</div>
                       <div className="text-white font-medium">#{anime.rank || 'N/A'}</div>
                   </div>
                   <div className="bg-[#111] p-3 rounded border border-gray-800">
                       <div className="text-gray-500 text-xs mb-1">Popularity</div>
                       <div className="text-white font-medium">#{anime.popularity || 'N/A'}</div>
                   </div>
               </div>
               
               {/* Genres */}
               <div>
                 <h3 className="text-sm text-gray-500 mb-2">Genres</h3>
                 <div className="flex flex-wrap gap-2">
                   {anime.genres?.map(g => (
                     <span key={g.name} className="px-2 py-1 bg-[#222] rounded text-xs text-gray-300 border border-gray-800">{g.name}</span>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'chars' && (
            <div className="animate-fade-in">
               {loadingChars ? (
                 <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>
               ) : (
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {characters.map((char, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-2 border-2 border-[#222]">
                          <img src={char.character.images.jpg.image_url} alt={char.character.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <p className="text-xs text-white font-medium line-clamp-2 leading-tight">{char.character.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{char.role}</p>
                      </div>
                    ))}
                    {characters.length === 0 && <p className="col-span-full text-center text-gray-500">No character info.</p>}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'recs' && (
            <div className="animate-fade-in">
               {loadingRecs ? (
                 <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>
               ) : (
                 <div className="grid grid-cols-2 gap-3">
                    {recommendations.map((rec) => (
                      <div 
                        key={rec.entry.mal_id} 
                        className="bg-[#111] rounded-lg overflow-hidden border border-gray-800 active:scale-95 transition-transform"
                        onClick={() => handleRecClick(rec)}
                      >
                        <div className="aspect-video relative">
                           <img src={rec.entry.images.jpg.large_image_url || rec.entry.images.jpg.image_url} className="w-full h-full object-cover" alt={rec.entry.title} loading="lazy" />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-200 line-clamp-2">{rec.entry.title}</p>
                        </div>
                      </div>
                    ))}
                    {recommendations.length === 0 && <p className="col-span-full text-center text-gray-500">No recommendations found.</p>}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="animate-fade-in">
                <div className="mb-4 text-sm text-gray-400 flex justify-between items-center">
                    <span>{pictures.length} Images available</span>
                    {loadingPics && <span className="text-blue-400 animate-pulse">Syncing...</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {pictures.map((pic, idx) => (
                        <div 
                            key={idx} 
                            className="aspect-[2/3] bg-[#111] rounded-lg overflow-hidden relative group cursor-pointer border border-gray-800" 
                            onClick={() => setSelectedImage(pic)}
                        >
                            <img src={pic} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" alt={`Gallery ${idx}`} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                    ))}
                    {!loadingPics && pictures.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-600 bg-[#111] rounded-xl border border-dashed border-gray-800">
                            No extra images found.
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};