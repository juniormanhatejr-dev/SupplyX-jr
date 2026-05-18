import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import fs from 'fs';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase Admin
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;

if (!storageBucket) {
  console.error('[SERVER] FATAL: Firebase Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET in secrets.');
  // We don't throw yet to allow other parts of the server (like Vite) to maybe work if they don't need storage
}

if (!admin.apps.length) {
  console.log(`[SERVER] Initializing Firebase Admin for project: ${firebaseConfig.projectId}`);
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: storageBucket
  });
}

const storage = admin.storage();
const bucket = storage.bucket(storageBucket);

console.log(`[SERVER] Using Firebase bucket: ${storageBucket || 'UNDEFINED'}`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Performance improvements
  app.use(compression());

  // Use multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // API Proxy for Uploads (Bypass CORS)
  app.post('/api/upload', upload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const destination = req.body.path;

      if (!storageBucket) {
        throw new Error('Firebase Storage bucket is not configured.');
      }

      if (!file || !destination) {
        return res.status(400).json({ error: 'Missing file or path' });
      }

      console.log(`[SERVER] Uploading: ${destination} to bucket: ${storageBucket}`);

      const fileRef = bucket.file(destination);
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
        resumable: false,
      });

      const encodedPath = encodeURIComponent(destination);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media`;

      console.log(`[SERVER] Upload success: ${publicUrl}`);
      res.json({ url: publicUrl });
    } catch (error: any) {
      console.error('[SERVER] Upload failed:', error.message);
      res.status(500).json({ 
        error: error.message || 'Error saving file to Storage'
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Cache static assets (images, fonts) for a year
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      index: false
    }));

    app.get('*', (req, res) => {
      res.set('Cache-Control', 'no-store'); // Index.html should never be cached
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Critical Startup Error:', err);
});
