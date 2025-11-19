import React from 'react';
import { JikanAnime } from '../types';
import { StarIcon } from '@heroicons/react/24/solid';

interface AnimeCardProps {
  anime?: JikanAnime; // Optional for loading state
  onClick?: () => void;
  isLoading?: boolean;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick, isLoading = false }) => {
  
  if (isLoading || !anime) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-[#1e1e1e] aspect-[2/3] shadow-lg">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4 skeleton" />
          <div className="flex justify-between">
             <div className="h-3 bg-white/10 rounded w-1/4 skeleton" />
             <div className="h-3 bg-white/10 rounded w-1/4 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden bg-[#1e1e1e] active:scale-95 transition-transform duration-200 shadow-lg gpu-accelerated group"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative">
        <img 
          src={anime.images.jpg.large_image_url} 
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3">
           <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight mb-1 drop-shadow-md">{anime.title_english || anime.title}</h3>
           <div className="flex items-center justify-between text-xs text-gray-300">
             <span className="flex items-center text-yellow-400 font-bold">
               <StarIcon className="h-3 w-3 mr-1" />
               {anime.score || 'N/A'}
             </span>
             <span className="opacity-80">{anime.year || anime.status}</span>
           </div>
        </div>
      </div>
    </div>
  );
};