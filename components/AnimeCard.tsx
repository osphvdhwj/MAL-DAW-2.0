import React from 'react';
import { JikanAnime } from '../types';
import { StarIcon } from '@heroicons/react/24/solid';

interface AnimeCardProps {
  anime: JikanAnime;
  onClick: () => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick }) => {
  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden bg-[#1e1e1e] active:scale-95 transition-transform duration-200 shadow-lg"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative">
        <img 
          src={anime.images.jpg.large_image_url} 
          alt={anime.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3">
           <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight mb-1">{anime.title_english || anime.title}</h3>
           <div className="flex items-center justify-between text-xs text-gray-400">
             <span className="flex items-center text-yellow-400">
               <StarIcon className="h-3 w-3 mr-1" />
               {anime.score || 'N/A'}
             </span>
             <span>{anime.year || anime.status}</span>
           </div>
        </div>
      </div>
    </div>
  );
};
