import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import fs from 'fs';
import compression from 'compression';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase Admin
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;

if (!storageBucket) {
  console.error('[SERVER] FATAL: Firebase Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET in secrets.');
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

let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[SERVER] Warning: GEMINI_API_KEY is not defined.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON request bodies
  app.use(express.json());

  // Performance improvements
  app.use(compression());

  // Use multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

// AI Classification API
  app.post('/api/products/classify', async (req, res) => {
    const { productName, description } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'productName is required' });
    }

    try {
      console.log(`[SERVER] Classifying product: "${productName}"`);
      const client = getGeminiClient();
      const prompt = `
        Você é um arquiteto de software moçambicano especializado em materiais de construção.
        Analise o seguinte produto e forneça uma classificação técnica e em português de Moçambique.
        
        Produto: "${productName}"
        Descrição: "${description || ''}"
        
        Retorne um objeto exatamente no formato JSON especificado.
        A categoria DEVE ser uma destas 6 e exatamente escrita assim:
        - Estrutural
        - Básicos
        - Acabamento
        - Hidráulica
        - Elétrica
        - Ferramentas
        
        A subcategoria representa a classificação menor correspondente (ex: Aço, Cimento, Tubulação, Manuais, Pintura, etc).
        Forneça também tags e sinônimos adequados ao mercado de Moçambique.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              normalizedName: { type: Type.STRING }
            },
            required: ["category", "subcategory", "tags", "synonyms", "normalizedName"]
          }
        }
      });

      const text = response.text || '';
      const result = JSON.parse(text.trim());
      console.log(`[SERVER] Classification result:`, result);
      res.json(result);
    } catch (error: any) {
      console.warn('[SERVER] Gemini classification failed, engaging smart local rule-based fallback:', error.message || error);
      
      // Let's run a robust Mozambican construction industry expert pattern matching fallback
      const nameLower = productName.toLowerCase();
      const descLower = (description || '').toLowerCase();
      const combined = `${nameLower} ${descLower}`;

      let category = 'Básicos';
      let subcategory = 'Geral';
      let tags: string[] = [];
      let synonyms: string[] = [];
      let normalizedName = productName;

      // 1. Hidráulica
      if (
        combined.includes('tubo') || combined.includes('cano') || combined.includes('pvc') || 
        combined.includes('torneira') || combined.includes('sifao') || combined.includes('sifão') || 
        combined.includes('joelho') || combined.includes('curva') || combined.includes('valvula') || 
        combined.includes('chuveiro') || combined.includes('sanita') || combined.includes('lavatorio') || 
        combined.includes('pia') || combined.includes('autoclismo') || combined.includes('registro') ||
        combined.includes('flange') || combined.includes('tê ') || combined.includes('adesivo pvc')
      ) {
        category = 'Hidráulica';
        if (combined.includes('tubo') || combined.includes('cano') || combined.includes('pvc')) {
          subcategory = 'Tubulações e Conexões';
          tags = ['pvc', 'tubo', 'cano', 'hidraulica', 'agua'];
          synonyms = ['Tubo de PVC', 'Cano de água', 'Conduto hidráulico'];
        } else if (combined.includes('torneira') || combined.includes('chuveiro')) {
          subcategory = 'Metais e Torneiras';
          tags = ['torneira', 'chuveiro', 'metais', 'casa de banho'];
          synonyms = ['Bica', 'Misturador', 'Chuveiro de banho'];
        } else {
          subcategory = 'Acessórios Hidráulicos';
          tags = ['conexao', 'sifao', 'acessorio', 'hidraulico'];
          synonyms = ['Conexão de água', 'Peça de encanamento'];
        }
      }
      // 2. Elétrica
      else if (
        combined.includes('fio') || combined.includes('cabo') || combined.includes('disjuntor') || 
        combined.includes('tomada') || combined.includes('interruptor') || combined.includes('lampada') || 
        combined.includes('lâmpada') || combined.includes('led') || combined.includes('tubo vd') || 
        combined.includes('fitas isoladora') || combined.includes('fita isoladora') || 
        combined.includes('quadro electrico') || combined.includes('quadro elétrico') || 
        combined.includes('coaxial') || combined.includes('canaleta')
      ) {
        category = 'Elétrica';
        if (combined.includes('fio') || combined.includes('cabo')) {
          subcategory = 'Fios e Cabos';
          tags = ['fio', 'cabo', 'cobre', 'eletricidade', 'energia'];
          synonyms = ['Cabo elétrico', 'Fio de cobre', 'Condutor elétrico'];
        } else if (combined.includes('lampada') || combined.includes('lâmpada') || combined.includes('led')) {
          subcategory = 'Iluminação';
          tags = ['lampada', 'led', 'iluminacao', 'luz'];
          synonyms = ['Foco LED', 'Lâmpada florescente', 'Luminária'];
        } else {
          subcategory = 'Dispositivos e Interruptores';
          tags = ['tomada', 'interruptor', 'disjuntor', 'eletrica'];
          synonyms = ['Espelho de tomada', 'Comutador', 'Chave disjuntora'];
        }
      }
      // 3. Estrutural
      else if (
        combined.includes('varao') || combined.includes('varão') || combined.includes('ferro') || 
        combined.includes('viga') || combined.includes('pilar') || combined.includes('sapata') || 
        combined.includes('malha solgel') || combined.includes('malha') || combined.includes('aço') || 
        combined.includes('aco') || combined.includes('perfil') || combined.includes('treliça')
      ) {
        category = 'Estrutural';
        subcategory = 'Ferro e Aço';
        tags = ['varao', 'aço', 'estrutural', 'obra', 'armadura'];
        synonyms = ['Ferro de construção', 'Varão de aço', 'Armadura de ferro'];
      }
      // 4. Acabamento
      else if (
        combined.includes('azulejo') || combined.includes('ceramica') || combined.includes('cerâmica') || 
        combined.includes('porcelanato') || combined.includes('tinta') || combined.includes('verniz') || 
        combined.includes('trincha') || combined.includes('pincel') || combined.includes('rolo') || 
        combined.includes('silicone') || combined.includes('fechadura') || combined.includes('porta') || 
        combined.includes('janela') || combined.includes('rodapé') || combined.includes('massa corrida')
      ) {
        category = 'Acabamento';
        if (combined.includes('tinta') || combined.includes('verniz') || combined.includes('trincha') || combined.includes('pincel') || combined.includes('rolo')) {
          subcategory = 'Pintura';
          tags = ['tinta', 'pintura', 'verniz', 'cor', 'acabamento'];
          synonyms = ['Tinta acrílica', 'Esmalte sintético', 'Corante para parede'];
        } else if (combined.includes('azulejo') || combined.includes('ceramica') || combined.includes('cerâmica') || combined.includes('porcelanato')) {
          subcategory = 'Pisos e Revestimentos';
          tags = ['azulejo', 'ceramica', 'piso', 'porcelanato', 'chao'];
          synonyms = ['Ladrilho', 'Revestimento cerâmico', 'Mosaico'];
        } else {
          subcategory = 'Esquadrias e Ferragens';
          tags = ['fechadura', 'porta', 'janela', 'hardware'];
          synonyms = ['Fechadura de porta', 'Caixilho de janela', 'Puxador'];
        }
      }
      // 5. Ferramentas
      else if (
        combined.includes('martelo') || combined.includes('pá') || combined.includes('pa ') || 
        combined.includes('picareta') || combined.includes('colher de pedreiro') || 
        combined.includes('nivel') || combined.includes('nível') || combined.includes('furadeira') || 
        combined.includes('disco de corte') || combined.includes('andaime') || combined.includes('luvas') || 
        combined.includes('capacete') || combined.includes('bota') || combined.includes('chave fenda') ||
        combined.includes('chave de fenda') || combined.includes('serrote') || combined.includes('trena')
      ) {
        category = 'Ferramentas';
        if (combined.includes('luvas') || combined.includes('capacete') || combined.includes('bota')) {
          subcategory = 'Equipamento de Proteção (EPI)';
          tags = ['epi', 'segurança', 'proteção', 'luvas', 'capacete'];
          synonyms = ['Equipamento de segurança', 'Proteção individual'];
        } else {
          subcategory = 'Manuais e Eléctricas';
          tags = ['ferramenta', 'martelo', 'chavefenda', 'equipamento'];
          synonyms = ['Ferramenta de pedreiro', 'Utensílio de obra'];
        }
      }
      // 6. Básicos (default/cimento/areia/bloco/argamassa)
      else {
        category = 'Básicos';
        if (combined.includes('cimento')) {
          subcategory = 'Cimento';
          tags = ['cimento', 'obra', 'construcao', 'massa'];
          synonyms = ['Cimento Portland', 'Ligante hidráulico'];
        } else if (combined.includes('areia') || combined.includes('brita') || combined.includes('pedra')) {
          subcategory = 'Agregados';
          tags = ['areia', 'brita', 'agregados', 'pedra'];
          synonyms = ['Areia fina', 'Pedra britada', 'Areia grossa'];
        } else if (combined.includes('tijolo') || combined.includes('bloco')) {
          subcategory = 'Blocos e Tijolos';
          tags = ['tijolo', 'bloco', 'alvenaria', 'parede'];
          synonyms = ['Bloco de cimento', 'Tijolo cozido', 'Tijolo burro'];
        } else if (combined.includes('gesso') || combined.includes('pladur')) {
          subcategory = 'Gesso e Divisórias';
          tags = ['gesso', 'pladur', 'teto', 'divisoria'];
          synonyms = ['Placa de gesso', 'Drywall'];
        } else {
          subcategory = 'Geral';
          tags = ['material', 'basico', 'construcao'];
          synonyms = ['Material de base', 'Insumo de obra'];
        }
      }

      const fallbackResult = {
        category,
        subcategory,
        tags,
        synonyms,
        normalizedName: productName.charAt(0).toUpperCase() + productName.slice(1)
      };

      console.log('[SERVER] Fallback classification result:', fallbackResult);
      res.json(fallbackResult);
    }
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
