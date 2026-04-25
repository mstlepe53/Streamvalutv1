/**
 * Trending controller — uses TMDB API server-side.
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
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getTrending(req: Request, res: Response) {
  try {
    const type = (req.query.type as string) === 'tv' ? 'tv' : 'movie';
    const data = await tmdbFetch<{ results: any[] }>(`/trending/${type}/week`);
    const results = data.results.map(item => ({
      id: String(item.id),
      title: item.title || item.name,
      image: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : '',
      type,
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      rating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
    }));
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
}
