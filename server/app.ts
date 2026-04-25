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

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean),
);

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

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
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Something went wrong.';
  console.error('[ERROR]', message);
  const safeMessage = message.includes('Missing')
    ? message
    : message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('ENOTFOUND')
      ? 'Database connection failed. Check your MONGODB_URI connection string.'
      : 'Something went wrong. Please try again.';
  res.status(500).json({ message: safeMessage });
});

// Connect DB once (Vercel keeps the function warm between requests)
let dbConnected = false;
const originalHandler = app;

export default async function handler(req: express.Request, res: express.Response) {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      console.error('[MongoDB] Connection failed:', err instanceof Error ? err.message : err);
      res.status(503).json({ message: 'Database connection failed. Check your MONGODB_URI connection string.' });
      return;
    }
  }
  return originalHandler(req, res);
}
