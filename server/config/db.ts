import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing database configuration: MONGODB_URI');
  }

  const dbName = process.env.MONGODB_DB || 'streamvault';

  try {
    await mongoose.connect(uri, { dbName });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Password contains unescaped characters')) {
      throw new Error('MONGODB_URI password must be URL-encoded');
    }
    throw error;
  }

  isConnected = true;
  console.log('[MongoDB] Connected to Atlas');

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[MongoDB] Disconnected');
  });
}

export function getConnectionError(): string | null {
  if (!process.env.MONGODB_URI) return 'Missing database configuration: MONGODB_URI';
  return null;
}
