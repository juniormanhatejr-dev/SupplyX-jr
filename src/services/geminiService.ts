
export interface ProductClassification {
  category: string;
  subcategory: string;
  tags: string[];
  synonyms: string[];
  normalizedName: string;
}

/**
 * Robust local classification fallback for the client, matching Mozambican building terminology.
 */
export function classifyProductLocally(productName: string, description: string = ''): ProductClassification {
  const nameLower = productName.toLowerCase();
  const descLower = description.toLowerCase();
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

  return {
    category,
    subcategory,
    tags,
    synonyms,
    normalizedName: productName.charAt(0).toUpperCase() + productName.slice(1)
  };
}

/**
 * Uses Gemini to classify a construction product and suggest tags/synonyms.
 * Calls the secure server-side proxy route.
 */
export async function classifyProduct(productName: string, description: string): Promise<ProductClassification> {
  try {
    const response = await fetch('/api/products/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productName, description }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("API classification failed, using client-side fallback rule engine:", error);
    return classifyProductLocally(productName, description);
  }
}
