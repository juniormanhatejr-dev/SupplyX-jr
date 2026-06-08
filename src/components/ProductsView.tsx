import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, ChangeEvent, memo, useMemo, useDeferredValue } from 'react';
import { 
  ChevronDown, 
  Target, 
  Globe2, 
  Grid2X2, 
  ArrowRight, 
  PencilRuler,
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CirclePlus,
  Settings,
  Plus,
  Download,
  Search,
  LayoutGrid,
  Trash2,
  Edit3,
  Tag,
  Loader2,
  AlertCircle,
  MessageSquare,
  Brain,
  Camera,
  Sparkles,
  SearchCode
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType, uploadFile } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { normalizeText, generateSearchTokens } from '../lib/normalization';
import { getProductMetadata, MASTER_CATALOG } from '../lib/masterCatalog';
import { classifyProduct } from '../services/geminiService';
import ProfileModal from './ProfileModal';
import ProductDetailModal from './ProductDetailModal';
import { OptimizedImage } from './ui/OptimizedImage';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: string;
  supplierId: string;
  supplierName?: string;
  name: string;
  normalizedName?: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  vatRate?: number;
  onSale: boolean;
  salePrice: number;
  stock: number;
  image: string;
  tags?: string[];
  synonyms?: string[];
  searchIndex?: string[];
  createdAt: any;
}

const categories = [
  { PT: 'Tudo', EN: 'All' },
  { PT: 'Estrutural', EN: 'Structural' },
  { PT: 'Básicos', EN: 'Building Materials' },
  { PT: 'Acabamento', EN: 'Finishing' },
  { PT: 'Hidráulica', EN: 'Plumbing' },
  { PT: 'Elétrica', EN: 'Electrical' },
  { PT: 'Ferramentas', EN: 'Tools' }
];

const bestOffers = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1585332924083-0949d031da76?w=600&q=80',
    price: 34.90,
    descPT: 'Cimento CP-II 50kg - Atacado',
    descEN: 'Cement CP-II 50kg - Wholesale',
    categoryPT: 'Básicos',
    categoryEN: 'Building Materials'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1516216628859-9bccecad13fc?w=600&q=80',
    price: 280.00,
    descPT: 'Vergalhão CA-50 10mm (Barra)',
    descEN: 'Rebar CA-50 10mm (Bar)',
    categoryPT: 'Estrutural',
    categoryEN: 'Structural'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1621905235276-85764d9326f1?w=600&q=80',
    price: 45.20,
    descPT: 'Tubo PVC 100mm Esgoto 6m',
    descEN: 'PVC Pipe 100mm Sewage 6m',
    categoryPT: 'Hidráulica',
    categoryEN: 'Plumbing'
  }
];

const personalization = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1541625602330-2277a7c2f219?w=600&q=80',
    badgePT: 'Corte de ferragem sob medida',
    badgeEN: 'Custom rebar cutting'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1562648305-e82f7288bb01?w=600&q=80',
    badgePT: 'Mistura de tintas personalizada',
    badgeEN: 'Custom paint mixing'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=600&q=80',
    badgePT: 'Gravação em ferramentas',
    badgeEN: 'Tool engraving'
  }
];

interface ProductsViewProps {
  onNavigate: (tab: string, payload?: any) => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  initialCategory?: string;
  initialSearchQuery?: string;
  onClearSearch?: () => void;
  userType?: 'buyer' | 'supplier' | 'logistics';
  supplierId?: string | null;
  onClearSupplierFilter?: () => void;
}

interface ProductCardProps {
  item: Product;
  index: number;
  userType: string;
  isDarkMode: boolean;
  language: string;
  t: any;
  onProductClick: (item: Product) => void;
  onChatClick: (item: Product) => void;
  onSupplierClick: (supplierId: string) => void;
}

const ProductCard = memo(({ item, index, userType, isDarkMode, language, t, onProductClick, onChatClick, onSupplierClick }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => onProductClick(item)}
      className="space-y-2 group cursor-pointer relative"
    >
      <div className={`aspect-square rounded-2xl overflow-hidden ${isDarkMode ? 'bg-zinc-900 border border-white/5' : 'bg-white border border-zinc-100 shadow-sm'}`}>
        <OptimizedImage 
          src={item.image} 
          alt="" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          containerClassName="w-full h-full"
          isPriority={index < 6}
        />
        {userType === 'supplier' && (
          <div className="absolute top-2 right-2 bg-zinc-900/80 p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
        )}
        {userType === 'buyer' && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onChatClick(item);
            }}
            className="absolute bottom-2 right-2 bg-brand p-2.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
          >
            <MessageSquare className="w-4 h-4 text-white" />
          </button>
        )}
        {(item as any).fromCache && (
          <div className="absolute top-2 right-2 bg-amber-500/80 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded backdrop-blur-md flex items-center gap-1">
            <Clock className="w-2 h-2" />
            OFFLINE
          </div>
        )}
        {item.onSale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
            <Tag className="w-3 h-3" /> {t.sale}
          </div>
        )}
      </div>
      <div className="space-y-0.5 px-1">
        <div className="flex items-center gap-2">
          {item.onSale ? (
            <>
              <p className="text-[#FF4400] font-black text-base sm:text-lg">MT {item.salePrice}</p>
              <p className="text-zinc-500 text-[10px] sm:text-xs line-through opacity-50">MT {item.price}</p>
            </>
          ) : (
            <p className="text-[#FF4400] font-black text-base sm:text-lg">MT {item.price}</p>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div 
            className="flex-1 min-w-0 pr-2 cursor-pointer group/info"
            onClick={(e) => {
              if (userType === 'buyer') {
                e.stopPropagation();
                onSupplierClick(item.supplierId);
              }
            }}
          >
            <p className={`text-[11px] sm:text-xs truncate font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.name}</p>
            <div className="flex items-center gap-1.5 overflow-hidden mt-0.5">
              {userType === 'buyer' && (
                <p className="text-[8px] font-black uppercase text-zinc-500 group-hover/info:text-brand transition-colors truncate shrink-0 tracking-widest">
                  {item.supplierName || t.supplier}
                </p>
              )}
              {item.subcategory && (
                <span className="text-[7px] font-bold text-zinc-400 uppercase italic whitespace-nowrap opacity-60">
                  {item.subcategory}
                </span>
              )}
            </div>
          </div>
          {userType === 'supplier' && (
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${item.stock > 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
              {item.stock > 0 ? `${item.stock}` : '0'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default function ProductsView({ 
  onNavigate, 
  initialCategory = 'Tudo', 
  initialSearchQuery = '',
  onClearSearch,
  isDarkMode, 
  language = 'PT', 
  userType = 'buyer',
  supplierId = null,
  onClearSupplierFilter
}: ProductsViewProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rawProducts, setProducts] = useState<Product[]>([]);
  const [activeSuppliers, setActiveSuppliers] = useState<string[]>([]);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  
  useEffect(() => {
    const q = query(collection(db, 'users'), where('type', '==', 'supplier'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveSuppliers(snapshot.docs.map(doc => doc.id));
      setSuppliersLoaded(true);
    }, (err) => {
      console.error('Error listening to active suppliers:', err);
      setSuppliersLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const products = useMemo(() => {
    if (!suppliersLoaded) return rawProducts;
    return rawProducts.filter(item => activeSuppliers.includes(item.supplierId));
  }, [rawProducts, activeSuppliers, suppliersLoaded]);

  // Auto-clean orphaned products (whose supplier is no longer registered in the users collection)
  useEffect(() => {
    if (suppliersLoaded && rawProducts.length > 0 && activeSuppliers.length >= 0) {
      const currentUid = auth.currentUser?.uid;
      const orphaned = rawProducts.filter(p => !activeSuppliers.includes(p.supplierId) && p.supplierId !== currentUid);
      
      if (orphaned.length > 0) {
        console.log(`Cleaning up ${orphaned.length} orphaned products...`);
        orphaned.forEach(async (p) => {
          try {
            await deleteDoc(doc(db, 'products', p.id));
            console.log(`Successfully deleted orphaned product: ${p.id}`);
          } catch (e) {
            console.error(`Failed to delete orphaned product ${p.id}:`, e);
          }
        });
      }
    }
  }, [suppliersLoaded, rawProducts, activeSuppliers]);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { items } = useCart();
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = searchQuery.length > 2 
    ? MASTER_CATALOG.filter(item => {
        const q = normalizeText(searchQuery);
        return normalizeText(item.nome_principal).includes(q) || 
               item.sinonimos.some(s => normalizeText(s).includes(q)) ||
               item.termos_populares.some(t => normalizeText(t).includes(q));
      }).slice(0, 5)
    : [];

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      onClearSearch?.();
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (supplierId) {
      const fetchSupplier = async () => {
        try {
          const docRef = doc(db, 'users', supplierId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSupplierProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching supplier for products view:", error);
        }
      };
      fetchSupplier();
    } else {
      setSupplierProfile(null);
    }
  }, [supplierId]);

  const startChat = async (product: Product) => {
    if (!auth.currentUser) return;

    try {
      setIsLoading(true);
      // Check if room exists
      const roomsRef = collection(db, 'chats');
      const q = query(
        roomsRef,
        where('participants', 'array-contains', auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const existingRoom = snapshot.docs.find(doc => {
        const participants = doc.data().participants as string[];
        return participants.includes(product.supplierId);
      });

      if (existingRoom) {
        onNavigate('Mensagens', { userId: product.supplierId });
        return;
      }

      // Get real names if possible from users collection
      let supplierName = product.supplierName || t.supplier;
      let currentUserName = auth.currentUser.displayName || t.buyer;

      try {
        const supplierDoc = await getDoc(doc(db, 'users', product.supplierId));
        if (supplierDoc.exists()) {
          supplierName = supplierDoc.data().name || supplierName;
        }
      } catch (err) {
        console.warn('Error fetching supplier name:', err);
      }

      try {
        const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (currentUserDoc.exists()) {
          currentUserName = currentUserDoc.data().name || currentUserName;
        }
      } catch (err) {
        console.warn('Error fetching current user name:', err);
      }

      // Create new room
      await addDoc(collection(db, 'chats'), {
        participants: [auth.currentUser.uid, product.supplierId],
        lastMessage: `${t.interestIn}: ${product.name}`,
        lastMessageSenderId: auth.currentUser.uid,
        unreadCount: {
          [auth.currentUser.uid]: 0,
          [product.supplierId]: 1
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participantNames: {
          [auth.currentUser.uid]: currentUserName,
          [product.supplierId]: supplierName
        }
      });

      onNavigate('Mensagens', { userId: product.supplierId });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'chats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    console.log('handleProductImageUpload triggered');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    console.log('File selected:', { name: file.name, size: file.size, type: file.type });
    
    if (!auth.currentUser) {
      console.log('User not authenticated, cannot upload');
      alert(language === 'PT' ? 'Você precisa estar logado para carregar imagens.' : 'You must be logged in to upload images.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert(language === 'PT' ? 'Por favor, selecione uma imagem válida.' : 'Please select a valid image.');
      return;
    }

    setIsUploading(true);
    try {
      const path = `products/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
      console.log('Calling uploadFile with path:', path);
      const url = await uploadFile(path, file);
      console.log('uploadFile returned URL/Data:', url.substring(0, 50) + '...');
      setEditingProduct(prev => ({ ...prev, image: url }));
    } catch (err: any) {
      console.error('Final upload error caught in component:', err);
      alert(language === 'PT' ? `Erro: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const t = {
    PT: {
      browse: 'Explorar Catálogo',
      manage: 'Gestão de Materiais',
      add: 'Novo Produto',
      stats: 'Meus Produtos',
      offers: 'Melhores ofertas',
      inventory: 'Monitorar Stock',
      settings: 'Ajustar Preços',
      exploring: 'Explorando produtos de',
      viewAll: 'Ver Todos Produtos',
      addToCatalog: 'ao catálogo',
      realTime: 'em tempo real',
      bulkActions: 'em massa',
      buyByCategory: 'Compre por categoria',
      requestQuote: 'Solicitação de cotação',
      sourceEurope: 'Fonte na Europa',
      backAll: 'Ver Tudo',
      manageDisplay: 'Gerencie o que aparece para seus clientes',
      savingOffers: 'Consiga os menores preços no SupplyX',
      viewProfile: 'Ver Perfil Fornecedor',
      noProducts: 'Nenhum produto encontrado nesta categoria.',
      quickPersonalize: 'Personalização rápida',
      moqLow: 'MOQ baixo',
      shippingDays: 'Envio em 14 dias',
      trueToDesign: 'Fiel ao design',
      editProduct: 'Editar Produto',
      addProduct: 'Adicionar Produto',
      inventoryManagement: 'Gestão de inventário SupplyX',
      productName: 'Nome do Produto',
      category: 'Categoria',
      stock: 'Stock Disponível',
      price: 'Preço Normal (MT)',
      vatRateLabel: 'Isenção de IVA',
      imageUrl: 'Imagem do Produto',
      imagePreview: 'Preview da Imagem',
      putOnSale: 'Colocar em Promoção',
      saleBadgeDesc: 'Aparece na aba de ofertas',
      saveChanges: 'Salvar Alterações',
      publishProduct: 'Publicar Produto',
      requestSent: 'Solicitação Enviada!',
      consultantContact: 'Um consultor especializado entrará em contacto para finalizar os detalhes do serviço.',
      downloadReceipt: 'Baixar Recibo (Excel)',
      specializedService: 'Serviço Especializado',
      inventoryPanel: 'Painel de controle de inventário e distribuição',
      exploreMaterials: 'Explore os melhores materiais para sua obra',
      inStock: 'em Stock',
      outOfStock: 'Sem Stock',
      confirmRequest: 'Confirmar Solicitação',
      describeDetails: 'Descreva detalhes do seu pedido (ex: dimensões, quantidades, cores)...',
      responseIn: 'Resposta em 1h 30min',
      technicalAnalysis: 'Nossa equipe técnica analisa seu pedido e retorna com orçamento.',
      customQuoteRequest: 'Solicite uma cotação personalizada para este serviço.',
      placeholderProduct: 'Ex: Cimento CP-II 50kg',
      open: 'Abrir',
      sale: 'Oferta',
      buyer: 'Comprador',
      supplier: 'Fornecedor',
      interestIn: 'Interesse no produto',
      csv: {
        type: 'Tipo de Solicitação',
        dateTime: 'Data/Hora',
        status: 'Status',
        pending: 'Pendente',
        responseTime: 'Tempo de Resposta Acordado',
        transactionId: 'ID da Transação'
      },
      imageError: 'Erro ao carregar imagem'
    },
    EN: {
      browse: 'Browse Catalog',
      manage: 'Material Management',
      add: 'New Product',
      stats: 'My Products',
      offers: 'Best Offers',
      inventory: 'Monitor Stock',
      settings: 'Adjust Prices',
      exploring: 'Exploring products from',
      viewAll: 'View All Products',
      addToCatalog: 'to catalog',
      realTime: 'in real time',
      bulkActions: 'in bulk',
      buyByCategory: 'Buy by category',
      requestQuote: 'Request quote',
      sourceEurope: 'Source in Europe',
      backAll: 'View All',
      manageDisplay: 'Manage what appears for your customers',
      savingOffers: 'Get the lowest prices at SupplyX',
      viewProfile: 'View Supplier Profile',
      noProducts: 'No products found in this category.',
      quickPersonalize: 'Quick Personalization',
      moqLow: 'Low MOQ',
      shippingDays: '14-day shipping',
      trueToDesign: 'True to design',
      editProduct: 'Edit Product',
      addProduct: 'Add Product',
      inventoryManagement: 'SupplyX Inventory Management',
      productName: 'Product Name',
      category: 'Category',
      stock: 'Stock Available',
      price: 'Normal Price (MT)',
      vatRateLabel: 'VAT Exemption',
      imageUrl: 'Product Image',
      imagePreview: 'Image Preview',
      putOnSale: 'Put on Sale',
      saleBadgeDesc: 'Shows in the offers tab',
      saveChanges: 'Save Changes',
      publishProduct: 'Publish Product',
      requestSent: 'Request Sent!',
      consultantContact: 'A specialized consultant will contact you to finalize service details.',
      downloadReceipt: 'Download Receipt (Excel)',
      specializedService: 'Specialized Service',
      inventoryPanel: 'Inventory and distribution control panel',
      exploreMaterials: 'Explore the best materials for your construction',
      inStock: 'in Stock',
      outOfStock: 'Out of Stock',
      confirmRequest: 'Confirm Request',
      describeDetails: 'Describe your order details (e.g. dimensions, quantities, colors)...',
      responseIn: 'Response in 1h 30min',
      technicalAnalysis: 'Our technical team analyzes your request and returns with a quote.',
      customQuoteRequest: 'Request a customized quote for this service.',
      placeholderProduct: 'Ex: Cement CP-II 50kg',
      open: 'Open',
      sale: 'Sale',
      buyer: 'Buyer',
      supplier: 'Supplier',
      interestIn: 'Interest in product',
      imageError: 'Error loading image',
      csv: {
        type: 'Request Type',
        dateTime: 'Date/Time',
        status: 'Status',
        pending: 'Pending',
        responseTime: 'Agreed Response Time',
        transactionId: 'Transaction ID'
      }
    }
  }[language];

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    let q;
    if (supplierId) {
      // Show products for a specific supplier (from profile catalog browse)
      q = query(collection(db, 'products'), where('supplierId', '==', supplierId));
    } else if (userType === 'supplier') {
      // Suppliers see their own products
      q = query(collection(db, 'products'), where('supplierId', '==', auth.currentUser?.uid));
    } else {
      // Buyers see all products
      q = query(collection(db, 'products'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fromCache: snapshot.metadata.fromCache
      })) as (Product & { fromCache: boolean })[];
      setProducts(prods);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, [userType, supplierId]); // Added supplierId to dependencies

  const displayProducts = useMemo(() => {
    const baseProducts = activeCategory === 'All' || activeCategory === 'Tudo'
      ? products
      : products.filter(item => item.category === activeCategory);

    if (!deferredSearchQuery) return baseProducts;
    
    const q = normalizeText(deferredSearchQuery);
    const searchTerms = q.split(' ');
    
    return baseProducts.filter(item => {
      const nameNorm = normalizeText(item.name);
      const descNorm = item.description ? normalizeText(item.description) : '';
      
      if (nameNorm.includes(q) || descNorm.includes(q)) return true;
      
      const additionalTerms = [
        ...(item.tags || []),
        ...(item.synonyms || []),
        ...(item.searchIndex || []),
        item.category,
        item.subcategory || ''
      ].map(t => normalizeText(t));
      
      return additionalTerms.some(term => term.includes(q) || searchTerms.some(st => term.includes(st)));
    });
  }, [activeCategory, products, deferredSearchQuery, language, userType]);

  const handleServiceRequest = () => {
    setIsSuccess(true);
    // Modal will stay open for the user to download the Excel or review
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedService(null);
    }, 15000); // 15 seconds
  };

  const exportServiceRequestToExcel = () => {
    if (!selectedService) return;
    
    const timestamp = new Date().toLocaleString();
    const data = [
      [t.csv.type, selectedService],
      [t.csv.dateTime, timestamp],
      [t.csv.status, t.csv.pending],
      [t.csv.responseTime, '1h 30min'],
      [t.csv.transactionId, `#SV-${Math.random().toString(36).substring(7).toUpperCase()}`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solicitacao_${selectedService.toLowerCase().replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isClassifying, setIsClassifying] = useState(false);
  const [lastClassifiedName, setLastClassifiedName] = useState('');

  const handleAIClassification = async (customName?: string) => {
    const targetName = customName || editingProduct?.name;
    if (!targetName) return;
    
    setIsClassifying(true);
    try {
      const result = await classifyProduct(targetName, editingProduct?.description || '');
      setEditingProduct(prev => ({
        ...prev!,
        category: result.category,
        subcategory: result.subcategory,
        tags: Array.from(new Set([...(prev?.tags || []), ...result.tags])),
        synonyms: Array.from(new Set([...(prev?.synonyms || []), ...result.synonyms])),
        normalizedName: result.normalizedName
      }));
      setLastClassifiedName(targetName);
    } catch (error) {
      console.error("AI Classification failed", error);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-[#F7F8FA]'} min-h-screen -m-4 md:-m-8 p-4 md:p-6`}
    >
      {/* Top Header Differentiator */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black italic tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {supplierProfile ? `Catálogo: ${supplierProfile.name}` : (userType === 'supplier' ? t.manage : t.browse)}
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {supplierProfile 
              ? `${t.exploring} ${supplierProfile.name}` 
              : (userType === 'supplier' ? t.inventoryPanel : t.exploreMaterials)}
          </p>
        </div>
        
        {supplierId && onClearSupplierFilter && (
          <button 
            onClick={onClearSupplierFilter}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-brand' : 'bg-white border-zinc-100 text-brand shadow-sm'
            }`}
          >
            <X className="w-4 h-4" />
            {t.viewAll}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
          isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/50' 
            : 'bg-white border-zinc-100 focus-within:border-brand/30 shadow-sm focus-within:ring-1 focus-within:ring-brand/30'
        }`}>
          <Search className={`w-5 h-5 transition-colors ${searchQuery ? 'text-brand' : 'text-zinc-400'}`} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={language === 'PT' ? 'Pesquisar produtos no catálogo...' : 'Search products in catalog...'}
            className={`flex-1 bg-transparent border-none outline-none text-sm font-bold ${
              isDarkMode ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl border z-50 shadow-2xl backdrop-blur-xl ${
              isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-zinc-100'
            }`}>
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Sugestões SupplyX</span>
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSearchQuery(item.nome_principal);
                    setShowSuggestions(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    isDarkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-zinc-50 text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                      <SearchCode className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-left font-bold leading-tight text-xs">{item.nome_principal}</p>
                      <p className="text-[8px] font-black uppercase text-zinc-500">{item.categoria} • {item.subcategoria}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {item.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[6px] font-black uppercase text-zinc-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
          {showSuggestions && searchQuery.length > 0 && (
            <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
          )}
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action Cards (Conditional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {userType === 'supplier' ? (
          <>
            <div 
              onClick={() => {
                setEditingProduct({
                  name: '',
                  description: '',
                  category: 'Básicos',
                  price: 0,
                  onSale: false,
                  salePrice: 0,
                  stock: 0,
                  image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ec3?w=600&q=80'
                });
                setIsEditorOpen(true);
              }}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-sm border border-transparent hover:border-brand/20 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Plus className="w-6 h-6" />
              </div>
              <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{t.add}<br />{t.addToCatalog}</span>
            </div>
            <div 
              onClick={() => {
                const inventoryHeader = document.querySelector('h2');
                inventoryHeader?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-sm border border-transparent hover:border-brand/20 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{t.inventory}<br />{t.realTime}</span>
            </div>
            <div 
              onClick={() => onNavigate('Relatórios')}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-sm border border-transparent hover:border-brand/20 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Settings className="w-6 h-6" />
              </div>
              <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{t.settings}<br />{t.bulkActions}</span>
            </div>
          </>
        ) : (
          <>
            <div 
              onClick={() => {
                const nav = document.querySelector('.scrollbar-hide');
                nav?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-sm border border-transparent hover:border-brand/20 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="bg-orange-100 p-2 rounded-lg">
                <Grid2X2 className="w-6 h-6 text-orange-600" />
              </div>
              <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{t.buyByCategory.split(' ').slice(0, 2).join(' ')}<br />{t.buyByCategory.split(' ').slice(2).join(' ')}</span>
            </div>
            <div 
              onClick={() => onNavigate('Pedidos / Cotações')}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-sm border border-transparent hover:border-brand/20 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="bg-red-100 p-2 rounded-lg">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{t.requestQuote.split(' ').slice(0, 2).join(' ')}<br />{t.requestQuote.split(' ').slice(2).join(' ')}</span>
            </div>
            <div 
              onClick={() => setSelectedService('Fonte na Europa')}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-sm border border-transparent hover:border-brand/20 transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className="bg-blue-100 p-2 rounded-lg">
                <Globe2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{t.sourceEurope.split(' ').slice(0, 2).join(' ')}<br />{t.sourceEurope.split(' ').slice(2).join(' ')}</span>
            </div>
          </>
        )}
      </div>

      {/* Top Category Nav */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.PT}
            onClick={() => setActiveCategory(cat.PT)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all italic border ${
              activeCategory === cat.PT
                ? (isDarkMode ? 'bg-brand border-brand text-white' : 'bg-brand border-brand text-white shadow-lg shadow-brand/20')
                : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:text-zinc-900 shadow-sm')
            }`}
          >
            {cat.PT === 'Tudo' ? t.backAll : (language === 'PT' ? cat.PT : cat.EN)}
          </button>
        ))}
      </div>

      {/* Melhores Ofertas Section */}
      <div className={`rounded-[32px] p-8 mb-8 shadow-sm border ${isDarkMode ? 'bg-zinc-900/50 border-white/5 backdrop-blur-md' : 'bg-white border-zinc-100 shadow-sm'}`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {userType === 'supplier' ? t.stats : t.offers}
            </h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
              {userType === 'supplier' ? t.manageDisplay : t.savingOffers}
            </p>
          </div>
          {userType === 'buyer' && (
            <button 
              onClick={() => onNavigate('Pedidos / Cotações')}
              className="bg-[#FF6600] text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
            >
              <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[10px]">X</div>
              {t.open}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {displayProducts.length > 0 ? displayProducts.map((item, index) => (
            <ProductCard 
              key={item.id}
              item={item}
              index={index}
              userType={userType}
              isDarkMode={isDarkMode || false}
              language={language}
              t={t}
              onProductClick={(product) => {
                if (userType === 'buyer') {
                  setSelectedProductDetail(product);
                  setIsDetailModalOpen(true);
                }
                if (userType === 'supplier') {
                  setEditingProduct(product);
                  setIsEditorOpen(true);
                }
              }}
              onChatClick={startChat}
              onSupplierClick={(profileId) => {
                setViewingProfileId(profileId);
                setIsProfileModalOpen(true);
              }}
            />
          )) : (
            <div className="col-span-full py-10 text-center">
              <p className="text-zinc-400 font-bold">{t.noProducts}</p>
            </div>
          )}
        </div>
      </div>

      {/* Personalização Rápida Section (Removed as per user request to hide non-DB data) */}

      {/* Service Request Modal */}
      <AnimatePresence>
        {isEditorOpen && userType === 'supplier' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl p-8 rounded-[40px] relative border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}
            >
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="mb-8">
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {editingProduct?.id ? t.editProduct : t.addProduct}
                </h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{t.inventoryManagement}</p>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 scrollbar-hide">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.productName}</label>
                    <button 
                      onClick={() => handleAIClassification()}
                      disabled={isClassifying || !editingProduct?.name}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                        isClassifying ? 'bg-brand/10 text-brand animate-pulse' : 'bg-brand/10 text-brand hover:bg-brand/20'
                      }`}
                    >
                      <Brain className="w-3 h-3" />
                      {isClassifying ? 'Analisando...' : 'IA Classificar'}
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    onBlur={() => {
                      if (editingProduct?.name && editingProduct.name.trim().length > 2 && editingProduct.name !== lastClassifiedName) {
                        handleAIClassification(editingProduct.name);
                      }
                    }}
                    className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                    placeholder={t.placeholderProduct}
                  />
                  <p className="text-[9px] text-zinc-400 font-bold uppercase ml-1 italic">{language === 'PT' ? '* A IA classificará automaticamente ao sair do campo' : '* AI will classify automatically upon leaving field'}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{language === 'PT' ? 'Descrição Detalhada' : 'Detailed Description'}</label>
                  <textarea 
                    value={editingProduct?.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    onBlur={() => {
                      if (editingProduct?.name && (!editingProduct.category || !editingProduct.subcategory)) {
                        handleAIClassification(editingProduct.name);
                      }
                    }}
                    rows={3}
                    placeholder="Ex: Cimento de alta resistência, ideal para lages e vigas..."
                    className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all resize-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                  />
                </div>

                {editingProduct?.tags && editingProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-1">
                    {editingProduct.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black text-zinc-500 uppercase border border-zinc-200 dark:border-zinc-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 opacity-90">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.category}</label>
                      <span className="text-[8px] font-bold text-teal-400 uppercase tracking-widest">Definido por IA ✨</span>
                    </div>
                    <select 
                      value={editingProduct?.category || 'Básicos'}
                      disabled={true}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 appearance-none transition-all cursor-not-allowed ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400' : 'bg-zinc-50/50 border-zinc-100 text-zinc-500'}`}
                    >
                      {categories.filter(c => c.PT !== 'Tudo').map(c => <option key={c.PT} value={c.PT}>{language === 'PT' ? c.PT : c.EN}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 opacity-90">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Subcategoria' : 'Subcategory'}</label>
                      <span className="text-[8px] font-bold text-teal-400 uppercase tracking-widest">Definido por IA ✨</span>
                    </div>
                    <input 
                      type="text"
                      value={editingProduct?.subcategory || ''}
                      readOnly={true}
                      placeholder={isClassifying ? "Analisando..." : "Classificação Automática..."}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all cursor-not-allowed ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400' : 'bg-zinc-50/50 border-zinc-100 text-zinc-500'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.stock}</label>
                    <input 
                      type="number"
                      value={editingProduct?.stock || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEditingProduct({ ...editingProduct, stock: isNaN(val) ? 0 : val });
                      }}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.price}</label>
                    <input 
                      type="number"
                      value={editingProduct?.price || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEditingProduct({ ...editingProduct, price: isNaN(val) ? 0 : val });
                      }}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.vatRateLabel}</label>
                    <button
                      type="button"
                      onClick={() => {
                        const isCurrentlyExempt = (editingProduct?.vatRate === 0);
                        setEditingProduct({ 
                          ...editingProduct, 
                          vatRate: isCurrentlyExempt ? 16 : 0 
                        });
                      }}
                      className={`w-full p-4 h-[52px] rounded-2xl text-xs font-bold outline-none border-2 transition-all flex items-center justify-between ${
                        (editingProduct?.vatRate === 0)
                          ? 'border-brand bg-brand/5 text-brand' 
                          : isDarkMode 
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700' 
                            : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:border-zinc-200'
                      }`}
                    >
                      <span className="truncate">
                        {(editingProduct?.vatRate === 0) 
                          ? (language === 'PT' ? 'Isento (0% IVA)' : 'Exempt (0% VAT)') 
                          : (language === 'PT' ? 'Sujeito a IVA (16% Incluso)' : 'Subject to VAT (16% Incl.)')}
                      </span>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        (editingProduct?.vatRate === 0) ? 'bg-brand' : 'bg-zinc-400'
                      }`}>
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                          (editingProduct?.vatRate === 0) ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </button>
                  </div>
                </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.imageUrl}</label>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <input 
                          type="text"
                          value={editingProduct?.image || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                          placeholder="https://..."
                        />
                        <p className="text-[9px] font-bold text-zinc-400 uppercase ml-1 italic">{language === 'PT' ? '* Carregamento automático ao selecionar arquivo' : '* Auto-uploads on file selection'}</p>
                      </div>
                      <label className={`shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:bg-brand/5 hover:border-brand/50 relative group ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleProductImageUpload} 
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-1">
                            <Loader2 className="w-6 h-6 animate-spin text-brand" />
                            <span className="text-[8px] font-black uppercase text-brand">Up...</span>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-6 h-6 group-hover:scale-110 transition-transform mb-1" />
                            <span className="text-[8px] font-black uppercase">{language === 'PT' ? 'Carregar' : 'Upload'}</span>
                          </>
                        )}
                        {/* Status Overlay */}
                        {editingProduct?.image && !isUploading && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-zinc-900">
                             <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                {editingProduct?.image && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-zinc-100 dark:border-zinc-800">
                    <OptimizedImage 
                      src={editingProduct.image} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                      fallback={<div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase tracking-widest">{t.imageError || 'Error'}</div>}
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[8px] font-black text-white uppercase tracking-widest">{t.imagePreview}</div>
                  </div>
                )}

                <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${editingProduct?.onSale ? 'border-red-500/30 bg-red-500/5' : 'border-dashed border-zinc-200'}`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setEditingProduct({ ...editingProduct, onSale: !editingProduct?.onSale })}
                      className={`w-10 h-6 rounded-full relative transition-all ${editingProduct?.onSale ? 'bg-red-500' : 'bg-zinc-300'}`}
                    >
                      <motion.div 
                        animate={{ x: editingProduct?.onSale ? 16 : 2 }}
                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                    <div>
                      <p className="text-[10px] font-black text-zinc-800 dark:text-white uppercase tracking-widest">{t.putOnSale}</p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase">{t.saleBadgeDesc}</p>
                    </div>
                  </div>
                  {editingProduct?.onSale && (
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-red-500">MT</span>
                       <input 
                        type="number"
                        value={editingProduct.salePrice || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setEditingProduct({ ...editingProduct, salePrice: isNaN(val) ? 0 : val });
                        }}
                        className={`w-20 p-2 rounded-lg text-xs font-bold outline-none border ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200'}`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                {editingProduct?.id && (
                  <button 
                    onClick={async () => {
                      if (!editingProduct.id) return;
                      try {
                        setIsLoading(true);
                        await deleteDoc(doc(db, 'products', editingProduct.id));
                        setIsEditorOpen(false);
                      } catch (err) {
                        handleFirestoreError(err, OperationType.DELETE, `products/${editingProduct.id}`);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="p-4 rounded-2xl text-red-500 border-2 border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={async () => {
                    if (!editingProduct?.name || !auth.currentUser) return;
                    
                    setIsLoading(true);
                    const now = serverTimestamp();
                    
                    let finalCategory = editingProduct.category;
                    let finalSubcategory = editingProduct.subcategory;
                    let finalTags = editingProduct.tags || [];
                    let finalSynonyms = editingProduct.synonyms || [];
                    let finalNormalizedName = editingProduct.normalizedName || editingProduct.name;

                    // If not classified yet, classify immediately before saving
                    if (!finalCategory || !finalSubcategory) {
                      try {
                        const result = await classifyProduct(editingProduct.name, editingProduct.description || '');
                        finalCategory = result.category;
                        finalSubcategory = result.subcategory;
                        finalTags = Array.from(new Set([...finalTags, ...result.tags]));
                        finalSynonyms = Array.from(new Set([...finalSynonyms, ...result.synonyms]));
                        finalNormalizedName = result.normalizedName;
                      } catch (err) {
                        console.error("Auto classification before save failed", err);
                      }
                    }

                    // Pre-process for intelligent search
                    const normalizedName = normalizeText(finalNormalizedName);
                    const baseTokens = generateSearchTokens(finalNormalizedName);
                    const catalogMatch = getProductMetadata(finalNormalizedName);
                    
                    const searchIndex = Array.from(new Set([
                      ...baseTokens,
                      ...finalTags,
                      ...(catalogMatch?.tags || []),
                      ...(catalogMatch?.sinonimos || []),
                      finalCategory || 'Básicos',
                      finalSubcategory || catalogMatch?.subcategoria || 'Geral'
                    ])).map(t => normalizeText(t)).filter(t => t.length > 1);

                    try {
                      if (editingProduct.id) {
                        const { id, createdAt, ...rest } = editingProduct;
                        await updateDoc(doc(db, 'products', id as string), {
                          ...rest,
                          category: finalCategory || 'Básicos',
                          subcategory: finalSubcategory || 'Geral',
                          tags: finalTags,
                          synonyms: finalSynonyms,
                          normalizedName,
                          searchIndex,
                          supplierId: auth.currentUser.uid,
                          vatRate: editingProduct.vatRate !== undefined ? editingProduct.vatRate : 16,
                          updatedAt: now
                        });
                      } else {
                        const data = {
                          ...editingProduct,
                          category: finalCategory || 'Básicos',
                          subcategory: finalSubcategory || 'Geral',
                          tags: finalTags,
                          synonyms: finalSynonyms,
                          normalizedName,
                          searchIndex,
                          supplierId: auth.currentUser.uid,
                          vatRate: editingProduct.vatRate !== undefined ? editingProduct.vatRate : 16,
                          createdAt: now,
                          updatedAt: now
                        };
                        await addDoc(collection(db, 'products'), data);
                      }
                      setIsEditorOpen(false);
                    } catch (err) {
                      handleFirestoreError(err, editingProduct.id ? OperationType.UPDATE : OperationType.CREATE, 'products');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest italic shadow-xl shadow-brand/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {editingProduct?.id ? t.saveChanges : t.publishProduct}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-2xl p-8 rounded-3xl relative ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-2xl'}`}
            >
              <button 
                onClick={() => setSelectedService(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              {isSuccess ? (
                <div className="py-8 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.requestSent}</h3>
                  <p className="text-zinc-500 font-bold px-4 mb-6">{t.consultantContact}</p>
                  <button 
                    onClick={exportServiceRequestToExcel}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 mx-auto transition-all"
                  >
                    <Download className="w-3 h-3" />
                    {t.downloadReceipt}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-brand" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand">{t.specializedService}</span>
                    </div>
                    <h3 className={`text-3xl font-black italic uppercase tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{selectedService}</h3>
                    <p className="text-zinc-500 text-sm font-bold">{t.customQuoteRequest}</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className={`p-4 rounded-2xl flex items-start gap-4 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
                      <Clock className="w-5 h-5 text-brand shrink-0" />
                      <div>
                        <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{t.responseIn}</p>
                        <p className="text-[10px] font-medium text-zinc-500">{t.technicalAnalysis}</p>
                      </div>
                    </div>
                    <textarea 
                      placeholder={t.describeDetails}
                      className={`w-full p-4 rounded-xl text-xs font-bold outline-none border-2 transition-all h-32 resize-none ${
                        isDarkMode 
                          ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' 
                          : 'bg-white border-zinc-100 text-zinc-900 focus:border-brand/30 shadow-inner shadow-zinc-100'
                      }`}
                    />
                  </div>

                  <button 
                    onClick={handleServiceRequest}
                    className="w-full py-4 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    {t.confirmRequest}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProfileModal 
        userId={viewingProfileId || ''}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={() => onNavigate('Ajustes')}
        isDarkMode={isDarkMode}
        language={language}
      />

      <ProductDetailModal 
        product={selectedProductDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={() => onNavigate('Ajustes')}
        isDarkMode={isDarkMode}
        language={language}
        onStartChat={(p) => {
          setIsDetailModalOpen(false);
          startChat(p);
        }}
      />
    </motion.div>
  );
}
