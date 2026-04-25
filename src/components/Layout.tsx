/**
 * Layout Component — Phase 7 Enhanced
 *
 * Main layout wrapper for the entire application.
 * Includes:
 * - Header with logo, navigation, search, and theme toggle
 * - Search functionality with autocomplete suggestions + recent/trending chips
 * - Dark/light theme management
 * - Mobile‑responsive navigation and search overlay
 * - PWA install prompt
 * - Outlet for rendering child routes
 *
 * Phase 7: Search suggestions now show recent searches + trending queries
 * when the input is focused but empty.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, User, MessageSquare, Menu, Moon, Sun, Monitor, X, Clock, Flame, LogOut } from 'lucide-react';
import { searchMulti, FALLBACK_IMAGE } from '../services/tmdb';
import {
  trackSearchQuery,
  getSearchHistory,
  getTrendingSearches,
} from '../services/searchIntelligenceApi';
import Logo from './Logo';
import InstallPrompt from './InstallPrompt';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../constants/avatars';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Layout() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('streamvault_dark') === 'true';
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ title: string; id: string; image: string; type?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Phase 7: recent + trending for empty-state dropdown
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [intelligenceLoaded, setIntelligenceLoaded] = useState(false);

  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(searchQuery, 400);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('streamvault_dark', String(isDarkMode));
  }, [isDarkMode]);

  // Load search intelligence data when focused
  const loadSearchIntelligence = useCallback(async () => {
    if (intelligenceLoaded) return;
    setIntelligenceLoaded(true);
    const [trending, recent] = await Promise.all([
      getTrendingSearches(),
      token ? getSearchHistory(token) : Promise.resolve([]),
    ]);
    setTrendingSearches(trending);
    setRecentSearches(recent);
  }, [intelligenceLoaded, token]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSuggestions([]); return; }
    let cancelled = false;
    setSuggestionsLoading(true);
    searchMulti(debouncedQuery)
      .then(data => {
        if (!cancelled) { setSuggestions(data.slice(0, 6)); setSuggestionsLoading(false); }
      })
      .catch(() => { if (!cancelled) { setSuggestionsLoading(false); } });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('[data-mobile-menu]')) return;
      setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSearchOpen(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSearchOpen]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const trimmed = searchQuery.trim();
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setShowSuggestions(false);
      setMobileSearchOpen(false);
      trackSearchQuery(trimmed, token);
    }
  }, [searchQuery, navigate, token]);

  const handleSuggestionClick = useCallback((id: string, type?: string, title?: string) => {
    navigate(`/${type || 'movie'}/${id}`);
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    if (title) trackSearchQuery(title, token);
  }, [navigate, token]);

  const handleChipClick = useCallback((query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    trackSearchQuery(query, token);
  }, [navigate, token]);

  const openMobileSearch = useCallback(() => {
    setMobileSearchOpen(true);
    setMobileMenuOpen(false);
    setShowSuggestions(false);
    loadSearchIntelligence();
  }, [loadSearchIntelligence]);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const handleFocus = useCallback(() => {
    if (searchQuery) setShowSuggestions(true);
    else {
      setShowSuggestions(true);
      loadSearchIntelligence();
    }
  }, [searchQuery, loadSearchIntelligence]);

  /* Whether to show the empty-state intelligence panel */
  const showIntelligencePanel = !searchQuery.trim() && (recentSearches.length > 0 || trendingSearches.length > 0);

  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans flex flex-col transition-colors duration-200 overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-[100] bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/50 h-16 flex items-center px-4 md:px-6 justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Menu"
            data-mobile-menu
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo />
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={handleFocus}
              placeholder="Search Drama"
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-md py-2 pl-10 pr-24 focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-gray-200 dark:placeholder-gray-500 transition-colors"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
              <button type="submit" className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Desktop Suggestions Dropdown */}
          {showSuggestions && createPortal(
            <div
              className="fixed bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[1000] max-h-96 overflow-y-auto"
              style={{
                top: searchRef.current ? searchRef.current.getBoundingClientRect().bottom + 4 : 64,
                left: searchRef.current ? searchRef.current.getBoundingClientRect().left : 16,
                width: searchRef.current ? searchRef.current.getBoundingClientRect().width : 'min(42rem, calc(100vw - 2rem))',
              }}
            >
              {/* Typed query → show drama suggestions */}
              {searchQuery.trim() && (
                suggestionsLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No results found</div>
                ) : (
                  <>
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        onMouseDown={() => handleSuggestionClick(s.id, s.type, s.title)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <img
                          src={s.image || FALLBACK_IMAGE}
                          alt={s.title}
                          className="w-9 h-12 object-cover rounded shrink-0 bg-gray-200 dark:bg-gray-700"
                          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{s.title}</span>
                      </button>
                    ))}
                    <button
                      onMouseDown={() => { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); setShowSuggestions(false); trackSearchQuery(searchQuery, token); }}
                      className="w-full p-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium border-t border-gray-100 dark:border-gray-800 transition-colors"
                    >
                      See all results for "{searchQuery}"
                    </button>
                  </>
                )
              )}

              {/* Empty state intelligence: recent + trending */}
              {showIntelligencePanel && !searchQuery.trim() && (
                <div className="p-3 space-y-4">
                  {recentSearches.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Recent
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.slice(0, 5).map(s => (
                          <button
                            key={s}
                            onMouseDown={() => handleChipClick(s)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <Clock className="w-3 h-3 text-gray-400" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {trendingSearches.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" /> Trending
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {trendingSearches.slice(0, 6).map(s => (
                          <button
                            key={s}
                            onMouseDown={() => handleChipClick(s)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-100 dark:border-orange-900/40 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <Flame className="w-3 h-3 text-orange-400" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>,
            document.body,
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Button */}
          <button
            onClick={openMobileSearch}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {token ? (
            <NotificationBell token={token} />
          ) : (
            <button className="hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </button>
          )}
          {user ? (
            <div className="relative flex items-center gap-1" data-mobile-menu>
              <Link to="/profile" className="hidden sm:flex items-center gap-2 rounded-full bg-gray-200 dark:bg-gray-800 pl-1 pr-3 py-1 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-7 h-7 rounded-full object-cover bg-white" />
                {user.username}
              </Link>
              <Link to="/profile" className="sm:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full bg-gray-200 dark:bg-gray-800 transition-colors" aria-label="Profile">
                <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-7 h-7 rounded-full object-cover bg-white" />
              </Link>
            </div>
          ) : (
            <Link to="/login" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors" aria-label="Log in">
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[90] md:hidden"
          data-mobile-menu
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl animate-slide-up" data-mobile-menu>
            <div className="px-4 py-3 space-y-1">
              {[
                { to: '/trending-movies', label: 'Trending' },
                { to: '/popular-movies', label: 'Movies' },
                { to: '/popular-tv', label: 'TV Shows' },
                { to: '/leaderboard', label: 'Leaderboard' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 space-y-1">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col md:hidden">
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(e as unknown as React.FormEvent); }}
                placeholder="Search movies, TV shows..."
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:placeholder-gray-500 transition-colors"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </form>
            <button
              onClick={closeMobileSearch}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 transition-colors shrink-0"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Results / Intelligence Panel */}
          <div className="flex-1 overflow-y-auto pb-6">
            {!searchQuery.trim() ? (
              /* Empty state: show recent + trending */
              <div className="p-4 space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Recent Searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(s => (
                        <button
                          key={s}
                          onClick={() => handleChipClick(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <Clock className="w-3 h-3 text-gray-400" />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {trendingSearches.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> Trending Now
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((s, i) => (
                        <button
                          key={s}
                          onClick={() => handleChipClick(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-100 dark:border-orange-900/40 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <span className="text-xs font-bold text-orange-400">#{i + 1}</span>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {recentSearches.length === 0 && trendingSearches.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 gap-2">
                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type to search...</p>
                  </div>
                )}
              </div>
            ) : suggestionsLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 animate-pulse">
                    <div className="w-10 h-14 rounded bg-gray-200 dark:bg-gray-800 shrink-0" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
                  </div>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">No results for "{searchQuery}"</p>
                <button
                  onClick={handleSearchSubmit as unknown as React.MouseEventHandler}
                  className="text-sm text-blue-600 dark:text-blue-400 font-medium"
                >
                  Search all results
                </button>
              </div>
            ) : (
              <>
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSuggestionClick(s.id, s.title)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 text-left"
                  >
                    <img
                      src={s.image || FALLBACK_IMAGE}
                      alt={s.title}
                      width={40}
                      height={56}
                      className="w-10 h-14 object-cover rounded shrink-0 bg-gray-200 dark:bg-gray-700"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{s.title}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setMobileSearchOpen(false);
                    trackSearchQuery(searchQuery, token);
                  }}
                  className="w-full p-4 text-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors"
                >
                  See all results for "{searchQuery}"
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow relative z-0">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12 py-6 px-4 md:px-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 shrink-0">
              <Logo size="lg" />
              <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-0.5">Free Movies &amp; TV Streaming</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              This website does not retain any files on its server. Rather, it solely provides links to media content hosted by third-party services.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-gray-600 dark:text-gray-400 font-medium">
            <Link to="/trending-movies" className="hover:text-gray-900 dark:hover:text-gray-200">Trending</Link>
            <Link to="/popular-movies" className="hover:text-gray-900 dark:hover:text-gray-200">Movies</Link>
            <Link to="/genres" className="hover:text-gray-900 dark:hover:text-gray-200">Genres</Link>
            <Link to="/popular-tv" className="hover:text-gray-900 dark:hover:text-gray-200">TV Shows</Link>
            <Link to="/search" className="hover:text-gray-900 dark:hover:text-gray-200">Search</Link>
            <Link to="/trending-tv" className="hover:text-gray-900 dark:hover:text-gray-200">Trending TV</Link>
            <Link to="/leaderboard" className="hover:text-gray-900 dark:hover:text-gray-200">Leaderboard</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            <span>© This Website Created With Love By StreamVault</span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">v2.0.0 TMDB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1">
              <button onClick={() => setIsDarkMode(false)} className={`p-1.5 rounded-md ${!isDarkMode ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-600 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}><Sun className="w-4 h-4" /></button>
              <button onClick={() => setIsDarkMode(true)} className={`p-1.5 rounded-md ${isDarkMode ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-600 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}><Moon className="w-4 h-4" /></button>
              <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Monitor className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </footer>

      <InstallPrompt />
    </div>
  );
}
