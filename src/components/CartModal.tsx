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
        <div className="fixed inset-0 z-[200] flex items-center justify-end md:p-4 bg-zinc-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`w-full max-w-lg h-full md:h-[95vh] md:rounded-[40px] border flex flex-col relative ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}
          >
            {/* Header */}
            <div className={`p-8 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 text-brand rounded-xl">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {t.title}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">{items.length} {t.itemsSelected}</p>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag className="w-16 h-16 text-zinc-300 mb-4" />
                  <p className={`font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    {t.empty}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-500 mt-2">{t.addItems}</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={`flex gap-4 p-4 rounded-3xl border transition-all ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-xs font-black uppercase tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[8px] font-black uppercase text-zinc-500 mb-3">{item.supplierName}</p>
                      
                      <div className="flex items-center justify-between">
                         <div className={`flex items-center gap-2 p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-zinc-50 text-zinc-900'}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={`text-[10px] font-bold w-4 text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-zinc-50 text-zinc-900'}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className={`text-xs font-black italic ${isDarkMode ? 'text-brand' : 'text-brand'}`}>MT {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className={`p-8 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.totalEstimated}</p>
                   <p className={`text-3xl font-black italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>MT {total.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t.secure}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={clearCart}
                  className={`flex-1 py-4 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    isDarkMode ? 'border-zinc-800 text-zinc-500 hover:bg-zinc-800' : 'border-zinc-100 text-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  {t.clear}
                </button>
                <button 
                  disabled={items.length === 0}
                  className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-xl transition-all flex items-center justify-center gap-3 ${
                    items.length === 0 ? 'bg-zinc-500 text-white opacity-50 cursor-not-allowed' :
                    'bg-zinc-950 text-white hover:bg-zinc-800 active:scale-95'
                  }`}
                >
                  {t.checkout}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
