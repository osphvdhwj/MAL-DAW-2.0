import React, { useState, useEffect } from 'react';
import { AppSettings, AppTheme, MalSyncConfig, LibraryEntry, UserProfile, OfflineProgress } from '../types';
import { 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ArrowDownTrayIcon,
  CloudArrowDownIcon,
  ChartPieIcon,
  PaintBrushIcon,
  DevicePhoneMobileIcon,
  TrashIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';

interface ProfileViewProps {
  library: LibraryEntry[];
  settings: AppSettings;
  syncConfig: MalSyncConfig;
  offlineProgress: OfflineProgress;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateSyncConfig: (newConfig: MalSyncConfig) => void;
  onSyncNow: () => void;
  onDownloadLibrary: () => void;
  onClearCache: () => void;
  isSyncing: boolean;
}

const THEME_COLORS: Record<AppTheme, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  pink: 'bg-pink-500'
};

export const ProfileView: React.FC<ProfileViewProps> = ({ 
    library,
    settings, 
    syncConfig,
    offlineProgress,
    onUpdateSettings, 
    onUpdateSyncConfig,
    onSyncNow,
    onDownloadLibrary,
    onClearCache,
    isSyncing
}) => {
  
  const [usernameInput, setUsernameInput] = useState(syncConfig.username);
  const [stats, setStats] = useState<UserProfile>({ username: 'Guest', daysWatched: 0, meanScore: 0, episodesWatched: 0, totalEntries: 0 });

  useEffect(() => {
      // Calculate Stats
      let totalEps = 0;
      let totalScore = 0;
      let scoredCount = 0;

      library.forEach(entry => {
          totalEps += entry.progress;
          if (entry.score > 0) {
              totalScore += entry.score;
              scoredCount++;
          }
      });

      // Approx 24 min per ep
      const days = (totalEps * 24) / (60 * 24);

      setStats({
          username: syncConfig.username || 'Guest',
          daysWatched: parseFloat(days.toFixed(1)),
          meanScore: scoredCount > 0 ? parseFloat((totalScore / scoredCount).toFixed(2)) : 0,
          episodesWatched: totalEps,
          totalEntries: library.length
      });
  }, [library, syncConfig.username]);

  return (
    <div className="min-h-screen bg-black text-white pb-24 animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-b from-[#111] to-black p-6 border-b border-gray-900">
          <div className="flex items-center gap-4 mb-6">
              <div className={`w-20 h-20 rounded-full p-1 ${THEME_COLORS[settings.theme]}`}>
                 <img 
                    src={`https://ui-avatars.com/api/?name=${stats.username}&background=random&size=128`} 
                    className="w-full h-full rounded-full border-2 border-black" 
                    alt="Profile"
                 />
              </div>
              <div>
                  <h2 className="text-2xl font-bold">{stats.username}</h2>
                  <p className="text-sm text-gray-400">{library.length} Anime Entries</p>
              </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
             <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-gray-800">
                 <p className="text-xs text-gray-500 uppercase">Episodes</p>
                 <p className="text-lg font-bold text-white">{stats.episodesWatched}</p>
             </div>
             <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-gray-800">
                 <p className="text-xs text-gray-500 uppercase">Days</p>
                 <p className="text-lg font-bold text-blue-400">{stats.daysWatched}</p>
             </div>
             <div className="bg-[#1a1a1a] rounded-lg p-3 text-center border border-gray-800">
                 <p className="text-xs text-gray-500 uppercase">Mean Score</p>
                 <p className="text-lg font-bold text-yellow-400">{stats.meanScore}</p>
             </div>
          </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Sync Section */}
        <section>
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <CloudArrowDownIcon className="h-4 w-4" /> MAL Sync
           </h3>
           <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
               {syncConfig.isLoggedIn ? (
                   <>
                       <div className="flex justify-between items-center">
                           <div>
                               <p className="text-sm font-medium text-white flex items-center gap-2">
                                   <CheckBadgeIcon className="h-4 w-4 text-green-500" /> Synced as {syncConfig.username}
                               </p>
                               <p className="text-xs text-gray-500 mt-1">Last sync: {syncConfig.lastSynced ? new Date(syncConfig.lastSynced).toLocaleDateString() + ' ' + new Date(syncConfig.lastSynced).toLocaleTimeString() : 'Never'}</p>
                           </div>
                           <div className="flex gap-2">
                                <button onClick={onSyncNow} disabled={isSyncing} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 shadow-lg active:scale-95 transition-transform">
                                    <ArrowPathIcon className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                </button>
                                <button onClick={() => onUpdateSyncConfig({...syncConfig, isLoggedIn: false, username: ''})} className="p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                           </div>
                       </div>
                       
                       {/* Auto Sync Toggle */}
                       <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-white">Background Auto-Sync</p>
                                <p className="text-xs text-gray-500">Sync periodically when online</p>
                            </div>
                            <button 
                                onClick={() => onUpdateSyncConfig({ ...syncConfig, autoSync: !syncConfig.autoSync })}
                                className={`w-10 h-6 rounded-full p-1 transition-colors ${syncConfig.autoSync ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${syncConfig.autoSync ? 'translate-x-4' : ''}`} />
                            </button>
                       </div>
                   </>
               ) : (
                   <div className="flex gap-2">
                       <input 
                           type="text" 
                           value={usernameInput}
                           onChange={(e) => setUsernameInput(e.target.value)}
                           placeholder="MAL Username"
                           className="flex-1 bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                       />
                       <button 
                           onClick={() => { onUpdateSyncConfig({...syncConfig, username: usernameInput}); onSyncNow(); }}
                           disabled={isSyncing || !usernameInput}
                           className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-glow-blue"
                       >
                           Login
                       </button>
                   </div>
               )}
           </div>
        </section>

        {/* Offline Manager */}
        <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <SignalSlashIcon className="h-4 w-4" /> Offline Storage
            </h3>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-sm font-bold text-white">Download Library</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Save info, characters, and images for your {library.length} anime entries to device storage.
                        </p>
                    </div>
                    <button 
                        onClick={onDownloadLibrary}
                        disabled={offlineProgress.active || library.length === 0}
                        className={`p-3 rounded-full text-white shadow-lg active:scale-95 transition-all ${offlineProgress.active ? 'bg-gray-700' : 'bg-green-600 hover:bg-green-500'}`}
                    >
                        <ArrowDownTrayIcon className="h-6 w-6" />
                    </button>
                </div>

                {offlineProgress.active && (
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{offlineProgress.current} / {offlineProgress.total} items</span>
                            <span className="truncate max-w-[150px]">{offlineProgress.currentItemName}</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(offlineProgress.current / offlineProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                    <button onClick={onClearCache} className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300">
                        <TrashIcon className="h-3 w-3" /> Clear Cached Data
                    </button>
                </div>
            </div>
        </section>

        {/* Appearance Settings */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <PaintBrushIcon className="h-4 w-4" /> Accent Color
          </h3>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 flex justify-between">
              {(Object.keys(THEME_COLORS) as AppTheme[]).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateSettings({ ...settings, theme: color })}
                  className={`w-8 h-8 rounded-full ${THEME_COLORS[color]} transition-transform ${settings.theme === color ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                />
              ))}
          </div>
        </section>

        {/* Toggle Settings */}
        <section>
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Cog6ToothIcon className="h-4 w-4" /> Preferences
           </h3>
           <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
                <div className="p-4 flex justify-between items-center border-b border-gray-800/50 active:bg-[#222]" onClick={() => onUpdateSettings({...settings, hapticsEnabled: !settings.hapticsEnabled})}>
                    <span className="text-sm font-medium text-white">Haptic Feedback</span>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.hapticsEnabled ? THEME_COLORS[settings.theme] : 'bg-gray-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.hapticsEnabled ? 'translate-x-4' : ''}`} />
                    </div>
                </div>
                <div className="p-4 flex justify-between items-center active:bg-[#222]" onClick={() => onUpdateSettings({...settings, dataSaver: !settings.dataSaver})}>
                    <span className="text-sm font-medium text-white">Data Saver Mode</span>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.dataSaver ? THEME_COLORS[settings.theme] : 'bg-gray-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.dataSaver ? 'translate-x-4' : ''}`} />
                    </div>
                </div>
           </div>
        </section>
        
        <div className="text-center text-gray-600 text-xs mt-8">
            MAL Down v3.6.0 • Offline Edition
        </div>

      </div>
    </div>
  );
};