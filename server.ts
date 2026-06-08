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
        Você é um arquiteto moçambicano sênior especializado em engenharia civil e especificações de materiais de construção.
        Analise o produto fornecido a seguir e classifique-o tecnicamente de acordo com as práticas reais do mercado de construção de Moçambique.
        
        Produto: "${productName}"
        Descrição: "${description || ''}"
        
        Retorne um objeto exatamente no formato JSON especificado.
        
        A categoria DEVE ser uma destas 6 e escrita exatamente como abaixo:
        - Estrutural
        - Básicos
        - Acabamento
        - Hidráulica
        - Elétrica
        - Ferramentas
        
        Para a "subcategory", NÃO use termos genéricos como "Geral", "Outros" ou "Gerais". Identifique a tipologia específica do material.
        Siga estritamente estas diretrizes de agrupamento para definir a subcategoria:
        - Se a categoria for "Elétrica", use subcategorias como: "Fios e Cabos", "Iluminação", "Proteção e Distribuição", "Dispositivos e Interruptores", "Eletrodutos e Conexões".
        - Se a categoria for "Hidráulica", use subcategorias como: "Tubulações e Conexões", "Metais e Torneiras", "Louças e Sanitários", "Bombas e Reservatórios", "Acessórios Hidráulicos".
        - Se a categoria for "Estrutural", use subcategorias como: "Ferro e Aço", "Madeira e Cofragem", "Fixadores e Ferragens", "Estrutura Geral".
        - Se a categoria for "Acabamento", use subcategorias como: "Pintura", "Pisos e Revestimentos", "Portas, Janelas e Ferros", "Gesso e Divisórias".
        - Se a categoria for "Ferramentas", use subcategorias como: "Equipamento de Proteção (EPI)", "Ferramentas Elétricas", "Ferramentas Manuais".
        - Se a categoria for "Básicos", use subcategorias como: "Cimento", "Agregados", "Blocos e Tijolos", "Coberturas", "Argamassas".
        
        Tags e sinônimos devem refletir abreviações e jargões moçambicanos comuns de obra (ex: tubo VD, varão de ferro, sanita, betão, autoclismo, etc).
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
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      const result = JSON.parse(cleaned.trim());
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

      // Helpers to test matches
      const has = (...terms: string[]) => terms.some(term => combined.includes(term));

      // 1. Hidráulica
      if (
        has(
          'tubo', 'cano', 'pvc', 'torneira', 'sifao', 'sifão', 'joelho', 'curva', 'valvula', 'válvula',
          'chuveiro', 'sanita', 'lavatorio', 'lavatório', 'pia', 'autoclismo', 'registro', 'registo',
          'flange', 'tê ', 'adezivo', 'adesivo pvc', 'cola pvc', 'teflon', 'beda', 'vedante', 'ralo',
          'grelha', 'mictorio', 'mictório', 'bide', 'bidé', 'flexivel', 'flexível', 'mangueira', 'niple',
          'bomba d', 'bomba de agua', 'bomba de água', 'bomba hidráulica', 'bomba hidraulica', 'reservoir',
          'reservatorio', 'reservatório', 'tanque de agua', 'tanque de água', 'bacia', 'boia d', 'bóia'
        )
      ) {
        category = 'Hidráulica';
        if (has('tubo', 'cano', 'pvc', 'conexao', 'conexão', 'joelho', 'curva', 'tê', 'luva', 'uniao', 'união', 'niple', 'casquilho', 'flange')) {
          subcategory = 'Tubulações e Conexões';
          tags = ['pvc', 'tubo', 'cano', 'hidraulica', 'agua', 'conexão', 'conexões'];
          synonyms = ['Tubo de PVC', 'Cano de água', 'Conduto hidráulico', 'União PVC', 'Joelho hidráulico'];
        } else if (has('torneira', 'chuveiro', 'misturador', 'bica', 'registro', 'registo', 'valvula', 'válvula', 'ducha')) {
          subcategory = 'Metais e Torneiras';
          tags = ['torneira', 'chuveiro', 'metais', 'casa de banho', 'registro', 'válvula'];
          synonyms = ['Bica de água', 'Misturador', 'Chuveiro de banho', 'Registo de pressão', 'Torneira metálica'];
        } else if (has('sanita', 'bacia', 'lavatorio', 'lavatório', 'urinol', 'bide', 'bidé', 'pia', 'autoclismo')) {
          subcategory = 'Louças e Sanitários';
          tags = ['sanitario', 'louça', 'banheiro', 'casa de banho', 'sanita', 'lavatório'];
          synonyms = ['Vaso sanitário', 'Lavatório de casa de banho', 'Pia de lavar', 'Autoclismo sanitário'];
        } else if (has('bomba', 'tanque', 'deposito', 'depósito', 'boia', 'bóia', 'reservatório', 'reservatorio', 'pressurizador')) {
          subcategory = 'Bombas e Reservatórios';
          tags = ['bomba', 'deposito', 'reservatorio', 'agua', 'armazenamento'];
          synonyms = ['Bomba de água', 'Tanque de água', 'Depósito de água', 'Eletrobomba'];
        } else {
          subcategory = 'Acessórios Hidráulicos';
          tags = ['conexao', 'sifao', 'sifão', 'acessorio', 'hidraulico', 'teflon', 'vedante'];
          synonyms = ['Conexão de água', 'Peça de encanamento', 'Sifão hidráulico', 'Fita teflon'];
        }
      }
      // 2. Elétrica
      else if (
        has(
          'fio', 'cabo', 'disjuntor', 'tomada', 'interruptor', 'lampada', 'lâmpada', 'led', 'tubo vd', 'vd d',
          'fitas isoladora', 'fita isoladora', 'fita isolar', 'quadro electrico', 'quadro elétrico', 'quadro d',
          'coaxial', 'canaleta', 'soquete', 'bocal', 'calha', 'fusivel', 'fusível', 'refletor', 'projector',
          'projetor', 'painel led', 'bateria', 'gerador', 'eletroduto', 'conduite', 'conduíte', 'rele', 'relé',
          'módulo', 'modulo', 'interruptores', 'tomadas', 'campainha', 'porteiro', 'interfone', 'extensao', 'extensão'
        )
      ) {
        category = 'Elétrica';
        if (has('fio', 'cabo', 'cobre', 'coaxial', 'condutor')) {
          subcategory = 'Fios e Cabos';
          tags = ['fio', 'cabo', 'cobre', 'eletricidade', 'energia', 'condutor'];
          synonyms = ['Cabo elétrico', 'Fio de cobre', 'Condutor elétrico', 'Cabo flexível'];
        } else if (has('lampada', 'lâmpada', 'led', 'iluminacao', 'iluminação', 'luz', 'refletor', 'projector', 'projetor', 'painel led', 'foco', 'luminária', 'luminaria')) {
          subcategory = 'Iluminação';
          tags = ['lampada', 'led', 'iluminacao', 'luz', 'refletor'];
          synonyms = ['Foco LED', 'Lâmpada fluorescente', 'Luminária', 'Projetor LED', 'Painel de embutir'];
        } else if (has('disjuntor', 'fusivel', 'fusível', 'rele', 'relé', 'chave de proteção', 'dps', 'dr', 'quadro', 'caixa de distribuicao', 'caixa de distribuição')) {
          subcategory = 'Proteção e Distribuição';
          tags = ['disjuntor', 'quadro', 'segurança', 'energia', 'fusível'];
          synonyms = ['Disjuntor termomagnético', 'Quadro de disjuntores', 'Fusível de proteção', 'Painel elétrico'];
        } else if (has('tomada', 'interruptor', 'comutador', 'plug', 'macho', 'femea', 'fêmea', 'bocal', 'soquete', 'conector')) {
          subcategory = 'Dispositivos e Interruptores';
          tags = ['tomada', 'interruptor', 'dispositivo', 'espelho', 'conector'];
          synonyms = ['Espelho de tomada', 'Comutador elétrico', 'Interruptor de luz', 'Ficha macho', 'Ficha fêmea'];
        } else {
          subcategory = 'Eletrodutos e Conexões';
          tags = ['canaleta', 'vd', 'conduite', 'eletroduto', 'tubo vd', 'fita isoladora'];
          synonyms = ['Canaleta de PVC', 'Tubo VD elétrico', 'Eletroduto flexível', 'Fita isoladora preta'];
        }
      }
      // 3. Estrutural
      else if (
        has(
          'varao', 'varão', 'ferro', 'viga', 'pilar', 'sapata', 'malha solgel', 'malha', 'aço', 'aco',
          'perfil', 'treliça', 'trelica', 'cantoneira', 'viga i', 'perfil h', 'perfil u', 'tubo preto',
          'tubo galvanizado', 'chapa preta', 'chapa galvanizada', 'estribo', 'arame', 'prego', 'parafuso',
          'porca', 'anilha', 'bucha', 'rebite', 'madeira', 'tabua', 'tábua', 'barrote'
        )
      ) {
        category = 'Estrutural';
        if (has('varao', 'varão', 'ferro', 'aço', 'aco', 'viga', 'pilar', 'sapata', 'perfil', 'cantoneira', 'treliça', 'trelica', 'estribo')) {
          subcategory = 'Ferro e Aço';
          tags = ['varao', 'aço', 'estrutural', 'obra', 'armadura', 'ferro'];
          synonyms = ['Ferro de construção', 'Varão de aço', 'Armadura de ferro', 'Perfil de aço', 'Vergalhão'];
        } else if (has('madeira', 'tabua', 'tábua', 'barrote', 'cofragem', 'contraplacado')) {
          subcategory = 'Madeira e Cofragem';
          tags = ['madeira', 'tabua', 'cofragem', 'barrote', 'obra'];
          synonyms = ['Tábua de pinho', 'Barrote de madeira', 'Contraplacado de cofragem', 'Prancha de madeira'];
        } else if (has('prego', 'parafuso', 'porca', 'bucha', 'anilha', 'rebite', 'arame')) {
          subcategory = 'Fixadores e Ferragens';
          tags = ['parafuso', 'prego', 'bucha', 'fixação', 'zincado', 'arame'];
          synonyms = ['Parafuso auto-roscante', 'Prego de aço', 'Arame recozido', 'Bucha plástica'];
        } else {
          subcategory = 'Estrutura Geral';
          tags = ['estrutural', 'obra', 'alicerce', 'fundação'];
          synonyms = ['Material de estrutura', 'Elementos estruturais'];
        }
      }
      // 4. Acabamento
      else if (
        has(
          'azulejo', 'ceramica', 'cerâmica', 'porcelanato', 'tinta', 'verniz', 'trincha', 'pincel', 'rolo',
          'silicone', 'fechadura', 'porta', 'janela', 'rodapé', 'rodape', 'massa corrida', 'gesso cartonado',
          'placa 3d', 'cimento cola', 'rejunte', 'betume', 'argamassa colante', 'dobradiça', 'dobradica',
          'puxador', 'trinco', 'cremona', 'vidro', 'espelho', 'impermeabilizante', 'selante'
        )
      ) {
        category = 'Acabamento';
        if (has('tinta', 'verniz', 'trincha', 'pincel', 'rolo', 'solvente', 'diluente', 'massa corrida')) {
          subcategory = 'Pintura';
          tags = ['tinta', 'pintura', 'verniz', 'cor', 'acabamento', 'massa'];
          synonyms = ['Tinta acrílica', 'Esmalte sintético', 'Corante de parede', 'Trincha de pintura', 'Verniz brilhante'];
        } else if (has('azulejo', 'ceramica', 'cerâmica', 'porcelanato', 'piso', 'revestimento', 'rejunte', 'cimento cola', 'betume')) {
          subcategory = 'Pisos e Revestimentos';
          tags = ['azulejo', 'ceramica', 'piso', 'porcelanato', 'chao', 'cimento-cola'];
          synonyms = ['Ladrilho', 'Revestimento cerâmico', 'Mosaico de chão', 'Cimento cola para cerâmica'];
        } else if (has('fechadura', 'porta', 'janela', 'dobradiça', 'dobradica', 'puxador', 'trinco', 'cremona', 'vidro', 'espelho', 'caixilho', 'esquadria')) {
          subcategory = 'Portas, Janelas e Ferros';
          tags = ['esquadria', 'porta', 'janela', 'fechadura', 'dobradiça', 'hardware'];
          synonyms = ['Fechadura de porta', 'Caixilho de janela', 'Puxador de armário', 'Dobradiça de latão', 'Vidro para janela'];
        } else {
          subcategory = 'Gesso e Divisórias';
          tags = ['gesso', 'pladur', 'teto', 'divisoria', 'sanca', 'moldura'];
          synonyms = ['Placa de gesso', 'Teto falso pladur', 'Sanca decorativa'];
        }
      }
      // 5. Ferramentas
      else if (
        has(
          'martelo', 'pá', 'pa ', 'picareta', 'colher de pedreiro', 'colher de trolha', 'desempenadeira',
          'nivel', 'nível', 'furadeira', 'disco de corte', 'andaime', 'luvas', 'capacete', 'bota',
          'chave fenda', 'chave de fenda', 'serrote', 'trena', 'alicate', 'chave inglesa', 'chave de bocas',
          'parafusadora', 'rebarbadora', 'esmerilhadeira', 'serra', 'tico-tico', 'balde de obra', 'carrinho de mao',
          'carrinho de mão', 'peneira', 'oculos de protecao', 'óculos', 'máscara', 'colete', 'cinto de seguranca',
          'colete refletor', 'protetor auricular', 'epi'
        )
      ) {
        category = 'Ferramentas';
        if (has('luvas', 'capacete', 'bota', 'oculos', 'óculos', 'máscara', 'mascara', 'colete', 'cinto', 'epi')) {
          subcategory = 'Equipamento de Proteção (EPI)';
          tags = ['epi', 'segurança', 'proteção', 'luvas', 'capacete', 'bota'];
          synonyms = ['Equipamento de segurança', 'Proteção individual', 'Óculos de proteção', 'Bota de biqueira d\'aço'];
        } else if (has('furadeira', 'parafusadora', 'rebarbadora', 'esmerilhadeira', 'serra circular', 'tico-tico', 'martelo demolidor')) {
          subcategory = 'Ferramentas Elétricas';
          tags = ['ferramenta', 'eletrica', 'equipamento', 'furadeira', 'parafusadora'];
          synonyms = ['Furadeira elétrica', 'Rebarbadora angular', 'Parafusadora a bateria', 'Serra elétrica'];
        } else {
          subcategory = 'Ferramentas Manuais';
          tags = ['ferramenta', 'martelo', 'chavefenda', 'colher', 'trena', 'pedreiro'];
          synonyms = ['Colher de pedreiro', 'Chave de fendas', 'Martelo de orelhas', 'Trena métrica', 'Desempenadeira'];
        }
      }
      // 6. Básicos
      else {
        category = 'Básicos';
        if (has('cimento')) {
          subcategory = 'Cimento';
          tags = ['cimento', 'obra', 'construcao', 'massa'];
          synonyms = ['Cimento Portland', 'Ligante hidráulico', 'Cimento Secil', 'Cimento Nacional'];
        } else if (has('areia', 'brita', 'pedra', 'cascalho', 'pedregulho')) {
          subcategory = 'Agregados';
          tags = ['areia', 'brita', 'agregados', 'pedra', 'cascalho'];
          synonyms = ['Areia fina', 'Pedra britada', 'Areia grossa', 'Brita para betão'];
        } else if (has('tijolo', 'bloco')) {
          subcategory = 'Blocos e Tijolos';
          tags = ['tijolo', 'bloco', 'alvenaria', 'parede'];
          synonyms = ['Bloco de cimento', 'Tijolo cozido', 'Tijolo burro', 'Bloco de reboco'];
        } else if (has('telha', 'chapa de zinco', 'chapa zincada', 'cobertura', 'cumeeira')) {
          subcategory = 'Coberturas';
          tags = ['telha', 'chapa', 'cobertura', 'teto', 'zinco'];
          synonyms = ['Telha cerâmica', 'Chapa ondulada de zinco', 'Cumeeira galvanizada'];
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

  // AI Logistics Weight Estimation API
  app.post('/api/logistics/estimate', async (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    try {
      console.log(`[SERVER] Estimating weight for ${items.length} items with Gemini`);
      const client = getGeminiClient();
      const prompt = `
        Você é um coordenador de logística industrial moçambicano altamente experiente.
        Analise a lista de materiais a seguir e calcule, em toneladas mecânicas e volume em metros cúbicos (m³), o peso exato ou aproximado de cada item de acordo com suas quantidades e descrições técnicas.
        A densidade e peso padrão dos produtos de construção comuns na África Austral e Moçambique devem ser respeitados (Ex: Cimento saco = 50kg, Brita = 1.6 t/m³, Areia = 1.5 t/m³, Bloco de 15cm = 18kg, Varão de aço de 12mm por 6m = ~5.3kg).

        Lista de Itens:
        ${JSON.stringify(items, null, 2)}

        Retorne um objeto JSON que obedeça rigorosamente ao formato estruturado com estimativas numéricas de peso em toneladas e volume em metros cúbicos.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedWeightTons: { type: Type.NUMBER },
              estimatedVolumeM3: { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    estimatedWeightTons: { type: Type.NUMBER },
                    estimatedVolumeM3: { type: Type.NUMBER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["name", "quantity", "estimatedWeightTons", "estimatedVolumeM3", "explanation"]
                }
              },
              totalExplanation: { type: Type.STRING }
            },
            required: ["estimatedWeightTons", "estimatedVolumeM3", "items", "totalExplanation"]
          }
        }
      });

      const text = response.text || '';
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      const result = JSON.parse(cleaned.trim());
      console.log(`[SERVER] Estimation result:`, result);
      res.json(result);
    } catch (error: any) {
      console.warn('[SERVER] Gemini weight estimation failed, using local fallback:', error.message || error);
      
      // Smart Rule-based local estimation fallback
      let totalWeight = 0;
      let totalVolume = 0;
      const responseItems = items.map(it => {
        const name = it.name || '';
        const qtyStr = String(it.quantity || '1');
        const numQty = parseFloat(qtyStr.replace(/[^0-9.]/g, '')) || 1;
        const nameLower = name.toLowerCase();

        let itemWeight = 0.5; // default fallback 500kg
        let itemVolume = 0.5; // default fallback 0.5m³
        let exp = 'Estimativa de peso padrão aplicada.';

        if (nameLower.includes('cimento')) {
          // If 50kg bag is assumed
          const bagWeightTons = 0.05; // 50kg
          itemWeight = numQty * bagWeightTons;
          itemVolume = numQty * 0.035; // volume of 1 bag is ~35 liters
          exp = `${numQty} sacos de cimento de 50kg cada, totalizando ${itemWeight.toFixed(2)} toneladas.`;
        } else if (nameLower.includes('brita') || nameLower.includes('pedra')) {
          // Aggregate
          itemVolume = numQty;
          itemWeight = numQty * 1.6; // ~1.6 tons/m3
          exp = `${numQty} m³ de brita/pedra calculada com densidade de 1.6 t/m³, resultando em ~${itemWeight.toFixed(2)} toneladas.`;
        } else if (nameLower.includes('areia')) {
          itemVolume = numQty;
          itemWeight = numQty * 1.5; // ~1.5 tons/m3
          exp = `${numQty} m³ de areia calculada com densidade de 1.5 t/m³, resultando em ~${itemWeight.toFixed(2)} toneladas.`;
        } else if (nameLower.includes('bloco') || nameLower.includes('tijolo')) {
          const blockWeightTons = 0.018; // 18kg per block
          itemWeight = numQty * blockWeightTons;
          itemVolume = numQty * 0.012; // 12 liters volume per block
          exp = `${numQty} blocos de cimento calculados a 18kg cada, totalizando ~${itemWeight.toFixed(2)} toneladas.`;
        } else if (nameLower.includes('ferro') || nameLower.includes('varão') || nameLower.includes('vontade') || nameLower.includes('aco')) {
          const steelWeightTons = 0.006; // ~6kg per bar
          itemWeight = numQty * steelWeightTons;
          itemVolume = numQty * 0.005;
          exp = `${numQty} varões de ferro/aço calculados a 6kg cada, totalizando ~${itemWeight.toFixed(2)} toneladas.`;
        }

        totalWeight += itemWeight;
        totalVolume += itemVolume;

        return {
          name,
          quantity: qtyStr,
          estimatedWeightTons: parseFloat(itemWeight.toFixed(2)),
          estimatedVolumeM3: parseFloat(itemVolume.toFixed(2)),
          explanation: exp
        };
      });

      const fallbackResult = {
        estimatedWeightTons: parseFloat(totalWeight.toFixed(2)),
        estimatedVolumeM3: parseFloat(totalVolume.toFixed(2)),
        items: responseItems,
        totalExplanation: `Cálculo automático efetuado pelo algoritmo local. Peso total estimado em ${totalWeight.toFixed(2)} toneladas e cubagem total em ${totalVolume.toFixed(2)} m³.`
      };

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
      console.warn('[SERVER] Storage bucket upload failed, attempting local Base64 data URL encoding:', error.message);
      const file = req.file;
      if (file && file.buffer) {
        try {
          const base64 = file.buffer.toString('base64');
          const dataUrl = `data:${file.mimetype};base64,${base64}`;
          console.log('[SERVER] Base64 data URL encoded successfully as fallback.');
          return res.json({ url: dataUrl });
        } catch (fallbackError: any) {
          console.error('[SERVER] Base64 encoding fallback failed:', fallbackError.message);
        }
      }
      res.status(500).json({ 
        error: error.message || 'Error saving file to Storage'
      });
    }
  });

  // Explicit route for legacy Service Worker cleanup to prevent HTML/SPA fallback from throwing script syntax/redirect errors in the browser
  app.get(['/service-worker.js', '/sw.js'], (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(
      "self.addEventListener('install', (event) => {\n" +
      "  self.skipWaiting();\n" +
      "});\n" +
      "self.addEventListener('activate', (event) => {\n" +
      "  event.waitUntil(\n" +
      "    self.clients.claim()\n" +
      "      .then(() => self.registration.unregister())\n" +
      "      .then(() => {\n" +
      "        console.log('[ServiceWorker] Self-unregistered successfully.');\n" +
      "      })\n" +
      "  );\n" +
      "});"
    );
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
