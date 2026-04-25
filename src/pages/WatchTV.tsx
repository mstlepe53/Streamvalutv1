/**
 * Watch TV Page - TMDB + Multi-Server embed
 * Route: /watch/tv/:id/:season/:episode
 */
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Play, SkipBack, SkipForward, AlertCircle, Info, Share2, Heart, Bookmark, LightbulbOff, Search, Server } from 'lucide-react';
import { useTVDetailsQuery, useTVSeasonQuery } from '../hooks/useQueries';
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

type TVServer = { id: number; name: string; getUrl: (id: string, season: number, episode: number) => string };

const SERVERS: TVServer[] = [
  {
    id: 1,
    name: 'VidBinge',
    getUrl: (id, season, episode) => `https://www.vidbinge.to/tv/${id}/${season}/${episode}`,
  },
  {
    id: 2,
    name: 'VidNest',
    getUrl: (id, season, episode) => `https://vidnest.fun/tv/${id}/${season}/${episode}`,
  },
  {
    id: 3,
    name: 'AutoEmbed',
    getUrl: (id, season, episode) => `https://autoembed.co/tv/tmdb/${id}/${season}/${episode}`,
  },
];

export default function WatchTV() {
  const { id, season: seasonParam, episode: episodeParam } = useParams<{ id: string; season: string; episode: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const season = parseInt(seasonParam || '1', 10);
  const episode = parseInt(episodeParam || '1', 10);

  const [lightsOff, setLightsOff] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [epFilter, setEpFilter] = useState('');
  const [autoNext, setAutoNext] = useState(false);
  const [activeServer, setActiveServer] = useState(1);

  const { data: show, isPending: showLoading } = useTVDetailsQuery(id!);
  const { data: seasonData, isPending: seasonLoading } = useTVSeasonQuery(id!, season);

  const { favorited, watchlisted, favLoading, wlLoading, handleToggleFavorite, handleToggleWatchlist } = useList(
    id || '', token, show?.name || '', show ? posterUrl(show.poster_path) : '',
  );

  useEffect(() => {
    setIframeError(false);
    setEpFilter('');
  }, [id, season, episode]);

  useEffect(() => {
    setIframeError(false);
  }, [activeServer]);

  useEffect(() => {
    if (id && show) {
      const posterImg = posterUrl(show.poster_path);
      addToHistory({
        title: show.name,
        image: posterImg,
        url: `/watch/tv/${id}/${season}/${episode}`,
        subtitle: `S${season} E${episode}`,
      });
    }
  }, [show, id, season, episode]);

  const currentServer = SERVERS.find(s => s.id === activeServer) || SERVERS[0];
  const embedUrl = id ? currentServer.getUrl(id, season, episode) : '';

  const episodes = seasonData?.episodes || [];
  const filteredEps = epFilter
    ? episodes.filter(ep => ep.name.toLowerCase().includes(epFilter.toLowerCase()) || String(ep.episode_number).includes(epFilter))
    : episodes;

  const currentEp = episodes.find(ep => ep.episode_number === episode);
  const currentIdx = episodes.findIndex(ep => ep.episode_number === episode);
  const prevEp = currentIdx > 0 ? episodes[currentIdx - 1] : null;
  const nextEp = currentIdx < episodes.length - 1 ? episodes[currentIdx + 1] : null;

  // Season list for switching
  const validSeasons = (show?.seasons || []).filter(s => s.season_number > 0);

  const handlePrev = () => {
    if (prevEp) navigate(`/watch/tv/${id}/${season}/${prevEp.episode_number}`);
  };
  const handleNext = () => {
    if (nextEp) navigate(`/watch/tv/${id}/${season}/${nextEp.episode_number}`);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch {}
  };

  const title = show ? `Watch ${show.name} S${season}E${episode} Online Free` : 'Watch TV Show Online Free';

  return (
    <div className={`max-w-[1600px] mx-auto p-4 md:p-6 transition-colors ${lightsOff ? 'bg-black' : ''}`}>
      <SEOHead title={title} description={show?.overview?.slice(0, 160) || title} image={show ? posterUrl(show.poster_path) : undefined} url={`/watch/tv/${id}/${season}/${episode}`} type="video.tv_show" />
      {lightsOff && <div className="fixed inset-0 bg-black/85 z-40 cursor-pointer" onClick={() => setLightsOff(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-50">
        {/* Player column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Player */}
          <div className="w-full bg-black rounded-xl overflow-hidden relative aspect-video">
            {iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-sm text-gray-200 max-w-md">The player failed to load. Try a different server or episode.</p>
                <button onClick={() => setIframeError(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">Retry</button>
              </div>
            ) : (
              <iframe
                key={`${activeServer}-${id}-${season}-${episode}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0 outline-none"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer"
                title={`${show?.name || 'TV Show'} S${season}E${episode}`}
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
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {server.id}. {server.name}
              </button>
            ))}
          </div>

          {/* Season switcher */}
          {validSeasons.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 self-center">Season:</span>
              {validSeasons.map(s => (
                <Link key={s.season_number}
                  to={`/watch/tv/${id}/${s.season_number}/1`}
                  className={`shrink-0 px-3 py-1 rounded text-xs font-bold transition-colors ${s.season_number === season ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  S{s.season_number}
                </Link>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            <button onClick={() => setAutoNext(!autoNext)}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${autoNext ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <div className={`w-2 h-2 rounded-sm ${autoNext ? 'bg-blue-500' : 'bg-gray-400'}`} /> Auto Next
            </button>
            <button onClick={handlePrev} disabled={!prevEp}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <SkipBack className="w-3.5 h-3.5" /> Prev
            </button>
            <button onClick={handleNext} disabled={!nextEp}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <SkipForward className="w-3.5 h-3.5" /> Next
            </button>
            <button onClick={() => setLightsOff(!lightsOff)}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 ml-auto transition-colors ${lightsOff ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <LightbulbOff className="w-3.5 h-3.5" /> {lightsOff ? 'Lights On' : 'Lights Off'}
            </button>
          </div>

          {/* Title & actions */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {showLoading ? 'Loading...' : `${show?.name} – Season ${season} Episode ${episode}`}
              </h1>
              {currentEp?.name && <p className="text-sm text-gray-500 dark:text-gray-400">{currentEp.name}</p>}
              {currentEp?.air_date && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 font-medium mt-1 inline-block">
                  {currentEp.air_date}
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

          {currentEp?.overview && <p className="text-sm text-gray-600 dark:text-gray-300">{currentEp.overview}</p>}

          <CommentSection episodeId={`tv-${id}-s${season}e${episode}`} />

          {/* Show info card */}
          {show && (
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <img src={posterUrl(show.poster_path)} alt={show.name}
                className="w-full sm:w-36 aspect-[2/3] object-cover rounded-lg"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
              <div className="flex-1">
                <Link to={`/tv/${id}`} className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block mb-2">{show.name}</Link>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(show.genres || []).slice(0, 4).map(g => (
                    <Link key={g.id} to={`/genre/tv/${g.id}`}
                      className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                      {g.name}
                    </Link>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">{show.overview}</p>
                <Link to={`/tv/${id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-medium">
                  <Info className="w-3.5 h-3.5" /> Full Details & All Episodes
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Episode list sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold dark:text-white shrink-0">
                {seasonLoading ? '...' : `S${season} Episodes (${episodes.length})`}
              </span>
              <div className="relative flex-1 min-w-[100px]">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Filter..." value={epFilter} onChange={e => setEpFilter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-500" />
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {seasonLoading ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 border-b border-gray-100 dark:border-gray-800 animate-pulse">
                  <div className="w-16 h-10 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              )) : filteredEps.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No episodes found.</div>
              ) : filteredEps.map(ep => {
                const isActive = ep.episode_number === episode;
                const url = `/watch/tv/${id}/${season}/${ep.episode_number}`;
                const stillImg = ep.still_path ? `https://image.tmdb.org/t/p/w185${ep.still_path}` : FALLBACK_IMAGE;
                return (
                  <Link key={ep.id} to={url}
                    onClick={() => addToHistory({ title: show?.name || '', image: stillImg, url, subtitle: `S${season} E${ep.episode_number}` })}
                    className={`flex gap-3 p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group items-center ${isActive ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}>
                    <div className={`w-16 h-10 shrink-0 rounded overflow-hidden border transition-colors flex items-center justify-center relative ${isActive ? 'border-purple-400' : 'border-gray-200 dark:border-gray-700'}`}>
                      <img src={stillImg} alt={ep.name} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                      <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors`}>
                        <Play className={`w-4 h-4 fill-current text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
                        Ep {ep.episode_number}: {ep.name}
                      </h4>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1.5">
                        {ep.air_date && <span>{ep.air_date}</span>}
                        {ep.runtime && <span>{ep.runtime}m</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <span className="text-3xl font-light text-gray-400 dark:text-gray-600">Advertisement</span>
          </div>
        </div>
      </div>

      <Toast message="Link copied to clipboard!" show={showToast} />
    </div>
  );
}
