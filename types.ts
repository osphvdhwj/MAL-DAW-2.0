export enum LibraryStatus {
  WATCHING = 'Watching',
  COMPLETED = 'Completed',
  PLAN_TO_WATCH = 'Plan to Watch',
  DROPPED = 'Dropped'
}

export interface JikanImage {
  jpg: {
    image_url: string;
    small_image_url: string;
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
  aired: { string: string };
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

export interface LibraryEntry {
  id: number; // mal_id
  anime: JikanAnime;
  status: LibraryStatus;
  progress: number;
  dateAdded: number;
}

export enum AppView {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  LIBRARY = 'LIBRARY',
  DETAILS = 'DETAILS'
}