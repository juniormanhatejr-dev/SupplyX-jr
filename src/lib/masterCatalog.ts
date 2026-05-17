
export interface CatalogItem {
  id: string;
  nome_principal: string;
  categoria: string;
  subcategoria: string;
  sinonimos: string[];
  tags: string[];
  termos_populares: string[];
}

export const MASTER_CATALOG: CatalogItem[] = [
  {
    id: 'martelo_unha',
    nome_principal: 'Martelo de Unha',
    categoria: 'Ferramentas',
    subcategoria: 'Manuais',
    sinonimos: ['martelo', 'martelo de orelha', 'hammer', 'martelo carpinteiro'],
    tags: ['ferramentas', 'construção', 'marcenaria'],
    termos_populares: ['martelu', 'orelha']
  },
  {
    id: 'vergalhao_ferro',
    nome_principal: 'Vergalhão',
    categoria: 'Estrutural',
    subcategoria: 'Aço',
    sinonimos: ['ferro', 'ferro de construção', 'rebar', 'varão'],
    tags: ['estrutural', 'fundações', 'aço'],
    termos_populares: ['ferru']
  },
  {
    id: 'brita_pedra',
    nome_principal: 'Brita',
    categoria: 'Básicos',
    subcategoria: 'Agregados',
    sinonimos: ['pedra', 'pedra britada', 'crushed stone'],
    tags: ['construção', 'concreto', 'agregados'],
    termos_populares: ['pedrinha']
  },
  {
    id: 'tubo_pvc',
    nome_principal: 'Tubo PVC',
    categoria: 'Hidráulica',
    subcategoria: 'Tubulações',
    sinonimos: ['cano', 'tubo', 'pvc pipe', 'cano de esgoto', 'cano de agua'],
    tags: ['hidraulica', 'encanamento', 'pvc'],
    termos_populares: ['canu']
  },
  {
    id: 'sanita_vaso',
    nome_principal: 'Sanita',
    categoria: 'Acabamento',
    subcategoria: 'Louças Sanitárias',
    sinonimos: ['retrete', 'vaso sanitario', 'toilet'],
    tags: ['banheiro', 'acabamento', 'louça'],
    termos_populares: ['vaso']
  },
  {
    id: 'cimento_cp2',
    nome_principal: 'Cimento CP-II',
    categoria: 'Básicos',
    subcategoria: 'Ligantes',
    sinonimos: ['cimento', 'cement', 'cimento portland'],
    tags: ['construção', 'obra', 'massa'],
    termos_populares: ['cimentu']
  }
];

export function getProductMetadata(text: string) {
  const normalized = text.toLowerCase();
  
  // Find the best match in the catalog
  const match = MASTER_CATALOG.find(item => {
    const searchSpace = [
      item.nome_principal.toLowerCase(),
      ...item.sinonimos.map(s => s.toLowerCase()),
      ...item.termos_populares.map(s => s.toLowerCase())
    ];
    return searchSpace.some(term => normalized.includes(term) || term.includes(normalized));
  });

  return match;
}
