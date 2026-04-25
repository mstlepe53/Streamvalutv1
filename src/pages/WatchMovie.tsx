/**
 * Watch Movie Page - TMDB + Multi-Server embed
 */
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Play, AlertCircle, Info, Share2, Heart, Bookmark, Flag, LightbulbOff, Server } from 'lucide-react';
import { useMovieDetailsQuery } from '../hooks/useQueries';
import { FALLBACK_IMAGE, posterUrl } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { useList } from '../hooks/useList';
import SEOHead from '../components/SEOHead';
import Toast from '../components/Toast';
import CommentSection from '../components/comments/CommentSection';

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

type Server = { id: number; name: string; getUrl: (id: string) => string };

const SERVERS: Server[] = [
  {
    id: 1,
    name: 'VidBinge',
    getUrl: (id) => `https://www.vidbinge.to/movie/${id}`,
  },
  {
    id: 2,
    name: 'VidNest',
    getUrl: (id) => `https://vidnest.fun/movie/${id}`,
  },
  {
    id: 3,
    name: 'AutoEmbed',
    getUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
  },
];

export default function WatchMovie() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [lightsOff, setLightsOff] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [activeServer, setActiveServer] = useState(1);

  const { data: movie, isPending: loading } = useMovieDetailsQuery(id!);

  const { favorited, watchlisted, favLoading, wlLoading, handleToggleFavorite, handleToggleWatchlist } = useList(
    id || '', token, movie?.title || '', movie ? posterUrl(movie.poster_path) : '',
  );

  useEffect(() => {
    if (id && movie) {
      const posterImg = posterUrl(movie.poster_path);
      addToHistory({ title: movie.title, image: posterImg, url: `/watch/movie/${id}` });
    }
  }, [movie, id]);

  useEffect(() => {
    setIframeError(false);
  }, [activeServer]);

  const currentServer = SERVERS.find(s => s.id === activeServer) || SERVERS[0];
  const embedUrl = id ? currentServer.getUrl(id) : '';

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch {}
  };

  if (!id) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-gray-700 dark:text-gray-300">Movie not found.</p>
      <Link to="/" className="text-blue-500 underline text-sm">Go Home</Link>
    </div>
  );

  const title = movie ? `Watch ${movie.title}${movie.release_date ? ` (${movie.release_date.slice(0,4)})` : ''} Online Free` : 'Watch Movie Online Free';

  return (
    <div className={`max-w-[1600px] mx-auto p-4 md:p-6 transition-colors ${lightsOff ? 'bg-black' : ''}`}>
      <SEOHead title={title} description={movie?.overview?.slice(0, 160) || title} image={movie ? posterUrl(movie.poster_path) : undefined} url={`/watch/movie/${id}`} type="video.movie" />
      {lightsOff && <div className="fixed inset-0 bg-black/85 z-40 cursor-pointer" onClick={() => setLightsOff(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-50">
        <div className="lg:col-span-2 space-y-4">
          {/* Player */}
          <div className="w-full bg-black rounded-xl overflow-hidden relative aspect-video">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-sm text-gray-200 max-w-md">The player failed to load. Try a different server.</p>
                <div className="flex gap-2">
                  <button onClick={() => setIframeError(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">Retry</button>
                </div>
              </div>
            ) : (
              <iframe
                key={`${activeServer}-${id}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0 outline-none"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer"
                title={movie?.title || 'Movie Player'}
                onError={() => setIframeError(true)}
                loading="eager"
              />
            )}
          </div>

          {/* Server selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
              <Server className="w-3.5 h-3.5" /> Server:
            </span>
            {SERVERS.map(server => (
              <button
                key={server.id}
                onClick={() => setActiveServer(server.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                  activeServer === server.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {server.id}. {server.name}
              </button>
            ))}
          </div>

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            <button onClick={() => setLightsOff(!lightsOff)}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 ml-auto transition-colors ${lightsOff ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <LightbulbOff className="w-3.5 h-3.5" /> {lightsOff ? 'Lights On' : 'Lights Off'}
            </button>
          </div>

          {/* Title & actions */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {loading ? 'Loading...' : movie?.title}
              </h1>
              {movie?.release_date && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 font-medium">
                  {movie.release_date}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleToggleFavorite} disabled={!token || favLoading}
                className={`p-2 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${favorited ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'} disabled:opacity-50`}>
                <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} /> {favorited ? 'Favorited' : 'Favorite'}
              </button>
              <button onClick={handleToggleWatchlist} disabled={!token || wlLoading}
                className={`p-2 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${watchlisted ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'} disabled:opacity-50`}>
                <Bookmark className={`w-4 h-4 ${watchlisted ? 'fill-current' : ''}`} /> {watchlisted ? 'Saved' : 'Watchlist'}
              </button>
              <button onClick={handleShare}
                className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 flex items-center gap-1 text-sm font-medium">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>

          {movie?.overview && <p className="text-sm text-gray-600 dark:text-gray-300">{movie.overview}</p>}

          <CommentSection episodeId={`movie-${id}`} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {movie && (
            <div className="flex gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <img src={posterUrl(movie.poster_path)} alt={movie.title}
                className="w-24 aspect-[2/3] object-cover rounded-lg shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{movie.title}</h2>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(movie.genres || []).slice(0, 3).map(g => (
                    <Link key={g.id} to={`/genre/movie/${g.id}`}
                      className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                      {g.name}
                    </Link>
                  ))}
                </div>
                <Link to={`/movie/${id}`}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:underline font-medium">
                  <Info className="w-3.5 h-3.5" /> Full Details
                </Link>
              </div>
            </div>
          )}
          <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <span className="text-3xl font-light text-gray-400 dark:text-gray-600">Advertisement</span>
          </div>
        </div>
      </div>

      <Toast message="Link copied to clipboard!" show={showToast} />
    </div>
  );
}
