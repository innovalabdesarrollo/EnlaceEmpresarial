import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDb() {
  if (!config.mongoUri) {
    throw new Error('Falta MONGODB_URI en .env (ver .env.example)');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log(`[api] MongoDB conectado → DB: ${mongoose.connection.name}`);
  return mongoose.connection;
}

export function mongoStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    db: mongoose.connection.name || null,
  };
}
