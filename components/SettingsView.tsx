import React, { useState } from 'react';
import { AppSettings, AppTheme, MalSyncConfig } from '../types';
import { 
  PaintBrushIcon, 
  DevicePhoneMobileIcon, 
  WifiIcon, 
  TrashIcon,
  ArrowLeftIcon,
  CloudArrowDownIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface SettingsViewProps {
  settings: AppSettings;
  syncConfig: MalSyncConfig;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateSyncConfig: (newConfig: MalSyncConfig) => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  onClose: () => void;
  onClearCache: () => void;
}

const THEME_COLORS: Record<AppTheme, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  pink: 'bg-pink-500'
};

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, 
    syncConfig,
    onUpdateSettings, 
    onUpdateSyncConfig,
    onSyncNow,
    isSyncing,
    onClose, 
    onClearCache 
}) => {
  
  const [usernameInput, setUsernameInput] = useState(syncConfig.username);

  const toggleHaptics = () => onUpdateSettings({ ...settings, hapticsEnabled: !settings.hapticsEnabled });
  const toggleDataSaver = () => onUpdateSettings({ ...settings, dataSaver: !settings.dataSaver });

  const handleSaveUser = () => {
      onUpdateSyncConfig({ ...syncConfig, username: usernameInput });
  };

  return (
    <div className="min-h-screen bg-black text-white animate-fade-in pb-20 overflow-y-auto">
      <div className="sticky top-0 z-30 bg-[#111]/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center gap-3 shadow-lg">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-[#333] transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-gray-300" />
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="p-4 space-y-6">

        {/* SYNC SECTION */}
        <section>
           <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CloudArrowDownIcon className="h-4 w-4" /> MyAnimeList Sync
          </h3>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
              <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <UserCircleIcon className="h-5 w-5 absolute left-3 top-3 text-gray-500" />
                    <input 
                        type="text" 
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="MAL Username"
                        className="w-full bg-[#111] border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleSaveUser}
                    className="px-4 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700"
                  >
                      Save
                  </button>
              </div>
              
              <div className="flex items-center justify-between">
                  <div>
                      <p className="text-xs text-gray-400">
                          {syncConfig.lastSynced ? `Last synced: ${new Date(syncConfig.lastSynced).toLocaleTimeString()}` : 'Never synced'}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">Imports Watching & Completed lists (Public Only).</p>
                  </div>
                  <button 
                    onClick={onSyncNow}
                    disabled={isSyncing || !syncConfig.username}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isSyncing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-glow-blue active:scale-95'}`}
                  >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
              </div>
          </div>
        </section>
        
        {/* Theme Section */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <PaintBrushIcon className="h-4 w-4" /> Appearance
          </h3>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
            <p className="text-sm font-medium text-white mb-3">Accent Color</p>
            <div className="flex gap-4 justify-between">
              {(Object.keys(THEME_COLORS) as AppTheme[]).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateSettings({ ...settings, theme: color })}
                  className={`w-10 h-10 rounded-full ${THEME_COLORS[color]} transition-transform hover:scale-110 flex items-center justify-center ${settings.theme === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-70'}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Behavior Section */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <DevicePhoneMobileIcon className="h-4 w-4" /> System & UX
          </h3>
          <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
            
            <div className="p-4 flex items-center justify-between border-b border-gray-800/50 active:bg-[#222]" onClick={toggleHaptics}>
               <div>
                  <p className="text-sm font-medium text-white">Haptic Feedback</p>
                  <p className="text-xs text-gray-500">Vibrate on interactions</p>
               </div>
               <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.hapticsEnabled ? THEME_COLORS[settings.theme] : 'bg-gray-700'}`}>
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
               </div>
            </div>

            <div className="p-4 flex items-center justify-between active:bg-[#222]" onClick={toggleDataSaver}>
               <div>
                  <p className="text-sm font-medium text-white flex items-center gap-2">Data Saver <WifiIcon className="h-3 w-3" /></p>
                  <p className="text-xs text-gray-500">Load lower resolution images</p>
               </div>
               <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.dataSaver ? THEME_COLORS[settings.theme] : 'bg-gray-700'}`}>
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${settings.dataSaver ? 'translate-x-5' : 'translate-x-0'}`} />
               </div>
            </div>

          </div>
        </section>

        {/* Data Section */}
        <section>
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrashIcon className="h-4 w-4" /> Storage
          </h3>
          <button 
            onClick={onClearCache}
            className="w-full bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <TrashIcon className="h-5 w-5" /> Clear App Cache
          </button>
          <p className="text-[10px] text-gray-600 text-center mt-2">Clears images and temporary data. Does not delete Library.</p>
        </section>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-600">MAL Down v3.0.0 (Offline Edition)</p>
            <p className="text-[10px] text-gray-700">Built with Jikan API</p>
        </div>

      </div>
    </div>
  );
};