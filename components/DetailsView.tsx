import React, { useState, useEffect, useRef } from 'react';
import { JikanAnime, LibraryEntry, LibraryStatus, JikanCharacter, JikanRecommendation, JikanAnimeFull, AppTheme, JikanReview, JikanStats } from '../types';
import { getAnimePictures, getAnimeCharacters, getAnimeRecommendations, getAnimeFullById, getAnimeReviews, getAnimeStatistics } from '../services/geminiService';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  PlusIcon,
  PhotoIcon,
  InformationCircleIcon,
  UserGroupIcon,
  SparklesIcon,
  PlayCircleIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
  TvIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  LinkIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  Square2StackIcon
} from '@heroicons/react/24/outline';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';

interface DetailsViewProps {
  anime: JikanAnime;
  libraryEntry?: LibraryEntry;
  theme: AppTheme;
  hapticsEnabled: boolean;
  onClose: () => void;
  onEditEntry: () => void;
  onSelectAnime: (anime: JikanAnime) => void;
  onDownloadImage: (url: string, filename: string) => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({ 
  anime, 
  libraryEntry, 
  theme,
  hapticsEnabled,
  onClose, 
  onEditEntry, 
  onSelectAnime, 
  onDownloadImage 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'gallery' | 'chars' | 'recs' | 'media' | 'reviews' | 'stats'>('info');
  const [fullDetails, setFullDetails] = useState<JikanAnimeFull | null>(null);
  const [pictures, setPictures] = useState<string[]>([]);
  const [characters, setCharacters] = useState<JikanCharacter[]>([]);
  const [recommendations, setRecommendations] = useState<JikanRecommendation[]>([]);
  const [reviews, setReviews] = useState<JikanReview[]>([]);
  const [stats, setStats] = useState<JikanStats | null>(null);
  
  const [loadingPics, setLoadingPics] = useState(false);
  const [loadingChars, setLoadingChars] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Swipe Gesture State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const getThemeColor = (t: string) => {
      const colors: Record<string, string> = {
          blue: 'text-blue-500 border-blue-500',
          purple: 'text-purple-500 border-purple-500',
          red: 'text-red-500 border-red-500',
          orange: 'text-orange-500 border-orange-500',
          green: 'text-green-500 border-green-500',
          pink: 'text-pink-500 border-pink-500'
      };
      return colors[t] || colors.blue;
  };
  
  const getThemeBg = (t: string) => {
      const colors: Record<string, string> = {
          blue: 'bg-blue-600 border-blue-600',
          purple: 'bg-purple-600 border-purple-600',
          red: 'bg-red-600 border-red-600',
          orange: 'bg-orange-600 border-orange-600',
          green: 'bg-green-600 border-green-600',
          pink: 'bg-pink-600 border-pink-600'
      };
      return colors[t] || colors.blue;
  };

  const triggerHaptic = () => {
      if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
  };

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
    getAnimeFullById(anime.mal_id).then(data => setFullDetails(data));

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
    if (activeTab === 'reviews' && reviews.length === 0 && !loadingReviews) {
      setLoadingReviews(true);
      getAnimeReviews(anime.mal_id).then(r => { setReviews(r); setLoadingReviews(false); });
    }
    if (activeTab === 'stats' && !stats && !loadingStats) {
      setLoadingStats(true);
      getAnimeStatistics(anime.mal_id).then(s => { setStats(s); setLoadingStats(false); });
    }
  }, [activeTab, anime.mal_id]);

  useEffect(() => {
      if (!anime.broadcast?.string || anime.status !== 'Currently Airing') return;
      const broadcastDay = anime.broadcast?.day;
      const broadcastTime = anime.broadcast?.time;
      if(broadcastDay && broadcastTime) {
         setTimeLeft(`Airs ${broadcastDay}s at ${broadcastTime}`);
      }
  }, [anime]);

  useEffect(() => {
    setActiveTab('info');
    setPictures([]);
    setCharacters([]);
    setRecommendations([]);
    setReviews([]);
    setStats(null);
    setFullDetails(null);
    setTranslateY(0);
  }, [anime.mal_id]);

  const handleDownloadClick = () => {
    triggerHaptic();
    if (selectedImage) {
        const sanitizedTitle = anime.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        const filename = `${sanitizedTitle}_${Date.now()}.jpg`;
        onDownloadImage(selectedImage, filename);
    }
  };

  const handleDownloadAll = () => {
      if (pictures.length === 0) return;
      triggerHaptic();
      const sanitizedTitle = anime.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
      pictures.forEach((pic, index) => {
          onDownloadImage(pic, `${sanitizedTitle}_${index + 1}.jpg`);
      });
      alert(`Started ${pictures.length} downloads.`);
  };

  const handleRecClick = (rec: JikanRecommendation) => {
    triggerHaptic();
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

  const handleRelationClick = (mal_id: number, title: string) => {
     triggerHaptic();
     const minimalAnime: any = {
        mal_id: mal_id,
        title: title,
        images: { jpg: { large_image_url: '', image_url: '' } }, // Placeholder
        status: 'Loading...',
        type: 'Unknown',
        score: 0
    };
    onSelectAnime(minimalAnime);
  }

  const handleShare = () => {
      if (navigator.share) {
          navigator.share({
              title: anime.title,
              text: `Check out ${anime.title} on MAL Down!`,
              url: anime.url
          });
      } else {
          navigator.clipboard.writeText(anime.url);
          alert('Link copied to clipboard');
      }
      setShowMoreMenu(false);
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
        className="relative h-80 shrink-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img src={anime.images.jpg.large_image_url} alt={anime.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        
        <button onClick={() => { triggerHaptic(); onClose(); }} className="absolute top-6 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white z-10 hover:bg-black/50 transition-colors">
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* More Options Button */}
        <div className="absolute top-6 right-4 z-10 relative">
             <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors">
                 <EllipsisVerticalIcon className="h-6 w-6" />
             </button>
             {showMoreMenu && (
                 <div className="absolute right-0 mt-2 w-48 bg-[#222] rounded-xl shadow-xl border border-gray-800 overflow-hidden animate-fade-in-up origin-top-right">
                     <button onClick={handleShare} className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#333] flex items-center gap-2">
                         <ShareIcon className="h-4 w-4" /> Share
                     </button>
                     <a href={anime.url} target="_blank" rel="noreferrer" className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#333] flex items-center gap-2 block">
                         <LinkIcon className="h-4 w-4" /> Open in MAL
                     </a>
                 </div>
             )}
        </div>

        <div className="absolute bottom-0 left-0 p-6 w-full">
            <h1 className="text-2xl font-bold text-white leading-tight mb-2 shadow-black drop-shadow-md line-clamp-2">{anime.title}</h1>
            <div className="flex items-center text-sm text-gray-300 space-x-3 flex-wrap gap-y-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm ${getThemeBg(theme)}`}>{anime.type || 'TV'}</span>
                {anime.year && <span className="font-medium">{anime.year}</span>}
                <span className="flex items-center text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded">{anime.score || 'N/A'} <span className="text-[10px] ml-0.5">★</span></span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${anime.status === 'Currently Airing' ? 'bg-green-900/80 text-green-200' : 'bg-gray-800'}`}>{anime.status}</span>
            </div>
            {timeLeft && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-blue-300 bg-blue-900/20 px-3 py-1 rounded-full w-fit border border-blue-500/30">
                    <ClockIcon className="h-3 w-3" /> {timeLeft}
                </div>
            )}
        </div>
      </div>

      {/* Edit FAB */}
      <button 
         onClick={onEditEntry}
         className={`absolute right-6 top-72 z-30 p-4 rounded-full shadow-xl active:scale-95 transition-transform flex items-center justify-center ${getThemeBg(theme)} text-white`}
      >
         {libraryEntry ? <PencilIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
      </button>

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black" ref={contentRef}>
        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-2 overflow-x-auto no-scrollbar shrink-0 bg-black sticky top-0 z-10">
          {[
            { id: 'info', icon: InformationCircleIcon, label: 'Info' },
            { id: 'media', icon: PlayCircleIcon, label: 'Media' },
            { id: 'chars', icon: UserGroupIcon, label: 'Cast' },
            { id: 'recs', icon: SparklesIcon, label: 'Recs' },
            { id: 'reviews', icon: ChatBubbleLeftRightIcon, label: 'Reviews' },
            { id: 'stats', icon: ChartBarIcon, label: 'Stats' },
            { id: 'gallery', icon: PhotoIcon, label: 'Gallery' },
          ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => { triggerHaptic(); setActiveTab(tab.id as any); }}
                className={`flex-1 min-w-[70px] pb-3 pt-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.id ? getThemeColor(theme) : 'border-transparent text-gray-500 hover:text-gray-300'}`}
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
               
               {/* Your List Status Card */}
               {libraryEntry && (
                   <div className={`bg-[#1a1a1a] border rounded-xl p-4 shadow-lg flex justify-between items-center ${libraryEntry.status === LibraryStatus.WATCHING ? `border-${theme}-500/30` : 'border-gray-800'}`}>
                      <div>
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Your Status</p>
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${libraryEntry.status === LibraryStatus.WATCHING ? `bg-${theme}-500` : 'bg-gray-500'}`} />
                             <span className="text-white font-medium">{libraryEntry.status}</span>
                             <span className="text-gray-600 mx-1">|</span>
                             <span className="text-blue-400 font-mono">{libraryEntry.progress}/{anime.episodes || '?'}</span>
                          </div>
                      </div>
                      <div className="text-right">
                           <p className="text-xs text-gray-500 uppercase font-bold mb-1">Your Score</p>
                           <div className="flex items-center gap-1 justify-end text-yellow-400 font-bold text-lg">
                               <StarIcon className="h-5 w-5" /> {libraryEntry.score > 0 ? libraryEntry.score : '-'}
                           </div>
                      </div>
                   </div>
               )}

               {!libraryEntry && (
                   <div className="bg-[#1a1a1a] border border-gray-800 border-dashed rounded-xl p-6 text-center">
                       <p className="text-gray-500 text-sm">Not in your library yet.</p>
                       <p className="text-gray-600 text-xs mt-1">Tap the + button to add details.</p>
                   </div>
               )}

               <div>
                   <h3 className={`text-lg font-bold text-white mb-2 border-l-4 pl-3 ${getThemeColor(theme).split(' ')[1]}`}>Synopsis</h3>
                   <p className="text-gray-400 text-sm leading-relaxed">{anime.synopsis || 'No synopsis available.'}</p>
               </div>

               {fullDetails?.relations && fullDetails.relations.length > 0 && (
                 <div>
                   <h3 className="text-sm font-bold text-white mb-3">Related Anime</h3>
                   <div className="space-y-2">
                     {fullDetails.relations.map((rel, i) => (
                       <div key={i} className="bg-[#111] border border-gray-800 rounded-lg p-3">
                         <p className="text-xs text-gray-500 uppercase font-bold mb-1">{rel.relation}</p>
                         <div className="flex flex-wrap gap-2">
                           {rel.entry.map(e => (
                             <button key={e.mal_id} onClick={() => handleRelationClick(e.mal_id, e.name)} className="text-sm text-blue-400 hover:underline text-left">
                               {e.name}
                             </button>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {fullDetails?.external && fullDetails.external.length > 0 && (
                  <div>
                     <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><GlobeAltIcon className="h-4 w-4" /> Links</h3>
                     <div className="flex flex-wrap gap-2">
                        {fullDetails.external.map(link => (
                            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-[#1a1a1a] border border-gray-700 rounded-full text-xs text-blue-400 hover:bg-[#222]">
                                {link.name}
                            </a>
                        ))}
                     </div>
                  </div>
               )}

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

          {activeTab === 'media' && (
              <div className="space-y-6 animate-fade-in">
                  {fullDetails?.streaming && fullDetails.streaming.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><TvIcon className="h-4 w-4" /> Streaming</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {fullDetails.streaming.slice(0, 4).map(s => (
                                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] rounded border border-gray-800 text-xs text-gray-300 hover:border-blue-500">
                                    {s.name} <PlayIcon className="h-3 w-3 text-gray-500" />
                                </a>
                            ))}
                        </div>
                    </div>
                  )}

                  {anime.trailer?.embed_url ? (
                      <div className="rounded-xl overflow-hidden border border-gray-800 bg-black">
                          <iframe 
                            src={anime.trailer.embed_url} 
                            title="Trailer" 
                            className="w-full aspect-video" 
                            allowFullScreen 
                          />
                          <div className="p-3 bg-[#1a1a1a]">
                              <p className="text-xs font-bold text-white">Official Trailer</p>
                          </div>
                      </div>
                  ) : (
                      <div className="p-4 border border-gray-800 rounded-xl text-center text-gray-500 text-sm">No Trailer Available</div>
                  )}

                  {fullDetails?.theme && (
                      <div className="space-y-4">
                          {fullDetails.theme.openings.length > 0 && (
                              <div>
                                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2"><MusicalNoteIcon className="h-3 w-3" /> Openings</h3>
                                  <ul className="space-y-1">
                                      {fullDetails.theme.openings.map((op, i) => (
                                          <li key={i} className="text-xs text-gray-400 truncate py-1 border-b border-gray-900">{op}</li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                           {fullDetails.theme.endings.length > 0 && (
                              <div>
                                  <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2 flex items-center gap-2"><MusicalNoteIcon className="h-3 w-3" /> Endings</h3>
                                  <ul className="space-y-1">
                                      {fullDetails.theme.endings.map((ed, i) => (
                                          <li key={i} className="text-xs text-gray-400 truncate py-1 border-b border-gray-900">{ed}</li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </div>
                  )}
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
                        <div className={`w-20 h-20 rounded-full overflow-hidden mb-2 border-2 border-[#222] hover:border-current transition-colors shadow-lg ${getThemeColor(theme).split(' ')[0]}`}>
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
          
          {activeTab === 'reviews' && (
            <div className="animate-fade-in space-y-4">
               {loadingReviews ? (
                   [1,2,3].map(i => <div key={i} className="h-32 bg-[#1e1e1e] rounded skeleton"/>)
               ) : reviews.length === 0 ? (
                   <p className="text-center text-gray-500">No reviews available.</p>
               ) : (
                   reviews.slice(0, 5).map((review, idx) => (
                       <div key={idx} className="bg-[#111] p-4 rounded-xl border border-gray-800">
                           <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                                       <img src={review.user.images.jpg.image_url} className="w-full h-full" alt="User"/>
                                   </div>
                                   <div>
                                       <p className="text-xs font-bold text-white">{review.user.username}</p>
                                       <p className="text-[10px] text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded">
                                   <StarIcon className="h-3 w-3" /> {review.score}
                               </div>
                           </div>
                           <p className="text-xs text-gray-300 leading-relaxed line-clamp-6">{review.review}</p>
                       </div>
                   ))
               )}
            </div>
          )}

          {activeTab === 'stats' && (
              <div className="animate-fade-in">
                 {loadingStats ? (
                     <div className="h-48 bg-[#1e1e1e] rounded skeleton" />
                 ) : !stats ? (
                     <p className="text-center text-gray-500">No stats available.</p>
                 ) : (
                     <div className="space-y-6">
                         {/* Summary */}
                         <div className="grid grid-cols-2 gap-3">
                             <div className="bg-[#111] p-3 rounded border border-gray-800 text-center">
                                 <p className="text-xs text-gray-500 uppercase">Watching</p>
                                 <p className="text-lg font-bold text-blue-400">{stats.watching.toLocaleString()}</p>
                             </div>
                             <div className="bg-[#111] p-3 rounded border border-gray-800 text-center">
                                 <p className="text-xs text-gray-500 uppercase">Completed</p>
                                 <p className="text-lg font-bold text-green-400">{stats.completed.toLocaleString()}</p>
                             </div>
                         </div>
                         
                         {/* Score Graph */}
                         <div>
                             <h3 className="text-sm font-bold mb-4">Score Distribution</h3>
                             <div className="flex items-end h-40 gap-1.5">
                                 {stats.scores.sort((a,b) => a.score - b.score).map((s) => (
                                     <div key={s.score} className="flex-1 flex flex-col items-center gap-1 group">
                                         <div 
                                            className={`w-full bg-gray-800 rounded-t relative hover:bg-blue-500 transition-colors bar-animate`}
                                            style={{ '--h': `${s.percentage}%` } as React.CSSProperties}
                                         >
                                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                                                 {s.percentage}%
                                             </div>
                                         </div>
                                         <span className="text-[10px] text-gray-500">{s.score}</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
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
               {/* Action Bar */}
               {!loadingPics && pictures.length > 0 && (
                   <div className="mb-4 flex justify-end">
                       <button onClick={handleDownloadAll} className="flex items-center gap-2 text-xs font-bold bg-[#222] hover:bg-[#333] px-3 py-2 rounded-full text-white border border-gray-800 transition-colors active:scale-95">
                           <Square2StackIcon className="h-4 w-4 text-blue-400" /> Download All ({pictures.length})
                       </button>
                   </div>
               )}
               
                {loadingPics && <div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[2/3] bg-[#1e1e1e] rounded skeleton" />)}</div>}
                {!loadingPics && (
                  <div className="grid grid-cols-3 gap-2">
                      {pictures.map((pic, idx) => (
                          <div key={idx} className="aspect-[2/3] bg-[#111] rounded-lg overflow-hidden relative group cursor-pointer border border-gray-800 shadow-lg active:opacity-80" onClick={() => { triggerHaptic(); setSelectedImage(pic); }}>
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