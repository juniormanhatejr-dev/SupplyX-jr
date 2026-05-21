
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
