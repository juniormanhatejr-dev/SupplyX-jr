import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
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
  Brain
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import ProfileModal from './ProfileModal';
import ProductDetailModal from './ProductDetailModal';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: string;
  supplierId: string;
  supplierName?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  onSale: boolean;
  salePrice: number;
  stock: number;
  image: string;
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
  onNavigate: (tab: string) => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  initialCategory?: string;
  userType?: 'buyer' | 'supplier';
  supplierId?: string | null;
  onClearSupplierFilter?: () => void;
}

export default function ProductsView({ 
  onNavigate, 
  initialCategory = 'Tudo', 
  isDarkMode, 
  language = 'PT', 
  userType = 'buyer',
  supplierId = null,
  onClearSupplierFilter
}: ProductsViewProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { items } = useCart();
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!auth.currentUser || userType === 'supplier') return;

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
        onNavigate('Mensagens');
        return;
      }

      // Create new room
      await addDoc(collection(db, 'chats'), {
        participants: [auth.currentUser.uid, product.supplierId],
        lastMessage: `${t.interestIn}: ${product.name}`,
        updatedAt: serverTimestamp(),
        participantNames: {
          [auth.currentUser.uid]: auth.currentUser.displayName || t.buyer,
          [product.supplierId]: product.supplierName || t.supplier
        }
      });

      onNavigate('Mensagens');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'chats');
    } finally {
      setIsLoading(false);
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
      imageUrl: 'URL da Imagem',
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
      }
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
      imageUrl: 'Image URL',
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
        ...doc.data()
      })) as Product[];
      setProducts(prods);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, [userType]);

    const baseProducts = activeCategory === 'All' || activeCategory === 'Tudo'
    ? (products.length > 0 ? products : bestOffers.map(p => ({ 
        ...p, 
        id: p.id.toString(), 
        supplierId: 'demo',
        name: language === 'PT' ? p.descPT : p.descEN,
        category: language === 'PT' ? p.categoryPT : p.categoryEN
      } as any)))
    : products.filter(item => item.category === activeCategory);

  const displayProducts = baseProducts.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || 
           (item.description && item.description.toLowerCase().includes(q)) ||
           item.category.toLowerCase().includes(q);
  });

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-[#F7F8FA]'} min-h-screen -m-8 p-4 md:p-6`}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'PT' ? 'Pesquisar produtos no catálogo...' : 'Search products in catalog...'}
            className={`flex-1 bg-transparent border-none outline-none text-sm font-bold ${
              isDarkMode ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
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
      <div className={`rounded-2xl p-5 mb-6 shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {userType === 'supplier' ? t.stats : t.offers}
            </h2>
            <p className="text-zinc-400 text-sm font-medium">
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayProducts.length > 0 ? displayProducts.map((item) => (
            <div 
              key={item.id} 
              onClick={() => {
                if (userType === 'buyer') {
                  setSelectedProductDetail(item);
                  setIsDetailModalOpen(true);
                }
                if (userType === 'supplier') {
                  setEditingProduct(item);
                  setIsEditorOpen(true);
                }
              }}
              className="space-y-2 group cursor-pointer relative"
            >
              <div className={`aspect-square rounded-xl overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
                <img 
                  src={item.image} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                {userType === 'supplier' && (
                  <div className="absolute top-2 right-2 bg-zinc-900/80 p-2 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="w-4 h-4 text-white" />
                  </div>
                )}
                {userType === 'buyer' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      startChat(item);
                    }}
                    className="absolute bottom-2 right-2 bg-brand p-2.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                  >
                    <MessageSquare className="w-4 h-4 text-white" />
                  </button>
                )}
                {item.onSale && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {t.sale}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {item.onSale ? (
                    <>
                      <p className="text-[#FF4400] font-black text-lg">MT {item.salePrice}</p>
                      <p className="text-zinc-500 text-xs line-through">MT {item.price}</p>
                    </>
                  ) : (
                    <p className="text-[#FF4400] font-black text-lg">MT {item.price}</p>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div 
                    className="flex-1 min-w-0 pr-2 cursor-pointer group/info"
                    onClick={(e) => {
                      if (userType === 'buyer') {
                        e.stopPropagation();
                        setViewingProfileId(item.supplierId);
                        setIsProfileModalOpen(true);
                      }
                    }}
                  >
                    <p className={`text-xs truncate font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.name}</p>
                    {userType === 'buyer' && (
                      <p className="text-[8px] font-black uppercase text-zinc-500 group-hover/info:text-brand transition-colors truncate">
                        {item.supplierName || t.viewProfile}
                      </p>
                    )}
                  </div>
                  {userType === 'supplier' && (
                    <span className={`text-[8px] font-black uppercase px-1.5 rounded shrink-0 ${item.stock > 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                      {item.stock > 0 ? `${item.stock} ${t.inStock}` : t.outOfStock}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-10 text-center">
              <p className="text-zinc-400 font-bold">{t.noProducts}</p>
            </div>
          )}
        </div>
      </div>

      {/* Personalização Rápida Section */}
      <div className={`rounded-2xl p-5 shadow-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        <div 
          onClick={() => setSelectedService(t.quickPersonalize)}
          className="flex justify-between items-center mb-1 cursor-pointer group/header"
        >
          <div className="flex items-center gap-2">
            <PencilRuler className={`w-5 h-5 transition-colors group-hover/header:text-brand ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} />
            <h2 className={`text-xl font-black tracking-tight transition-colors group-hover/header:text-brand ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.quickPersonalize}</h2>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400 group-hover/header:translate-x-1 group-hover/header:text-brand transition-all" />
        </div>
        <p className="text-zinc-500 text-sm mb-6 flex items-center gap-2 font-medium">
          {t.moqLow} <span className="text-zinc-300">•</span> {t.shippingDays} <span className="text-zinc-300">•</span> {t.trueToDesign}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {personalization.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedService(language === 'PT' ? item.badgePT : item.badgeEN)}
              className="relative group cursor-pointer"
            >
              <div className={`aspect-square rounded-xl overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
                <img 
                  src={item.image} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-zinc-900/60 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold py-1.5 px-3 rounded-lg text-center truncate">
                  {language === 'PT' ? item.badgePT : item.badgeEN}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Request Modal */}
      <AnimatePresence>
        {isEditorOpen && userType === 'supplier' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-8 rounded-[40px] relative border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}
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
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.productName}</label>
                  <input 
                    type="text"
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                    placeholder={t.placeholderProduct}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.category}</label>
                    <select 
                      value={editingProduct?.category || 'Básicos'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 appearance-none transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                    >
                      {categories.filter(c => c.PT !== 'Tudo').map(c => <option key={c.PT} value={c.PT}>{language === 'PT' ? c.PT : c.EN}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.stock}</label>
                    <input 
                      type="number"
                      value={editingProduct?.stock || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.price}</label>
                    <input 
                      type="number"
                      value={editingProduct?.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.imageUrl}</label>
                    <input 
                      type="text"
                      value={editingProduct?.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {editingProduct?.image && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-zinc-100 dark:border-zinc-800">
                    <img 
                      src={editingProduct.image} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ec3?w=600&q=80')}
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
                        onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: parseFloat(e.target.value) })}
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
                    try {
                      const data = {
                        ...editingProduct,
                        supplierId: auth.currentUser.uid,
                        updatedAt: serverTimestamp(),
                        createdAt: editingProduct.id ? (editingProduct.createdAt || serverTimestamp()) : serverTimestamp()
                      };
                      
                      if (editingProduct.id) {
                        const { id, ...rest } = data;
                        await updateDoc(doc(db, 'products', id), rest);
                      } else {
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
              className={`w-full max-w-md p-8 rounded-3xl relative ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-2xl'}`}
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
