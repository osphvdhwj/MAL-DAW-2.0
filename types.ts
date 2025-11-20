export enum LibraryStatus {
  WATCHING = 'Watching',
  COMPLETED = 'Completed',
  PLAN_TO_WATCH = 'Plan to Watch',
  DROPPED = 'Dropped',
  ON_HOLD = 'On Hold'
}

export interface JikanImage {
  jpg: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
  webp?: {
    image_url: string;
    large_image_url: string;
  };
}

export interface JikanAnime {
  mal_id: number;
  url: string;
  images: JikanImage;
  title: string;
  title_english?: string;
  title_japanese?: string;
  type: string;
  source: string;
  episodes: number | null;
  status: string;
  airing: boolean;
  aired: { string: string; from?: string; to?: string };
  duration: string;
  rating: string;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string;
  background?: string;
  season?: string;
  year?: number;
  studios: { name: string }[];
  genres: { name: string }[];
  broadcast?: { day: string; time: string; timezone: string; string: string };
  trailer?: { youtube_id: string; url: string; embed_url: string; images: { maximum_image_url: string } };
}

export interface JikanAnimeFull extends JikanAnime {
  theme: {
    openings: string[];
    endings: string[];
  };
  external: { name: string; url: string }[];
  streaming: { name: string; url: string }[];
  relations?: JikanRelation[];
}

export interface JikanRelation {
  relation: string;
  entry: {
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }[];
}

export interface JikanReview {
  mal_id: number;
  url: string;
  date: string;
  review: string;
  score: number;
  tags: string[];
  is_spoiler: boolean;
  user: {
    username: string;
    images: { jpg: { image_url: string } };
  };
}

export interface JikanStats {
  watching: number;
  completed: number;
  on_hold: number;
  dropped: number;
  plan_to_watch: number;
  total: number;
  scores: { score: number; votes: number; percentage: number }[];
}

export interface JikanCharacter {
  character: {
    mal_id: number;
    url: string;
    images: { jpg: { image_url: string } };
    name: string;
  };
  role: string;
}

export interface JikanRecommendation {
  entry: {
    mal_id: number;
    url: string;
    images: { jpg: { image_url: string; large_image_url: string } };
    title: string;
  };
}

// --- UPDATED LIBRARY ENTRY ---
export interface LibraryEntry {
  id: number; // mal_id
  anime: JikanAnime;
  
  // Core MAL Fields
  status: LibraryStatus;
  progress: number;
  totalEpisodes: number | null; 
  score: number; // 0-10 (0 is unrated)
  dateAdded: number;

  // Advanced MAL Fields
  startDate?: string; // YYYY-MM-DD
  finishDate?: string; // YYYY-MM-DD
  priority: 'Low' | 'Medium' | 'High';
  rewatching: boolean;
  rewatchCount: number;
  tags: string[]; // Array of tag strings
  notes: string; // Personal comments
}

export enum AppView {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  LIBRARY = 'LIBRARY',
  PROFILE = 'PROFILE',
  DETAILS = 'DETAILS',
  DOWNLOADS = 'DOWNLOADS',
  SETTINGS = 'SETTINGS'
}

// --- Download Manager Types ---
export interface DownloadJob {
  id: string;
  fileName: string;
  url: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  timestamp: number;
  thumbnail?: string;
}

// --- Filtering & Sorting Types ---
export type SortOption = 'date_added' | 'score' | 'title' | 'progress';

export interface LibraryFilter {
  genres: string[];
  years: number[];
  studios: string[];
  status?: LibraryStatus | 'All';
}

// --- Sync & Settings Types ---
export interface MalSyncConfig {
  username: string;
  lastSynced: number | null;
  autoSync: boolean;
  isLoggedIn: boolean;
}

export type AppTheme = 'blue' | 'purple' | 'red' | 'orange' | 'green' | 'pink';

export interface AppSettings {
  theme: AppTheme;
  hapticsEnabled: boolean;
  dataSaver: boolean;
  showAdult: boolean;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserProfile {
  username: string;
  image?: string;
  daysWatched: number;
  meanScore: number;
  episodesWatched: number;
  totalEntries: number;
}

export interface OfflineProgress {
  active: boolean;
  current: number;
  total: number;
  currentItemName: string;
}