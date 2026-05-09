import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingCart, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Box,
  MessageSquare,
  ArrowLeft,
  User
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import ProfileModal from './ProfileModal';

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
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  isDarkMode?: boolean;
  onStartChat: (product: any) => void;
}

export default function ProductDetailModal({ product, isOpen, onClose, onEdit, isDarkMode, onStartChat, language = 'PT' }: ProductDetailModalProps & { language?: 'PT' | 'EN' }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const t = {
    PT: {
      back: 'Voltar',
      verified: 'Verificado',
      taxIncluded: 'Iva Incluído • Preço por unidade',
      description: 'Descrição Detalhada',
      delivery: 'Entrega',
      stock: 'Stock',
      available: 'disponíveis',
      noStock: 'Sem stock',
      addToCart: 'Adicionar ao Carrinho',
      added: 'Adicionado!',
      negotiate: 'Negociar Preço',
      viewProfile: 'Ver Perfil',
      fallbackDescription: 'Este produto de alta qualidade é essencial para garantir a durabilidade e eficiência em sua obra. Fabricado sob rigorosos padrões de segurança e qualidade moçambicana.',
      supplier: 'Fornecedor',
      sale: 'Oferta Especial',
      deliveryTime: '24h - 48h Maputo'
    },
    EN: {
      back: 'Back',
      verified: 'Verified',
      taxIncluded: 'Tax Included • Price per unit',
      description: 'Detailed Description',
      delivery: 'Delivery',
      stock: 'Stock',
      available: 'available',
      noStock: 'Out of stock',
      addToCart: 'Add to Cart',
      added: 'Added!',
      negotiate: 'Negotiate Price',
      viewProfile: 'View Profile',
      fallbackDescription: 'This high-quality product is essential to ensure durability and efficiency in your construction. Manufactured under strict Mozambican safety and quality standards.',
      supplier: 'Supplier',
      sale: 'Special Offer',
      deliveryTime: '24h - 48h Maputo'
    }
  }[language];

  if (!product) return null;

  const currentPrice = product.onSale ? product.salePrice : product.price;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      quantity: quantity,
      image: product.image,
      supplierId: product.supplierId,
      supplierName: product.supplierName || t.supplier
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`w-full max-w-4xl rounded-[40px] overflow-hidden border flex flex-col md:flex-row relative ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-zinc-950/20 hover:bg-zinc-950/40 text-white transition-colors z-20 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Image */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto h-auto md:h-full relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {product.onSale && (
                  <div className="absolute top-6 left-6 bg-red-600 text-white text-xs font-black uppercase px-3 py-1.5 rounded-xl shadow-lg">
                    {t.sale}
                  </div>
                )}
            </div>

            {/* Right: Content */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto max-h-[70vh] md:max-h-[90vh]">
               <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={onClose}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.back}
                </button>
                
                <button 
                  onClick={onClose}
                  className={`p-2 rounded-full hidden md:flex transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-brand/10 text-brand' : 'bg-brand/5 text-brand'}`}>
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> {t.verified}
                  </div>
                </div>
                <h2 className={`text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {product.name}
                </h2>
                
                <div className="flex items-center gap-4 mb-2">
                    <p className="text-3xl font-black text-brand italic">MT {currentPrice.toLocaleString()}</p>
                    {product.onSale && (
                      <p className="text-zinc-500 line-through font-bold">MT {product.price.toLocaleString()}</p>
                    )}
                </div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{t.taxIncluded}</p>
              </div>

              <div className="space-y-6 mb-10">
                <div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{t.description}</h3>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {product.description || t.fallbackDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="flex items-center gap-2 mb-1 text-zinc-500">
                      <Truck className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{t.delivery}</span>
                    </div>
                    <p className={`text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.deliveryTime}</p>
                  </div>
                  <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="flex items-center gap-2 mb-1 text-zinc-500">
                      <Box className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{t.stock}</span>
                    </div>
                    <p className={`text-[10px] font-bold ${product.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {product.stock > 0 ? `${product.stock} ${t.available}` : t.noStock}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className={`flex items-center gap-3 p-2 rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-white border-transparent hover:border-zinc-200 text-zinc-900'}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className={`w-8 text-center font-black italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                      className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-white border-transparent hover:border-zinc-200 text-zinc-900'}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-xl transition-all flex items-center justify-center gap-3 ${
                      added ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                      product.stock === 0 ? 'bg-zinc-500 text-white opacity-50 cursor-not-allowed' :
                      'bg-brand text-white shadow-brand/20 hover:brightness-110 active:scale-95'
                    }`}
                  >
                    {added ? <ShieldCheck className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    {added ? t.added : t.addToCart}
                  </button>
                </div>

                <div className="flex gap-3">
                   <button 
                    onClick={() => onStartChat(product)}
                    className={`flex-1 py-4 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest italic transition-all flex items-center justify-center gap-3 ${
                      isDarkMode ? 'border-zinc-800 text-white hover:bg-zinc-800' : 'border-zinc-100 text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t.negotiate}
                  </button>
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className={`px-6 py-4 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest italic transition-all flex items-center justify-center gap-3 ${
                      isDarkMode ? 'border-zinc-800 text-brand hover:bg-zinc-800' : 'border-zinc-100 text-brand hover:bg-brand/5'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {t.viewProfile}
                  </button>
                </div>
              </div>
            </div>

            <ProfileModal 
              userId={product.supplierId}
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              onEdit={onEdit}
              isDarkMode={isDarkMode}
              language={language}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
