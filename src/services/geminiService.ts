
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ProductClassification {
  category: string;
  subcategory: string;
  tags: string[];
  synonyms: string[];
  normalizedName: string;
}

/**
 * Uses Gemini to classify a construction product and suggest tags/synonyms.
 */
export async function classifyProduct(productName: string, description: string): Promise<ProductClassification> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Você é um arquiteto de software moçambicano especializado em materiais de construção.
    Analise o seguinte produto e forneça uma classificação técnica e em português de Moçambique.
    
    Produto: "${productName}"
    Descrição: "${description}"
    
    Retorne APENAS um objeto JSON válido com:
    - category: (Estrutural, Básicos, Acabamento, Hidráulica, Elétrica, Ferramentas)
    - subcategory: (ex: Aço, Cimento, Tubulação, Manuais, Pintura, etc)
    - tags: Lista de palavras-chave relevantes (inclua regionalismos e termos populares)
    - synonyms: Lista de nomes alternativos comuns (inclua termos técnicos e populares de Moçambique)
    - normalizedName: Nome principal ideal e normalizado.
    
    Exemplo de saída:
    {
      "category": "Hidráulica",
      "subcategory": "Tubulações",
      "tags": ["pvc", "encanamento", "canu", "agua"],
      "synonyms": ["cano", "tubo pvc", "tubo de agua"],
      "normalizedName": "Tubo PVC"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handling potential markdown blocks)
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error classifying product with Gemini:", error);
    // Fallback classification logic could go here
    return {
      category: "Básicos",
      subcategory: "Geral",
      tags: [],
      synonyms: [],
      normalizedName: productName
    };
  }
}
