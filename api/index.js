// Vercel serverless entry point - wraps the Express app
import 'dotenv/config';
import app from '../dist/server/index.js';

export default app;
