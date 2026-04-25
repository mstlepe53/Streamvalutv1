# StreamVault – TMDB Edition

A full-featured movie & TV streaming website powered by [TMDB](https://www.themoviedb.org/).

## Features
- 🎬 Movies & TV Shows with full TMDB metadata
- 🔍 Search across movies and TV shows
- 🎭 Genre browsing for both movies and TV
- 📺 Episode list per season with all info
- ▶️ VidNest embed player
  - Movies: `https://vidnest.fun/movie/[TMDB_ID]`
  - TV:     `https://vidnest.fun/tv/[TMDB_ID]/[SEASON]/[EPISODE]`
- ⭐ Ratings, cast, images, trailers
- 💾 Watch history (localStorage)
- 🌗 Dark / Light mode
- 🤖 SSR meta tags for bots/crawlers (SEO)
- 👤 User auth (favorites, watchlist, comments)

## Quick Deploy to Vercel

1. Push this folder to a GitHub repository
2. Import the repo in [Vercel](https://vercel.com)
3. Set Environment Variables in Vercel dashboard:
   ```
   MONGODB_URI      = your MongoDB connection string
   JWT_SECRET       = any random long string
   SITE_URL         = https://your-project.vercel.app
   CORS_ORIGINS     = https://your-project.vercel.app
   ```
4. Click **Deploy** — done!

## Local Development

```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # starts Express + Vite HMR on :5000
```

## Build

```bash
npm run build   # builds Vite SPA + compiles server TS
npm start       # runs production server
```

## TMDB API Key
Already embedded: `004fbc43b2d09ad149ed78443d237382`  
You can replace it in `src/services/tmdb.ts` → `TMDB_API_KEY`.

## Embed URLs
| Type  | URL Pattern |
|-------|-------------|
| Movie | `https://vidnest.fun/movie/{tmdb_id}` |
| TV    | `https://vidnest.fun/tv/{tmdb_id}/{season}/{episode}` |
