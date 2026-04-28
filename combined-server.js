// Combined server: imports the Express API app and adds static file serving
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

// Import the server's db module
const { connectDB, getDB } = await import('./server/db.js');

const app = express();
app.use(cors());
app.use(express.json());

await connectDB();

const placesCol = () => getDB().collection('places');
const feedbackCol = () => getDB().collection('feedback');
const adminSettingsCol = () => getDB().collection('admin_settings');

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// ─── PLACES ───
app.post('/api/places', async (req, res) => {
  try {
    const { name, name_ar, address, address_ar, questionnaire_type } = req.body;
    if (!name) return res.status(400).json({ error: 'Place name is required' });
    const slug = crypto.randomBytes(6).toString('hex');
    const place = { name, name_ar: name_ar || '', address: address || '', address_ar: address_ar || '', questionnaire_type: questionnaire_type || 'food', slug, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const docRef = await placesCol().add(place);
    res.status(201).json({ ...place, _id: docRef.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/places', async (req, res) => {
  try {
    const snapshot = await placesCol().orderBy('created_at', 'desc').get();
    const places = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    res.json(places);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/places/slug/:slug', async (req, res) => {
  try {
    const snapshot = await placesCol().where('slug', '==', req.params.slug).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: 'Place not found' });
    const doc = snapshot.docs[0];
    res.json({ _id: doc.id, ...doc.data() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Combined server running on port ${PORT}`);
});
