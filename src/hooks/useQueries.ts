/**
 * React Query hooks for TMDB data fetching.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  getHome,
  getMovieDetails,
  getTVDetails,
  getTVSeason,
  searchMulti,
  searchMovies,
  searchTV,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
  getNowPlayingMovies,
  getOnAirTV,
  getUpcomingMovies,
  getTrendingMovies,
  getTrendingTV,
  getMoviesByGenre,
  getTVByGenre,
  getMovieGenres,
  getTVGenres,
  ShowItem,
  MediaType,
} from '../services/tmdb';

const MS = {
  home: 5 * 60 * 1000,
  listing: 3 * 60 * 1000,
  detail: 30 * 60 * 1000,
  search: 5 * 60 * 1000,
};

export function useHomeQuery() {
  return useQuery({
    queryKey: ['home'],
    queryFn: getHome,
    staleTime: MS.home,
    gcTime: MS.home * 2,
    retry: 1,
  });
}

export function useMovieDetailsQuery(id: string) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
    staleTime: MS.detail,
    gcTime: MS.detail * 2,
    retry: 1,
    enabled: !!id,
  });
}

export function useTVDetailsQuery(id: string) {
  return useQuery({
    queryKey: ['tv', id],
    queryFn: () => getTVDetails(id),
    staleTime: MS.detail,
    gcTime: MS.detail * 2,
    retry: 1,
    enabled: !!id,
  });
}

export function useTVSeasonQuery(tvId: string, seasonNumber: number) {
  return useQuery({
    queryKey: ['tv-season', tvId, seasonNumber],
    queryFn: () => getTVSeason(tvId, seasonNumber),
    staleTime: MS.detail,
    gcTime: MS.detail * 2,
    retry: 1,
    enabled: !!tvId && seasonNumber >= 0,
  });
}

export function useSearchQuery(q: string, mediaType: MediaType | 'all' = 'all') {
  return useQuery({
    queryKey: ['search', q, mediaType],
    queryFn: () => {
      if (mediaType === 'movie') return searchMovies(q);
      if (mediaType === 'tv') return searchTV(q);
      return searchMulti(q);
    },
    staleTime: MS.search,
    gcTime: MS.search * 2,
    enabled: !!q.trim(),
    retry: 1,
  });
}

export type ListingType =
  | 'popular-movies'
  | 'popular-tv'
  | 'top-rated-movies'
  | 'top-rated-tv'
  | 'now-playing'
  | 'on-air'
  | 'upcoming'
  | 'trending-movies'
  | 'trending-tv'
  | 'movie-genre'
  | 'tv-genre';

export function useListingQuery(type: ListingType, slug: string | undefined, page: number) {
  return useQuery<ShowItem[]>({
    queryKey: ['listing', type, slug ?? '', page],
    queryFn: () => {
      switch (type) {
        case 'popular-movies': return getPopularMovies(page);
        case 'popular-tv': return getPopularTV(page);
        case 'top-rated-movies': return getTopRatedMovies(page);
        case 'top-rated-tv': return getTopRatedTV(page);
        case 'now-playing': return getNowPlayingMovies(page);
        case 'on-air': return getOnAirTV(page);
        case 'upcoming': return getUpcomingMovies(page);
        case 'trending-movies': return getTrendingMovies('week', page);
        case 'trending-tv': return getTrendingTV('week', page);
        case 'movie-genre': return getMoviesByGenre(slug!, page);
        case 'tv-genre': return getTVByGenre(slug!, page);
        default: return Promise.resolve([]);
      }
    },
    staleTime: MS.listing,
    gcTime: MS.listing * 2,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function useMovieGenresQuery() {
  return useQuery({
    queryKey: ['movie-genres'],
    queryFn: getMovieGenres,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}

export function useTVGenresQuery() {
  return useQuery({
    queryKey: ['tv-genres'],
    queryFn: getTVGenres,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
