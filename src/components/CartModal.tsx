import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
}

export default function CartModal({ isOpen, onClose, isDarkMode, language = 'PT' }: CartModalProps) {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();

  const t = {
    PT: {
      title: 'Meu Carrinho',
      itemsSelected: 'ITENS SELECIONADOS',
      empty: 'CARRINHO VAZIO',
      addItems: 'ADICIONE MATERIAIS PARA CONTINUAR',
      totalEstimated: 'Total Estimado',
      secure: 'Seguro SupplyX',
      clear: 'Limpar',
      checkout: 'Finalizar Pedido'
    },
    EN: {
      title: 'My Cart',
      itemsSelected: 'ITEMS SELECTED',
      empty: 'CART EMPTY',
      addItems: 'ADD MATERIALS TO CONTINUE',
      totalEstimated: 'Total Estimated',
      secure: 'SupplyX Secure',
      clear: 'Clear',
      checkout: 'Finalize Order'
    }
  }[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end md:p-6 bg-supplyx-deep/90 backdrop-blur-xl">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`w-full max-w-xl h-full md:h-[95vh] md:rounded-[48px] border flex flex-col relative z-50 overflow-hidden ${isDarkMode ? 'bg-supplyx-dark border-white/5 shadow-3xl' : 'bg-white border-zinc-100 shadow-2xl'}`}
          >
            {/* Header */}
            <div className={`p-10 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-supplyx-blue/10 text-supplyx-blue rounded-2xl shadow-inner">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h2 className={`text-2xl font-black italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {t.title}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${isDarkMode ? 'hover:bg-white/10 text-zinc-500 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] inline-block px-3 py-1 bg-white/5 rounded-lg border border-white/5">{items.length} {t.itemsSelected}</p>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
                    <ShoppingBag className="w-12 h-12 text-zinc-700" />
                    <div className="absolute inset-0 bg-supplyx-blue/5 blur-[40px] rounded-full animate-pulse-slow" />
                  </div>
                  <p className={`text-xl font-black italic uppercase tracking-widest ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    {t.empty}
                  </p>
                  <p className="text-[10px] font-black text-zinc-600 mt-4 uppercase tracking-[0.2em]">{t.addItems}</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={`flex gap-6 p-6 rounded-[32px] border transition-all duration-300 group ${isDarkMode ? 'bg-white/[0.02] border-white/5 hover:border-supplyx-blue/50 hover:bg-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="w-24 h-24 rounded-[20px] overflow-hidden shrink-0 shadow-2xl relative">
                      <OptimizedImage src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" containerClassName="w-full h-full" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col pt-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-sm font-black uppercase italic tracking-tight truncate pr-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-auto flex items-center gap-2">
                        <div className="w-1 h-1 bg-supplyx-blue rounded-full" />
                        {item.supplierName}
                      </p>
                      
                      <div className="flex items-center justify-between mt-6 pr-2">
                         <div className={`flex items-center gap-3 p-1.5 rounded-[18px] border ${isDarkMode ? 'bg-supplyx-deep border-white/5' : 'bg-white border-zinc-200'}`}>
                          <button 
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-zinc-400 disabled:opacity-30' : 'hover:bg-zinc-50 text-zinc-900'}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className={`text-[11px] font-black w-6 text-center italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-50 text-zinc-900'}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className={`text-sm font-black italic tracking-tighter ${isDarkMode ? 'text-supplyx-blue' : 'text-supplyx-blue'}`}>MT {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className={`p-10 border-t ${isDarkMode ? 'border-white/5 bg-white/5 shadow-inner' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                   <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{t.totalEstimated}</p>
                   <p className={`text-4xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    <span className="text-supplyx-blue text-lg mr-2 uppercase not-italic font-black">MT</span>
                    {total.toLocaleString()}
                   </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-400/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t.secure}</span>
                </div>
              </div>

              <div className="flex gap-6">
                <button 
                  onClick={clearCart}
                  className={`flex-1 h-16 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border-2 ${
                    isDarkMode ? 'border-white/5 text-zinc-500 hover:text-white hover:bg-white/5' : 'border-zinc-100 text-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  {t.clear}
                </button>
                <button 
                  disabled={items.length === 0}
                  className={`flex-[2] h-16 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] italic shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-4 ${
                    items.length === 0 ? 'bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed' :
                    'bg-supplyx-blue text-white hover:bg-blue-600 hover:scale-105 active:scale-95'
                  }`}
                >
                  {t.checkout}
                  <ArrowRight className="w-5 h-5 bg-white/20 p-1 rounded-full" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
