import { JikanAnime, JikanCharacter, JikanRecommendation } from "../types";

const BASE_URL = 'https://api.jikan.moe/v4';

// Helper to handle API rate limits roughly
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getTopAnime = async (): Promise<JikanAnime[]> => {
  try {
    const response = await fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=25`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("API Error (Top Anime):", error);
    return [];
  }
};

export const getSeasonNow = async (): Promise<JikanAnime[]> => {
  try {
    const response = await fetch(`${BASE_URL}/seasons/now?limit=25`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("API Error (Season):", error);
    return [];
  }
};

export const searchAnime = async (query: string): Promise<JikanAnime[]> => {
  try {
    const response = await fetch(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&sfw&order_by=members&sort=desc`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("API Error (Search):", error);
    return [];
  }
};

export const getRandomAnime = async (): Promise<JikanAnime | null> => {
  try {
    const response = await fetch(`${BASE_URL}/random/anime`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error("API Error (Random):", error);
    return null;
  }
};

export const getAnimePictures = async (id: number): Promise<string[]> => {
  try {
    await delay(200); 
    const response = await fetch(`${BASE_URL}/anime/${id}/pictures`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.data.map((img: any) => img.jpg.large_image_url || img.jpg.image_url) || [];
  } catch (error) {
    console.error("API Error (Pictures):", error);
    return [];
  }
};

export const getAnimeCharacters = async (id: number): Promise<JikanCharacter[]> => {
  try {
    await delay(200);
    // sort by role to put Main characters first
    const response = await fetch(`${BASE_URL}/anime/${id}/characters`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    const chars = data.data || [];
    return chars.sort((a: any, b: any) => a.role === 'Main' ? -1 : 1).slice(0, 20);
  } catch (error) {
    console.error("API Error (Characters):", error);
    return [];
  }
};

export const getAnimeRecommendations = async (id: number): Promise<JikanRecommendation[]> => {
  try {
    await delay(200);
    const response = await fetch(`${BASE_URL}/anime/${id}/recommendations`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("API Error (Recommendations):", error);
    return [];
  }
};