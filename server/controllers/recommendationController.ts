/**
 * Recommendation controller — uses TMDB API server-side.
 */
import { Request, Response } from 'express';

const TMDB_API_KEY = '004fbc43b2d09ad149ed78443d237382';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

function normalizeItems(items: any[], type: string) {
  return items.map(item => ({
    id: String(item.id),
    title: item.title || item.name,
    image: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : '',
    type,
    year: (item.release_date || item.first_air_date || '').slice(0, 4),
    rating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
  }));
}

export async function getRecommendations(req: Request, res: Response) {
  try {
    const [moviesRes, tvRes] = await Promise.all([
      tmdbFetch<{ results: any[] }>('/movie/popular'),
      tmdbFetch<{ results: any[] }>('/tv/popular'),
    ]);
    const results = [
      ...normalizeItems(moviesRes.results.slice(0, 10), 'movie'),
      ...normalizeItems(tvRes.results.slice(0, 10), 'tv'),
    ].sort(() => Math.random() - 0.5).slice(0, 12);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}

export async function getRecommendationSections(req: Request, res: Response) {
  try {
    const [trendingMovies, trendingTV, popularMovies, popularTV, topMovies, topTV] = await Promise.all([
      tmdbFetch<{ results: any[] }>('/trending/movie/week'),
      tmdbFetch<{ results: any[] }>('/trending/tv/week'),
      tmdbFetch<{ results: any[] }>('/movie/popular'),
      tmdbFetch<{ results: any[] }>('/tv/popular'),
      tmdbFetch<{ results: any[] }>('/movie/top_rated'),
      tmdbFetch<{ results: any[] }>('/tv/top_rated'),
    ]);
    res.json({
      sections: [
        { title: 'Trending Movies', items: normalizeItems(trendingMovies.results.slice(0, 8), 'movie') },
        { title: 'Trending TV Shows', items: normalizeItems(trendingTV.results.slice(0, 8), 'tv') },
        { title: 'Popular Movies', items: normalizeItems(popularMovies.results.slice(0, 8), 'movie') },
        { title: 'Popular TV Shows', items: normalizeItems(popularTV.results.slice(0, 8), 'tv') },
        { title: 'Top Rated Movies', items: normalizeItems(topMovies.results.slice(0, 8), 'movie') },
        { title: 'Top Rated TV', items: normalizeItems(topTV.results.slice(0, 8), 'tv') },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendation sections' });
  }
}
