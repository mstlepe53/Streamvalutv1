/**
 * Home Page - TMDB Edition
 * Trending, Popular, Top Rated for both Movies and TV
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Info, Star, Flame, TrendingUp, Film, Tv, Clock, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useHomeQuery } from '../hooks/useQueries';
import { FALLBACK_IMAGE, backdropUrl, posterUrl, ShowItem, HomeData } from '../services/tmdb';
import ShowCard from '../components/ShowCard';
import { SkeletonShowCard } from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import DailyRewardPopup from '../components/DailyRewardPopup';
import { useAuth } from '../context/AuthContext';

const WATCH_HISTORY_KEY = 'tmdb_watch_history';
const HERO_INTERVAL = 6000;

type MediaTab = 'movie' | 'tv';
type SectionTab = 'trending' | 'popular' | 'top_rated';

function getWatchHistory() {
  try { return JSON.parse(localStorage.getItem(WATCH_HISTORY_KEY) || '[]'); } catch { return []; }
}

function HeroSection({ items, type }: { items: ShowItem[]; type: MediaTab }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % Math.min(items.length, 8)), HERO_INTERVAL);
  };

  useEffect(() => { startTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [items.length]);

  if (!items.length) return null;
  const item = items[Math.min(idx, items.length - 1)];

  const handlePrev = () => { setIdx(i => (i - 1 + items.length) % items.length); startTimer(); };
  const handleNext = () => { setIdx(i => (i + 1) % items.length); startTimer(); };

  // Use backdrop for hero - we need a different image source
  // ShowItem only has poster; for hero we just use a large poster
  const heroImg = item.image.replace('/w500/', '/w1280/');

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900 min-h-[340px] md:min-h-[480px]">
      <img
        key={item.id}
        src={heroImg}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-700"
        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

      <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row gap-6 items-center md:items-end h-full min-h-[340px] md:min-h-[480px]">
        <img
          src={item.image}
          alt={item.title}
          className="w-28 md:w-44 aspect-[2/3] object-cover rounded-xl shadow-2xl border-2 border-white/10 shrink-0 hidden sm:block"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        />
        <div className="flex-1 text-white pb-2">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${type === 'movie' ? 'bg-blue-600' : 'bg-purple-600'}`}>
              {type === 'movie' ? 'MOVIE' : 'TV SHOW'}
            </span>
            {item.year && <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/10">{item.year}</span>}
            {item.rating && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-yellow-500/20 text-yellow-400">
                <Star className="w-3 h-3 fill-current" /> {item.rating}
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-4xl font-black mb-4 drop-shadow-md line-clamp-2">{item.title}</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to={type === 'movie' ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}/1/1`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Watch Now
            </Link>
            <Link
              to={`/${type}/${item.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white rounded-lg font-bold hover:bg-white/25 active:scale-95 transition-all backdrop-blur-sm"
            >
              <Info className="w-4 h-4" /> Details
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {items.slice(0, 8).map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); startTimer(); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}

function SectionRow({ title, items, loading, linkPrefix, icon }: {
  title: string; items?: ShowItem[]; loading: boolean; linkPrefix: string; icon: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">{icon}{title}</h2>
        <Link to={linkPrefix} className="text-sm text-blue-500 hover:underline">See all</Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonShowCard key={i} />)
          : (items || []).slice(0, 8).map(item => (
            <ShowCard
              key={item.id}
              id={item.id}
              title={item.title}
              image={item.image}
              type={item.type}
              year={item.year}
              rating={item.rating}
              episode={item.episode}
              linkPrefix={`/${item.type}`}
            />
          ))
        }
      </div>
    </div>
  );
}

export default function Home() {
  const { data, isPending: loading } = useHomeQuery();
  const { user } = useAuth();
  const [heroTab, setHeroTab] = useState<MediaTab>('movie');
  const [sectionTab, setSectionTab] = useState<SectionTab>('trending');
  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  useEffect(() => {
    setWatchHistory(getWatchHistory());
    const handler = () => setWatchHistory(getWatchHistory());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const heroItems = heroTab === 'movie' ? (data?.trendingMovies || []) : (data?.trendingTV || []);

  const sectionMovies = sectionTab === 'trending' ? data?.trendingMovies
    : sectionTab === 'popular' ? data?.popularMovies
    : data?.topRatedMovies;

  const sectionTV = sectionTab === 'trending' ? data?.trendingTV
    : sectionTab === 'popular' ? data?.popularTV
    : data?.topRatedTV;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-10">
      <SEOHead
        title="StreamVault – Watch Movies & TV Shows Online Free"
        description="Stream the latest movies and TV shows online free in HD. Browse thousands of titles from TMDB. No subscription needed."
        keywords="watch movies online free, stream tv shows, free streaming, hd movies, latest tv series"
      />
      {user && <DailyRewardPopup />}

      {/* Hero */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setHeroTab('movie')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${heroTab === 'movie' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            <Film className="w-4 h-4" /> Movies
          </button>
          <button onClick={() => setHeroTab('tv')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${heroTab === 'tv' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            <Tv className="w-4 h-4" /> TV Shows
          </button>
        </div>
        {loading ? (
          <div className="w-full rounded-2xl bg-gray-800 animate-pulse min-h-[340px] md:min-h-[480px]" />
        ) : (
          <HeroSection items={heroItems} type={heroTab} />
        )}
      </div>

      {/* Watch History */}
      {watchHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Continue Watching
            </h2>
            <button onClick={() => { localStorage.removeItem(WATCH_HISTORY_KEY); setWatchHistory([]); }}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors">Clear all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {watchHistory.slice(0, 10).map((item: any) => (
              <Link key={item.url} to={item.url}
                className="group shrink-0 w-32 flex flex-col gap-1">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                  <img src={item.image || FALLBACK_IMAGE} alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div className="h-full bg-blue-500" style={{ width: '30%' }} />
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.title}</p>
                {item.subtitle && <p className="text-[10px] text-gray-500">{item.subtitle}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Genres quick access */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Browse Genres</h2>
          <Link to="/genres" className="text-sm text-blue-500 hover:underline">All genres</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data?.movieGenres || []).slice(0, 12).map(g => (
            <Link key={g.id} to={`/genre/movie/${g.id}`}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full text-sm font-medium transition-colors">
              {g.name}
            </Link>
          ))}
          {(data?.tvGenres || []).slice(0, 6).map(g => (
            <Link key={g.id} to={`/genre/tv/${g.id}`}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-full text-sm font-medium transition-colors">
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main sections with tabs */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center">
          {(['trending', 'popular', 'top_rated'] as SectionTab[]).map(t => (
            <button key={t} onClick={() => setSectionTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors capitalize ${sectionTab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {t === 'top_rated' ? 'Top Rated' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <SectionRow
          title="Movies"
          items={sectionMovies}
          loading={loading}
          linkPrefix={sectionTab === 'trending' ? '/trending-movies' : sectionTab === 'popular' ? '/popular-movies' : '/top-rated-movies'}
          icon={<Film className="w-5 h-5 text-blue-500" />}
        />

        <SectionRow
          title="TV Shows"
          items={sectionTV}
          loading={loading}
          linkPrefix={sectionTab === 'trending' ? '/trending-tv' : sectionTab === 'popular' ? '/popular-tv' : '/top-rated-tv'}
          icon={<Tv className="w-5 h-5 text-purple-500" />}
        />
      </div>

      {/* Now Playing / On Air */}
      <SectionRow
        title="Now Playing in Theaters"
        items={data?.nowPlayingMovies}
        loading={loading}
        linkPrefix="/now-playing"
        icon={<Flame className="w-5 h-5 text-orange-500" />}
      />
      <SectionRow
        title="Currently On Air"
        items={data?.onAirTV}
        loading={loading}
        linkPrefix="/on-air"
        icon={<TrendingUp className="w-5 h-5 text-green-500" />}
      />
    </div>
  );
}
