/**
 * Movie Details Page - TMDB
 */
import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Play, Heart, Bookmark, Star, Clock, Calendar, Globe, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useMovieDetailsQuery } from '../hooks/useQueries';
import { FALLBACK_IMAGE, posterUrl, backdropUrl, getDirector, getTrailer, formatRuntime } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { useList } from '../hooks/useList';
import SEOHead from '../components/SEOHead';
import ShowCard from '../components/ShowCard';
import { SkeletonShowCard } from '../components/SkeletonCard';
import { getMovieEmbedUrl } from '../services/tmdb';

const WATCH_HISTORY_KEY = 'tmdb_watch_history';

function addToHistory(item: { title: string; image: string; url: string; subtitle?: string }) {
  try {
    const history = JSON.parse(localStorage.getItem(WATCH_HISTORY_KEY) || '[]');
    const filtered = history.filter((h: any) => h.url !== item.url);
    filtered.unshift(item);
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(filtered.slice(0, 20)));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { token } = useAuth();
  const { data: movie, isPending: loading, isError: error } = useMovieDetailsQuery(id!);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const { favorited, watchlisted, favLoading, wlLoading, handleToggleFavorite, handleToggleWatchlist } = useList(
    id || '', token, movie?.title || '', movie ? posterUrl(movie.poster_path) : '',
  );

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        <div className="w-full rounded-2xl bg-gray-800 animate-pulse h-[400px]" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonShowCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">Movie not found</p>
          <Link to="/" className="text-blue-500 hover:underline text-sm">Go back home</Link>
        </div>
      </div>
    );
  }

  const director = getDirector(movie.credits?.crew);
  const trailer = getTrailer(movie.videos?.results);
  const cast = (movie.credits?.cast || []).slice(0, 10);
  const backImg = backdropUrl(movie.backdrop_path);
  const posterImg = posterUrl(movie.poster_path, 'w500');
  const runtime = formatRuntime(movie.runtime);
  const similar = (movie.similar?.results || movie.recommendations?.results || []).slice(0, 8);

  const watchUrl = `/watch/movie/${id}`;

  const handleWatch = () => {
    addToHistory({ title: movie.title, image: posterImg, url: watchUrl });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-10">
      <SEOHead
        title={`${movie.title}${movie.release_date ? ` (${movie.release_date.slice(0,4)})` : ''} – Watch Online Free`}
        description={movie.overview ? movie.overview.slice(0, 160) : `Watch ${movie.title} online free in HD.`}
        image={posterImg}
        url={location.pathname}
        type="video.movie"
      />

      {/* Trailer modal */}
      {showTrailer && trailer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={trailer.name}
            />
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900 min-h-[380px]">
        <img src={backImg} alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/85 to-transparent" />

        <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-56 shrink-0 space-y-3">
            <img src={posterImg} alt={`${movie.title} poster`}
              className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border-2 border-white/10"
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
            <div className="flex gap-2">
              <Link to={watchUrl} onClick={handleWatch}
                className="flex-1 py-2.5 bg-white text-gray-900 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all text-sm">
                <Play className="w-4 h-4 fill-current" /> WATCH
              </Link>
              <button onClick={handleToggleFavorite} disabled={!token || favLoading}
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 ${favorited ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-50`}>
                <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
              </button>
              <button onClick={handleToggleWatchlist} disabled={!token || wlLoading}
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 ${watchlisted ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-50`}>
                <Bookmark className={`w-5 h-5 ${watchlisted ? 'fill-current' : ''}`} />
              </button>
            </div>
            {trailer && (
              <button onClick={() => setShowTrailer(true)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <ExternalLink className="w-4 h-4" /> Trailer
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-white min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-600">MOVIE</span>
              {movie.release_date && <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/10">{movie.release_date.slice(0,4)}</span>}
              {movie.status && <span className="px-2 py-0.5 text-xs font-bold rounded bg-green-600/70">{movie.status}</span>}
            </div>

            <h1 className="text-3xl md:text-5xl font-black mb-2 drop-shadow-md">{movie.title}</h1>
            {movie.tagline && <p className="text-gray-300 italic text-sm mb-3">"{movie.tagline}"</p>}

            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Star className="w-4 h-4 fill-current" /> {movie.vote_average.toFixed(1)}/10
                  <span className="text-gray-400 font-normal text-xs">({movie.vote_count.toLocaleString()} votes)</span>
                </span>
              )}
              {runtime && <span className="flex items-center gap-1 text-gray-300"><Clock className="w-4 h-4" />{runtime}</span>}
              {movie.release_date && <span className="flex items-center gap-1 text-gray-300"><Calendar className="w-4 h-4" />{movie.release_date}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(movie.genres || []).map(g => (
                <Link key={g.id} to={`/genre/movie/${g.id}`}
                  className="px-3 py-1 bg-white/10 hover:bg-blue-600 rounded-full text-xs font-bold transition-colors">
                  {g.name}
                </Link>
              ))}
            </div>

            {movie.overview && (
              <div className="mb-4">
                <p className={`text-gray-300 text-sm leading-relaxed ${!showFullOverview ? 'line-clamp-4' : ''}`}>
                  {movie.overview}
                </p>
                {movie.overview.length > 200 && (
                  <button onClick={() => setShowFullOverview(!showFullOverview)}
                    className="text-blue-400 text-xs mt-1 flex items-center gap-1 hover:text-blue-300">
                    {showFullOverview ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
                  </button>
                )}
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm border border-white/10">
              {director && <div><span className="text-gray-400 block text-xs">Director</span><span className="font-medium">{director}</span></div>}
              {movie.spoken_languages?.[0] && <div><span className="text-gray-400 block text-xs">Language</span><span className="font-medium">{movie.spoken_languages[0].english_name}</span></div>}
              {movie.production_companies?.[0] && <div><span className="text-gray-400 block text-xs">Studio</span><span className="font-medium">{movie.production_companies[0].name}</span></div>}
              {movie.budget && movie.budget > 0 && <div><span className="text-gray-400 block text-xs">Budget</span><span className="font-medium">${(movie.budget / 1e6).toFixed(0)}M</span></div>}
              {movie.revenue && movie.revenue > 0 && <div><span className="text-gray-400 block text-xs">Box Office</span><span className="font-medium">${(movie.revenue / 1e6).toFixed(0)}M</span></div>}
              {movie.imdb_id && (
                <div>
                  <span className="text-gray-400 block text-xs">IMDb</span>
                  <a href={`https://www.imdb.com/title/${movie.imdb_id}`} target="_blank" rel="noopener noreferrer"
                    className="text-yellow-400 hover:underline font-medium flex items-center gap-1">
                    {movie.imdb_id} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cast */}
      {cast.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">Cast</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cast.map(person => (
              <div key={person.id} className="shrink-0 w-24 text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 mb-2">
                  <img
                    src={person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : FALLBACK_IMAGE}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  />
                </div>
                <p className="text-xs font-bold dark:text-gray-200 line-clamp-2">{person.name}</p>
                <p className="text-[10px] text-gray-500 line-clamp-1">{person.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {(movie.images?.backdrops || []).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">Images</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(movie.images?.backdrops || []).slice(0, 10).map((img, i) => (
              <a key={i} href={`https://image.tmdb.org/t/p/original${img.file_path}`} target="_blank" rel="noopener noreferrer"
                className="shrink-0 w-56 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                <img src={`https://image.tmdb.org/t/p/w500${img.file_path}`} alt={`Scene ${i+1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">More Like This</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {similar.map(m => (
              <ShowCard key={m.id} id={String(m.id)} title={m.title || m.original_title}
                image={posterUrl(m.poster_path)} type="movie"
                year={m.release_date?.slice(0,4)}
                rating={m.vote_average ? m.vote_average.toFixed(1) : undefined}
                linkPrefix="/movie" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
