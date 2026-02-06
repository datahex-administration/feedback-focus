import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db('foodcity_feedback');
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export async function closeDB() {
  await client.close();
}
