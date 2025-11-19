import React, { useState, useEffect, useRef } from 'react';
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
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface DetailsViewProps {
  anime: JikanAnime;
  libraryEntry?: LibraryEntry;
  onClose: () => void;
  onUpdateLibrary: (status: LibraryStatus) => void;
  onSelectAnime: (anime: JikanAnime) => void;
  onDownloadImage: (url: string, filename: string) => void; // Added prop
}

export const DetailsView: React.FC<DetailsViewProps> = ({ anime, libraryEntry, onClose, onUpdateLibrary, onSelectAnime, onDownloadImage }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'gallery' | 'chars' | 'recs'>('info');
  const [pictures, setPictures] = useState<string[]>([]);
  const [characters, setCharacters] = useState<JikanCharacter[]>([]);
  const [recommendations, setRecommendations] = useState<JikanRecommendation[]>([]);
  
  const [loadingPics, setLoadingPics] = useState(false);
  const [loadingChars, setLoadingChars] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Swipe Gesture State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // --- Gesture Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop > 0) return;
    setTouchStart(e.targetTouches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStart === null) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTranslateY(diff);
      if (e.cancelable) e.preventDefault(); 
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    if (translateY > 150) {
      onClose();
    } else {
      setTranslateY(0);
    }
    setTouchStart(null);
    setIsDragging(false);
  };

  // --- Data Loading Logic ---
  useEffect(() => {
    if (activeTab === 'gallery' && pictures.length === 0 && !loadingPics) {
      setLoadingPics(true);
      getAnimePictures(anime.mal_id).then(pics => { setPictures(pics); setLoadingPics(false); });
    }
    if (activeTab === 'chars' && characters.length === 0 && !loadingChars) {
      setLoadingChars(true);
      getAnimeCharacters(anime.mal_id).then(chars => { setCharacters(chars); setLoadingChars(false); });
    }
    if (activeTab === 'recs' && recommendations.length === 0 && !loadingRecs) {
      setLoadingRecs(true);
      getAnimeRecommendations(anime.mal_id).then(recs => { setRecommendations(recs); setLoadingRecs(false); });
    }
  }, [activeTab, anime.mal_id]);

  useEffect(() => {
    setActiveTab('info');
    setPictures([]);
    setCharacters([]);
    setRecommendations([]);
    setTranslateY(0);
  }, [anime.mal_id]);

  const handleDownloadClick = () => {
    if (selectedImage) {
        const sanitizedTitle = anime.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        const filename = `${sanitizedTitle}_${Date.now()}.jpg`;
        onDownloadImage(selectedImage, filename);
    }
  };

  const handleRecClick = (rec: JikanRecommendation) => {
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
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex flex-col bg-black gpu-accelerated"
      style={{ 
        transform: `translateY(${translateY}px)`, 
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' 
      }}
    >
      {/* Swipe Handle Area */}
      <div 
        className="absolute top-0 left-0 right-0 h-12 z-20 flex justify-center items-start pt-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-white/30 rounded-full backdrop-blur-sm shadow-sm" />
      </div>

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur flex items-center justify-center p-0 animate-fade-in" onClick={() => setSelectedImage(null)}>
           <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl" alt="Full view" onClick={(e) => e.stopPropagation()} />
           
           <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"><XMarkIcon className="h-8 w-8" /></button>
           
           <div className="absolute bottom-12 flex gap-4 z-10">
              <button onClick={(e) => { e.stopPropagation(); handleDownloadClick(); }} className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform">
                <ArrowDownTrayIcon className="h-5 w-5" /> Download
              </button>
           </div>
        </div>
      )}

      {/* Header Image */}
      <div 
        className="relative h-72 shrink-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img src={anime.images.jpg.large_image_url} alt={anime.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        
        <button onClick={onClose} className="absolute top-6 right-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white z-10 hover:bg-black/50 transition-colors">
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="absolute bottom-0 left-0 p-6 w-full">
            <h1 className="text-2xl font-bold text-white leading-tight mb-2 shadow-black drop-shadow-md line-clamp-2">{anime.title}</h1>
            <div className="flex items-center text-sm text-gray-300 space-x-3 flex-wrap gap-y-2">
                <span className="bg-blue-600 px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm">{anime.type || 'TV'}</span>
                {anime.year && <span className="font-medium">{anime.year}</span>}
                <span className="flex items-center text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded">{anime.score || 'N/A'} <span className="text-[10px] ml-0.5">★</span></span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${anime.status === 'Currently Airing' ? 'bg-green-900/80 text-green-200' : 'bg-gray-800'}`}>{anime.status}</span>
            </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black" ref={contentRef}>
        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-2 overflow-x-auto no-scrollbar shrink-0 bg-black sticky top-0 z-10">
          {[
            { id: 'info', icon: InformationCircleIcon, label: 'Info' },
            { id: 'chars', icon: UserGroupIcon, label: 'Cast' },
            { id: 'recs', icon: SparklesIcon, label: 'Recs' },
            { id: 'gallery', icon: PhotoIcon, label: 'Gallery' },
          ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[80px] pb-3 pt-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.id ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
             >
                <div className="flex flex-col items-center justify-center gap-1">
                    <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} /> {tab.label}
                </div>
             </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24 overscroll-y-contain">
          {activeTab === 'info' && (
            <div className="space-y-6 animate-fade-in">
               {/* Library Actions */}
               <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => onUpdateLibrary(LibraryStatus.WATCHING)}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${libraryEntry?.status === LibraryStatus.WATCHING ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-300 bg-[#1a1a1a] hover:bg-[#222]'}`}
                   >
                       <PlusIcon className="h-5 w-5" /> Watching
                   </button>
                   <button 
                    onClick={() => onUpdateLibrary(LibraryStatus.COMPLETED)}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${libraryEntry?.status === LibraryStatus.COMPLETED ? 'bg-green-600 border-green-600 text-white' : 'border-gray-700 text-gray-300 bg-[#1a1a1a] hover:bg-[#222]'}`}
                   >
                       <CheckCircleIcon className="h-5 w-5" /> Completed
                   </button>
               </div>

               <div>
                   <h3 className="text-lg font-bold text-white mb-2 border-l-4 border-blue-500 pl-3">Synopsis</h3>
                   <p className="text-gray-400 text-sm leading-relaxed">{anime.synopsis || 'No synopsis available.'}</p>
               </div>

               <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
                       <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Studio</div>
                       <div className="text-white font-medium truncate text-blue-400">{anime.studios?.[0]?.name || 'Unknown'}</div>
                   </div>
                   <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
                       <div className="text-gray-500 text-xs mb-1 uppercase tracking-wider font-bold">Episodes</div>
                       <div className="text-white font-medium">{anime.episodes || '?'}</div>
                   </div>
               </div>
            </div>
          )}

          {activeTab === 'chars' && (
            <div className="animate-fade-in">
               {loadingChars ? (
                 <div className="grid grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-[#1e1e1e] rounded-full skeleton" />)}</div>
               ) : (
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {characters.map((char, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center group">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-2 border-2 border-[#222] group-hover:border-blue-500 transition-colors shadow-lg">
                          <img src={char.character.images.jpg.image_url} alt={char.character.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <p className="text-xs text-white font-bold line-clamp-1">{char.character.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{char.role}</p>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'recs' && (
            <div className="animate-fade-in">
               {loadingRecs ? (
                 <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="aspect-video bg-[#1e1e1e] rounded skeleton" />)}</div>
               ) : (
                 <div className="grid grid-cols-2 gap-3">
                    {recommendations.map((rec) => (
                      <div key={rec.entry.mal_id} className="bg-[#111] rounded-lg overflow-hidden border border-gray-800 active:scale-95 transition-transform shadow-md" onClick={() => handleRecClick(rec)}>
                        <div className="aspect-video relative">
                           <img src={rec.entry.images.jpg.large_image_url || rec.entry.images.jpg.image_url} className="w-full h-full object-cover" alt={rec.entry.title} loading="lazy" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                        <div className="p-2 absolute bottom-0 left-0 w-full">
                          <p className="text-xs font-bold text-white line-clamp-1">{rec.entry.title}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="animate-fade-in">
                {loadingPics && <div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[2/3] bg-[#1e1e1e] rounded skeleton" />)}</div>}
                {!loadingPics && (
                  <div className="grid grid-cols-3 gap-2">
                      {pictures.map((pic, idx) => (
                          <div key={idx} className="aspect-[2/3] bg-[#111] rounded-lg overflow-hidden relative group cursor-pointer border border-gray-800 shadow-lg active:opacity-80" onClick={() => setSelectedImage(pic)}>
                              <img src={pic} className="w-full h-full object-cover" loading="lazy" alt={`Gallery ${idx}`} />
                          </div>
                      ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};