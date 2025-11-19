import React, { useState, FormEvent } from 'react';
import { MagnifyingGlassIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onRandom: () => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onRandom, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full px-4 pt-2 pb-4 sticky top-0 bg-black z-30 flex gap-2">
      <div className="relative flex-1 flex items-center bg-[#252525] rounded-full px-4 py-3 shadow-md border border-gray-800">
        <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
        <input
          type="text"
          className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-3 text-base"
          placeholder="Search MAL..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && (
             <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      <button 
        type="button" 
        onClick={onRandom}
        className="bg-[#252525] border border-gray-800 rounded-full p-3 text-purple-400 active:scale-95 transition-transform shadow-md"
        title="Surprise me! (Random Anime)"
      >
        <CubeTransparentIcon className="h-6 w-6" />
      </button>
    </form>
  );
};