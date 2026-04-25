/**
 * Search Page - TMDB Edition
 * Fixed: removed autoFocus (causes blank on mobile), safe SEOHead props,
 * live search as user types without needing form submit.
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Film, Tv, AlertCircle, X } from 'lucide-react';
import { useSearchQuery } from '../hooks/useQueries';
import { SkeletonShowCard } from '../components/SkeletonCard';
import ShowCard from '../components/ShowCard';
import SEOHead from '../components/SEOHead';
import { MediaType } from '../services/tmdb';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type FilterType = MediaType | 'all';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') || 'all') as FilterType;

  const [inputValue, setInputValue] = useState(initialQ);
  const [mediaType, setMediaType] = useState<FilterType>(initialType);

  const debouncedInput = useDebounce(inputValue, 400);

  // Sync URL when debounced input or type changes
  useEffect(() => {
    if (debouncedInput.trim()) {
      setSearchParams({ q: debouncedInput.trim(), type: mediaType }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedInput, mediaType]);

  const activeQ = debouncedInput.trim();

  const { data: results, isFetching: loading, isError: error } = useSearchQuery(activeQ, mediaType);

  const handleTypeChange = (t: FilterType) => {
    setMediaType(t);
  };

  const clearInput = () => {
    setInputValue('');
    setSearchParams({}, { replace: true });
  };

  const seoTitle = activeQ ? 'Search Results – StreamVault' : 'Search Movies and TV Shows – StreamVault';
  const seoDesc = activeQ
    ? 'Find movies and TV shows on StreamVault.'
    : 'Search thousands of movies and TV shows on StreamVault.';

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title={seoTitle} description={seoDesc} />

      <div className="space-y-4">
        <h1 className="text-2xl font-black dark:text-white">Search</h1>

        {/* Search input */}
        <div className="relative">
          <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search movies, TV shows..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-500 transition-shadow"
          />
          {inputValue && (
            <button
              onClick={clearInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2">
          {(['all', 'movie', 'tv'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                mediaType === t
                  ? t === 'tv'
                    ? 'bg-purple-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t === 'movie' && <Film className="w-4 h-4" />}
              {t === 'tv' && <Tv className="w-4 h-4" />}
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>
      </div>

      {/* Results area */}
      {!activeQ ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <SearchIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
            Start typing to search movies and TV shows
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'].map(genre => (
              <Link
                key={genre}
                to={`/genres`}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {genre}
              </Link>
            ))}
          </div>
        </div>
      ) : loading ? (
        /* Loading skeletons */
        <div className="space-y-3">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {Array.from({ length: 16 }).map((_, i) => <SkeletonShowCard key={i} />)}
          </div>
        </div>
      ) : error ? (
        /* Error */
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Search failed. Please try again.</p>
          <button
            onClick={() => setInputValue(prev => prev + ' ')}
            className="text-blue-500 hover:underline text-sm"
          >
            Retry
          </button>
        </div>
      ) : !results || results.length === 0 ? (
        /* No results */
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <SearchIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No results found for <strong className="text-gray-800 dark:text-gray-200">{activeQ}</strong>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Try a different keyword or check spelling</p>
        </div>
      ) : (
        /* Results grid */
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
            <span className="font-bold text-gray-700 dark:text-gray-200">{activeQ}</span>
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {results.map(item => (
              <ShowCard
                key={`${item.type}-${item.id}`}
                id={item.id}
                title={item.title}
                image={item.image}
                type={item.type}
                year={item.year}
                linkPrefix={`/${item.type}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
