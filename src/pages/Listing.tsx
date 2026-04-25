/**
 * Listing Page - TMDB Edition
 */
import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useListingQuery, ListingType } from '../hooks/useQueries';
import ShowCard from '../components/ShowCard';
import { SkeletonShowCard } from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';

const TITLES: Record<ListingType, string> = {
  'popular-movies': 'Popular Movies',
  'popular-tv': 'Popular TV Shows',
  'top-rated-movies': 'Top Rated Movies',
  'top-rated-tv': 'Top Rated TV Shows',
  'now-playing': 'Now Playing in Theaters',
  'on-air': 'Currently On Air',
  'upcoming': 'Upcoming Movies',
  'trending-movies': 'Trending Movies',
  'trending-tv': 'Trending TV Shows',
  'movie-genre': 'Movie Genre',
  'tv-genre': 'TV Genre',
};

interface ListingProps {
  type: ListingType;
}

export default function Listing({ type }: ListingProps) {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [page, setPage] = useState(1);

  const { data, isFetching: loading, isError: error } = useListingQuery(type, slug, page);

  const isGenre = type === 'movie-genre' || type === 'tv-genre';
  const isMovie = type.includes('movie') || type === 'now-playing' || type === 'upcoming' || type === 'trending-movies';
  const linkPrefix = isMovie ? '/movie' : '/tv';

  const title = isGenre && slug
    ? `${slug} ${isMovie ? 'Movies' : 'TV Shows'}`
    : TITLES[type];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      <SEOHead
        title={`${title} – StreamVault`}
        description={`Browse ${title} on StreamVault. Stream online free in HD.`}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black dark:text-white">{title}</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Page {page}</span>
        </div>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Failed to load content.</p>
          <button onClick={() => setPage(1)} className="text-blue-500 hover:underline text-sm">Try again</button>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {loading
          ? Array.from({ length: 20 }).map((_, i) => <SkeletonShowCard key={i} />)
          : (data || []).map(item => (
            <ShowCard
              key={item.id}
              id={item.id}
              title={item.title}
              image={item.image}
              type={item.type}
              year={item.year}
              rating={item.rating}
              episode={item.episode}
              linkPrefix={linkPrefix}
            />
          ))
        }
      </div>

      {!loading && !error && data && data.length === 0 && (
        <div className="text-center py-16 text-gray-500">No items found.</div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
          disabled={page === 1 || loading}
          className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-sm font-bold dark:text-gray-200 px-4 py-2 bg-blue-600 text-white rounded-lg">{page}</span>
        <button
          onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
          disabled={loading || !data || data.length === 0}
          className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
