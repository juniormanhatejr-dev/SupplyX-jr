import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase Admin
// Note: In Cloud Run/AI Studio, we use default credentials if available, 
// otherwise we can initialize with basic config. For Storage without service account,
// we might need specific credentials, but often the default environment ones work.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
}

const storage = admin.storage();
const bucket = storage.bucket();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // API Proxy for Uploads (Bypass CORS)
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const destination = req.body.path;

      if (!file || !destination) {
        return res.status(400).json({ error: 'Missing file or path' });
      }

      console.log(`[SERVER] Proxy upload request for: ${destination}`);

      const fileRef = bucket.file(destination);
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
        public: true, // Make it public if your rules allow or if you want easy access
      });

      // Get public URL
      // Note: getDownloadURL in Admin SDK is different. We can construct it or use signing.
      // Constructing standard Firebase Storage URL:
      // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[PATH]?alt=media
      const encodedPath = encodeURIComponent(destination);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodedPath}?alt=media`;

      console.log(`[SERVER] Upload successful: ${publicUrl}`);
      res.json({ url: publicUrl });
    } catch (error: any) {
      console.error('[SERVER] Upload error:', error);
      res.status(500).json({ error: error.message });
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
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
