# StreamVault — Vercel Deployment Guide

## Why it failed before
The old `vercel.json` was sending ALL requests (including `/api/...`) to `index.html`.
This is now fixed — API calls go to the Express server, page requests go to React.

## Environment Variables to set in Vercel Dashboard

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add ALL of these:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://zu7hunter_db_user:JsdLCIMSz41WHNbE@streamvault.dcekvnc.mongodb.net/?appName=streamvault` |
| `MONGODB_DB` | `streamvault` |
| `JWT_SECRET` | `streamvault_super_secret_jwt_key_2026` |
| `TMDB_API_KEY` | `004fbc43b2d09ad149ed78443d237382` |
| `VITE_SITE_URL` | `https://YOUR-PROJECT.vercel.app` (your actual URL) |
| `SITE_URL` | `https://YOUR-PROJECT.vercel.app` (your actual URL) |
| `CORS_ORIGINS` | `https://YOUR-PROJECT.vercel.app` (your actual URL) |
| `NODE_ENV` | `production` |

## Deploy Steps

1. Push this project to GitHub
2. Go to vercel.com → Add New Project → Import your GitHub repo
3. Set all environment variables above
4. Click Deploy

## Also required: MongoDB Network Access
In MongoDB Atlas → Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)
