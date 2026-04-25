/**
 * Genres Hub - TMDB Edition
 */
import { Link } from 'react-router-dom';
import { Film, Tv } from 'lucide-react';
import { useMovieGenresQuery, useTVGenresQuery } from '../hooks/useQueries';
import SEOHead from '../components/SEOHead';

const GENRE_COLORS = [
  'from-blue-600 to-blue-800', 'from-purple-600 to-purple-800', 'from-green-600 to-green-800',
  'from-red-600 to-red-800', 'from-yellow-600 to-yellow-800', 'from-pink-600 to-pink-800',
  'from-indigo-600 to-indigo-800', 'from-orange-600 to-orange-800', 'from-teal-600 to-teal-800',
  'from-cyan-600 to-cyan-800', 'from-rose-600 to-rose-800', 'from-violet-600 to-violet-800',
];

export default function GenresHub() {
  const { data: movieGenres, isPending: mlLoading } = useMovieGenresQuery();
  const { data: tvGenres, isPending: tvLoading } = useTVGenresQuery();

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-10">
      <SEOHead title="Browse Genres – StreamVault" description="Browse all movie and TV show genres on StreamVault." />
      <h1 className="text-2xl font-black dark:text-white">Browse by Genre</h1>

      {/* Movie Genres */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-500" /> Movie Genres
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {mlLoading ? Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          )) : (movieGenres || []).map((g, i) => (
            <Link key={g.id} to={`/genre/movie/${g.id}`}
              className={`bg-gradient-to-br ${GENRE_COLORS[i % GENRE_COLORS.length]} text-white rounded-xl p-4 text-center font-bold text-sm hover:scale-105 transition-transform shadow-md`}>
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      {/* TV Genres */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
          <Tv className="w-5 h-5 text-purple-500" /> TV Show Genres
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tvLoading ? Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          )) : (tvGenres || []).map((g, i) => (
            <Link key={g.id} to={`/genre/tv/${g.id}`}
              className={`bg-gradient-to-br ${GENRE_COLORS[(i + 4) % GENRE_COLORS.length]} text-white rounded-xl p-4 text-center font-bold text-sm hover:scale-105 transition-transform shadow-md`}>
              {g.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
