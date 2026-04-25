/**
 * Main application routing - TMDB Edition
 * Movies: /movie/:id  |  TV: /tv/:id  |  Watch: /watch/movie/:id  or  /watch/tv/:id/:season/:episode
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const MovieDetails = lazy(() => import('./pages/MovieDetails'));
const TVDetails = lazy(() => import('./pages/TVDetails'));
const WatchMovie = lazy(() => import('./pages/WatchMovie'));
const WatchTV = lazy(() => import('./pages/WatchTV'));
const Listing = lazy(() => import('./pages/Listing'));
const Search = lazy(() => import('./pages/Search'));
const GenresHub = lazy(() => import('./pages/GenresHub'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Lazy><Home /></Lazy>} />

          {/* Detail pages */}
          <Route path="movie/:id" element={<Lazy><MovieDetails /></Lazy>} />
          <Route path="tv/:id" element={<Lazy><TVDetails /></Lazy>} />

          {/* Watch pages */}
          <Route path="watch/movie/:id" element={
            <ErrorBoundary><Lazy><WatchMovie /></Lazy></ErrorBoundary>
          } />
          <Route path="watch/tv/:id/:season/:episode" element={
            <ErrorBoundary><Lazy><WatchTV /></Lazy></ErrorBoundary>
          } />

          {/* Listing pages */}
          <Route path="popular-movies" element={<Lazy><Listing type="popular-movies" /></Lazy>} />
          <Route path="popular-tv" element={<Lazy><Listing type="popular-tv" /></Lazy>} />
          <Route path="top-rated-movies" element={<Lazy><Listing type="top-rated-movies" /></Lazy>} />
          <Route path="top-rated-tv" element={<Lazy><Listing type="top-rated-tv" /></Lazy>} />
          <Route path="now-playing" element={<Lazy><Listing type="now-playing" /></Lazy>} />
          <Route path="on-air" element={<Lazy><Listing type="on-air" /></Lazy>} />
          <Route path="upcoming" element={<Lazy><Listing type="upcoming" /></Lazy>} />
          <Route path="trending-movies" element={<Lazy><Listing type="trending-movies" /></Lazy>} />
          <Route path="trending-tv" element={<Lazy><Listing type="trending-tv" /></Lazy>} />

          {/* Genre pages */}
          <Route path="genres" element={<Lazy><GenresHub /></Lazy>} />
          <Route path="genre/movie/:slug" element={<Lazy><Listing type="movie-genre" /></Lazy>} />
          <Route path="genre/tv/:slug" element={<Lazy><Listing type="tv-genre" /></Lazy>} />

          {/* Search */}
          <Route path="search" element={<Lazy><Search /></Lazy>} />

          {/* Auth */}
          <Route path="login" element={<Lazy><Login /></Lazy>} />
          <Route path="signup" element={<Lazy><Signup /></Lazy>} />

          {/* User */}
          <Route path="dashboard" element={<Lazy><ProtectedRoute><Dashboard /></ProtectedRoute></Lazy>} />
          <Route path="profile" element={<Lazy><ProtectedRoute><Profile /></ProtectedRoute></Lazy>} />
          <Route path="user/:username" element={<Lazy><PublicProfile /></Lazy>} />
          <Route path="leaderboard" element={<Lazy><Leaderboard /></Lazy>} />

          <Route path="*" element={<Lazy><NotFound /></Lazy>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
