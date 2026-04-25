/**
 * TV Show Details Page - TMDB
 * Shows seasons, episodes, cast, images, similar shows
 */
import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Play, Heart, Bookmark, Star, Clock, Calendar, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Tv } from 'lucide-react';
import { useTVDetailsQuery, useTVSeasonQuery } from '../hooks/useQueries';
import { FALLBACK_IMAGE, posterUrl, backdropUrl, getTrailer, formatRuntime } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { useList } from '../hooks/useList';
import SEOHead from '../components/SEOHead';
import ShowCard from '../components/ShowCard';
import { SkeletonShowCard } from '../components/SkeletonCard';

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

function EpisodeList({ tvId, seasonNumber, showName }: { tvId: string; seasonNumber: number; showName: string }) {
  const { data: season, isPending } = useTVSeasonQuery(tvId, seasonNumber);
  const posterImg = ''; // fallback

  if (isPending) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );

  if (!season?.episodes?.length) return <p className="text-gray-500 text-sm py-4 text-center">No episodes available.</p>;

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
      {season.episodes.map(ep => {
        const url = `/watch/tv/${tvId}/${seasonNumber}/${ep.episode_number}`;
        const stillImg = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : FALLBACK_IMAGE;
        return (
          <Link key={ep.id} to={url}
            onClick={() => addToHistory({ title: showName, image: stillImg, url, subtitle: `S${seasonNumber} E${ep.episode_number}` })}
            className="flex gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group items-center border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
            <div className="w-24 aspect-video rounded overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
              <img src={stillImg} alt={ep.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-blue-500 dark:text-blue-400 shrink-0">Ep {ep.episode_number}</span>
                {ep.vote_average > 0 && (
                  <span className="text-[10px] text-yellow-500 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />{ep.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {ep.name}
              </h4>
              {ep.overview && <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{ep.overview}</p>}
              <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-1">
                {ep.air_date && <span>{ep.air_date}</span>}
                {ep.runtime && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{ep.runtime}m</span>}
              </div>
            </div>
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:text-white fill-current transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function TVDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { token } = useAuth();
  const { data: show, isPending: loading, isError: error } = useTVDetailsQuery(id!);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const { favorited, watchlisted, favLoading, wlLoading, handleToggleFavorite, handleToggleWatchlist } = useList(
    id || '', token, show?.name || '', show ? posterUrl(show.poster_path) : '',
  );

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        <div className="w-full rounded-2xl bg-gray-800 animate-pulse h-[400px]" />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">Show not found</p>
          <Link to="/" className="text-blue-500 hover:underline text-sm">Go back home</Link>
        </div>
      </div>
    );
  }

  const trailer = getTrailer(show.videos?.results);
  const cast = (show.credits?.cast || show.aggregate_credits?.cast || []).slice(0, 10);
  const backImg = backdropUrl(show.backdrop_path);
  const posterImg = posterUrl(show.poster_path, 'w500');
  const similar = (show.similar?.results || show.recommendations?.results || []).slice(0, 8);
  const runtime = show.episode_run_time?.[0] ? formatRuntime(show.episode_run_time[0]) : '';

  // Filter real seasons (not specials season 0)
  const seasons = (show.seasons || []).filter(s => s.season_number > 0);

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-10">
      <SEOHead
        title={`${show.name}${show.first_air_date ? ` (${show.first_air_date.slice(0,4)})` : ''} – Watch Online Free`}
        description={show.overview ? show.overview.slice(0, 160) : `Watch ${show.name} online free in HD.`}
        image={posterImg}
        url={location.pathname}
        type="video.tv_show"
      />

      {/* Trailer modal */}
      {showTrailer && trailer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <iframe src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title={trailer.name} />
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900 min-h-[380px]">
        <img src={backImg} alt={show.name}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/85 to-transparent" />

        <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-56 shrink-0 space-y-3">
            <img src={posterImg} alt={`${show.name} poster`}
              className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border-2 border-white/10"
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
            <div className="flex gap-2">
              <Link to={`/watch/tv/${id}/1/1`}
                onClick={() => addToHistory({ title: show.name, image: posterImg, url: `/watch/tv/${id}/1/1`, subtitle: 'S1 E1' })}
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

          <div className="flex-1 text-white min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-600">TV SHOW</span>
              {show.first_air_date && <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/10">{show.first_air_date.slice(0,4)}</span>}
              {show.status && <span className={`px-2 py-0.5 text-xs font-bold rounded ${show.in_production ? 'bg-green-600/70' : 'bg-gray-600/70'}`}>{show.status}</span>}
            </div>

            <h1 className="text-3xl md:text-5xl font-black mb-2 drop-shadow-md">{show.name}</h1>
            {show.tagline && <p className="text-gray-300 italic text-sm mb-3">"{show.tagline}"</p>}

            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {show.vote_average > 0 && (
                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Star className="w-4 h-4 fill-current" /> {show.vote_average.toFixed(1)}/10
                  <span className="text-gray-400 font-normal text-xs">({show.vote_count.toLocaleString()} votes)</span>
                </span>
              )}
              {runtime && <span className="flex items-center gap-1 text-gray-300"><Clock className="w-4 h-4" />{runtime}/ep</span>}
              {show.number_of_seasons && <span className="text-gray-300">{show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}</span>}
              {show.number_of_episodes && <span className="text-gray-300">{show.number_of_episodes} Episodes</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(show.genres || []).map(g => (
                <Link key={g.id} to={`/genre/tv/${g.id}`}
                  className="px-3 py-1 bg-white/10 hover:bg-purple-600 rounded-full text-xs font-bold transition-colors">
                  {g.name}
                </Link>
              ))}
            </div>

            {show.overview && (
              <div className="mb-4">
                <p className={`text-gray-300 text-sm leading-relaxed ${!showFullOverview ? 'line-clamp-4' : ''}`}>
                  {show.overview}
                </p>
                {show.overview.length > 200 && (
                  <button onClick={() => setShowFullOverview(!showFullOverview)}
                    className="text-blue-400 text-xs mt-1 flex items-center gap-1 hover:text-blue-300">
                    {showFullOverview ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
                  </button>
                )}
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm border border-white/10">
              {show.created_by?.length ? <div><span className="text-gray-400 block text-xs">Created By</span><span className="font-medium">{show.created_by.map(c => c.name).join(', ')}</span></div> : null}
              {show.networks?.length ? <div><span className="text-gray-400 block text-xs">Network</span><span className="font-medium">{show.networks[0].name}</span></div> : null}
              {show.origin_country?.length ? <div><span className="text-gray-400 block text-xs">Country</span><span className="font-medium">{show.origin_country.join(', ')}</span></div> : null}
              {show.first_air_date && <div><span className="text-gray-400 block text-xs">First Aired</span><span className="font-medium">{show.first_air_date}</span></div>}
              {show.last_air_date && <div><span className="text-gray-400 block text-xs">Last Aired</span><span className="font-medium">{show.last_air_date}</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Seasons & Episodes */}
      {seasons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-purple-500" /> Episodes
          </h2>
          {/* Season tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {seasons.map(s => (
              <button key={s.season_number}
                onClick={() => setSelectedSeason(s.season_number)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedSeason === s.season_number ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {s.name || `Season ${s.season_number}`}
                <span className="ml-1 text-xs opacity-70">({s.episode_count})</span>
              </button>
            ))}
          </div>

          {/* Episodes for selected season */}
          <EpisodeList tvId={id!} seasonNumber={selectedSeason} showName={show.name} />
        </div>
      )}

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

      {/* Images gallery */}
      {(show.images?.backdrops || []).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">Images</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(show.images?.backdrops || []).slice(0, 10).map((img, i) => (
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
            {similar.map(s => (
              <ShowCard key={s.id} id={String(s.id)} title={s.name || s.original_name}
                image={posterUrl(s.poster_path)} type="tv"
                year={s.first_air_date?.slice(0,4)}
                rating={s.vote_average ? s.vote_average.toFixed(1) : undefined}
                linkPrefix="/tv" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
