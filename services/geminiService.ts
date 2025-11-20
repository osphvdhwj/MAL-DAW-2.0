import { JikanAnime, JikanCharacter, JikanRecommendation, JikanAnimeFull, JikanRelation, JikanReview, JikanStats, LibraryEntry, LibraryStatus } from "../types";

const BASE_URL = 'https://api.jikan.moe/v4';

// --- OFFLINE CACHE LAYER ---
const CACHE_NAME = 'mal-down-api-v1';
const IMAGE_CACHE_NAME = 'mal-down-images-v1';

/**
 * Smart Fetch:
 * 1. Tries to fetch from network.
 * 2. If successful, saves response to Cache API.
 * 3. If network fails (offline), tries to retrieve from Cache API.
 */
const fetchWithCache = async (url: string): Promise<any> => {
  try {
    // Try Network First
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    // Clone and Cache
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(url, response.clone());
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Network Failed, Try Cache
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        console.log("Serving from Offline Cache:", url);
        return cachedResponse.json();
      }
    }
    throw error;
  }
};

/**
 * Prefetch an Image (Cache it for offline use)
 */
export const prefetchImage = async (url: string): Promise<void> => {
    if (!url) return;
    try {
        if ('caches' in window) {
            const cache = await caches.open(IMAGE_CACHE_NAME);
            const match = await cache.match(url);
            if (!match) {
                const response = await fetch(url, { mode: 'no-cors' }); // no-cors for external images
                await cache.put(url, response);
            }
        }
    } catch (e) {
        console.warn("Failed to prefetch image:", url);
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getTopAnime = async (page: number = 1): Promise<JikanAnime[]> => {
  await delay(350);
  const data = await fetchWithCache(`${BASE_URL}/top/anime?filter=bypopularity&limit=24&page=${page}`);
  return data.data || [];
};

export const getSeasonNow = async (page: number = 1): Promise<JikanAnime[]> => {
  await delay(350);
  const data = await fetchWithCache(`${BASE_URL}/seasons/now?limit=24&page=${page}`);
  return data.data || [];
};

export const getSchedule = async (day?: string, page: number = 1): Promise<JikanAnime[]> => {
  await delay(350);
  const dayParam = day ? `?filter=${day}` : '';
  const data = await fetchWithCache(`${BASE_URL}/schedules${dayParam}&page=${page}`);
  return data.data || [];
};

export const searchAnime = async (query: string, page: number = 1): Promise<JikanAnime[]> => {
  await delay(350);
  const data = await fetchWithCache(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&sfw&order_by=members&sort=desc&page=${page}&limit=24`);
  return data.data || [];
};

export const getRandomAnime = async (): Promise<JikanAnime | null> => {
  try {
    const response = await fetch(`${BASE_URL}/random/anime`); // Random shouldn't be cached aggressively
    const data = await response.json();
    return data.data || null;
  } catch (e) { return null; }
};

// --- DEEP DETAILS & PREFETCH ---

export const getAnimeFullById = async (id: number): Promise<JikanAnimeFull | null> => {
  try {
    await delay(400);
    const data = await fetchWithCache(`${BASE_URL}/anime/${id}/full`);
    return data.data || null;
  } catch (error) { return null; }
};

export const getAnimePictures = async (id: number): Promise<string[]> => {
  try {
    await delay(200); 
    const data = await fetchWithCache(`${BASE_URL}/anime/${id}/pictures`);
    return data.data.map((img: any) => img.jpg.large_image_url || img.jpg.image_url) || [];
  } catch (error) { return []; }
};

export const getAnimeCharacters = async (id: number): Promise<JikanCharacter[]> => {
  try {
    await delay(200);
    const data = await fetchWithCache(`${BASE_URL}/anime/${id}/characters`);
    const chars = data.data || [];
    return chars.sort((a: any, b: any) => a.role === 'Main' ? -1 : 1).slice(0, 20);
  } catch (error) { return []; }
};

export const getAnimeRecommendations = async (id: number): Promise<JikanRecommendation[]> => {
  try {
    await delay(200);
    const data = await fetchWithCache(`${BASE_URL}/anime/${id}/recommendations`);
    return data.data || [];
  } catch (error) { return []; }
};

// --- OFFLINE DOWNLOAD MANAGER ---

/**
 * Downloads all data associated with an anime ID to the cache.
 * Used for "Make Library Available Offline"
 */
export const prefetchAnimeData = async (id: number): Promise<void> => {
    try {
        // 1. Fetch JSON Data
        const full = await getAnimeFullById(id);
        const chars = await getAnimeCharacters(id);
        const pics = await getAnimePictures(id);
        await getAnimeReviews(id);
        await getAnimeStatistics(id);

        // 2. Cache Images
        if (full) {
            await prefetchImage(full.images.jpg.large_image_url);
        }
        
        // Cache Character Images (Top 10)
        for (const char of chars.slice(0, 10)) {
             await prefetchImage(char.character.images.jpg.image_url);
        }

        // Cache Gallery Images (Top 10)
        for (const pic of pics.slice(0, 10)) {
            await prefetchImage(pic);
        }

    } catch (e) {
        console.error(`Failed to prefetch anime ${id}`, e);
    }
};

// --- NEW: MAL FEATURES ---

export const getAnimeRelations = async (id: number): Promise<JikanRelation[]> => {
  try {
    const data = await fetchWithCache(`${BASE_URL}/anime/${id}/relations`);
    return data.data || [];
  } catch { return []; }
};

export const getAnimeReviews = async (id: number): Promise<JikanReview[]> => {
  try {
    const data = await fetchWithCache(`${BASE_URL}/anime/${id}/reviews?sort=desc&spoilers=false&preliminary=false`);
    return data.data || [];
  } catch { return []; }
};

export const getAnimeStatistics = async (id: number): Promise<JikanStats | null> => {
  try {
    const data = await fetchWithCache(`${BASE_URL}/anime/${id}/statistics`);
    return data.data || null;
  } catch { return null; }
};

// --- NEW: REAL USER SYNC ---

export const getUserLibrary = async (username: string): Promise<LibraryEntry[]> => {
  const allEntries: LibraryEntry[] = [];
  
  try {
      // Fetch Watching
      const wRes = await fetch(`${BASE_URL}/users/${username}/animelist?status=watching&limit=100`); // Limit is capped by API
      if(wRes.ok) {
         const wData = await wRes.json();
         if(wData.data) allEntries.push(...mapMalToLibrary(wData.data, LibraryStatus.WATCHING));
      }
      
      await delay(1000); // Hard wait to avoid 429

      // Fetch Completed
      const cRes = await fetch(`${BASE_URL}/users/${username}/animelist?status=completed&limit=100`);
      if(cRes.ok) {
         const cData = await cRes.json();
         if(cData.data) allEntries.push(...mapMalToLibrary(cData.data, LibraryStatus.COMPLETED));
      }
      
      return allEntries;

  } catch (e) {
      console.error("Sync Error", e);
      throw e;
  }
};

const mapMalToLibrary = (malData: any[], status: LibraryStatus): LibraryEntry[] => {
    return malData.map((item: any) => ({
        id: item.anime.mal_id,
        anime: item.anime,
        status: status,
        progress: item.episodes_watched || 0,
        totalEpisodes: item.anime.episodes,
        score: item.score,
        dateAdded: Date.now(),
        priority: 'Medium',
        rewatching: false,
        rewatchCount: 0,
        tags: [],
        notes: ''
    }));
};