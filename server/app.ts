import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import watchProgressRoutes from './routes/watchProgressRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import trendingRoutes from './routes/trendingRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import listRoutes from './routes/listRoutes.js';
import type { Request, Response, NextFunction } from 'express';

const app = express();

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',').map((o: string) => o.trim()).filter(Boolean),
);

app.disable('x-powered-by');
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) cb(null, true);
    else cb(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', watchProgressRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/lists', listRoutes);
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Something went wrong.';
  const safe = message.includes('Missing') ? message
    : message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') ? 'Database connection failed.'
    : 'Something went wrong. Please try again.';
  res.status(500).json({ message: safe });
});

let dbReady = false;

export default async function handler(req: Request, res: Response) {
  if (!dbReady) {
    try {
      await connectDB();
      dbReady = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'DB connection failed';
      res.status(503).json({ message: msg });
      return;
    }
  }
  return app(req, res);
}
