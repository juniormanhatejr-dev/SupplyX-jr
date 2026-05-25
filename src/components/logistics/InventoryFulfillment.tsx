import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Package, Calculator, Shield, MapPin, ChevronRight, BarChart4 } from 'lucide-react';
import { StorageWarehouse } from './types';

interface InventoryFulfillmentProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  warehouses: StorageWarehouse[];
}

export default function InventoryFulfillment({
  isDarkMode,
  language,
  warehouses = []
}: InventoryFulfillmentProps) {
  // Volume cubage calculator state variables
  const [length, setLength] = useState<number>(3);
  const [width, setWidth] = useState<number>(2.4);
  const [height, setHeight] = useState<number>(2.2);
  const [quantity, setQuantity] = useState<number>(1);

  const estimatedM3 = Math.round(length * width * height * quantity * 10) / 10;

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
          🗃️ {language === 'PT' ? 'Fulfillment B2B - Alocação de Estoques' : 'B2B Warehousing & Smart Placement'}
        </h2>
        <p className="text-[10px] text-zinc-550 font-bold text-zinc-500 uppercase tracking-widest mt-1">
          Armazenamento dinâmico em terminais alfandegários e controle de cubagem pré-embarque
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core warehouse list */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Terminais de Depósito Mozambique Cadastrados:
          </p>

          <div className="space-y-4">
            {warehouses.map((wh) => (
              <div 
                key={wh.id}
                className={`p-6 rounded-[32px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                  isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150'
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-supplyx-blue/10 border border-supplyx-blue/15 flex items-center justify-center text-supplyx-blue shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white italic truncate">{wh.name}</h4>
                    <p className="text-[8.5px] font-bold text-zinc-500 uppercase flex items-center gap-1 mt-0.5 leading-none">
                      <MapPin className="w-3.5 h-3.5" /> {wh.location}
                    </p>
                  </div>
                </div>

                {/* Occupancy metrics progress tracking bar */}
                <div className="flex-1 max-w-[240px] text-left">
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase mb-1">
                    <span>Ocupação Depósito</span>
                    <span className="text-white font-black">{wh.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-supplyx-blue to-teal-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${wh.percentage}%` }}
                    />
                  </div>
                  <p className="text-[7.5px] font-bold text-zinc-650 mt-1 uppercase text-zinc-500">
                    {wh.capacityUsed} de {wh.capacityTotal} Max
                  </p>
                </div>

                <div className="text-right text-[10px] font-bold">
                  <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-zinc-400 text-[8.5px] uppercase">
                    Fiel: {wh.manager}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volume calculator simulator bar */}
        <div className={`p-6 sm:p-8 rounded-[36px] border flex flex-col justify-between ${
          isDarkMode ? 'bg-zinc-950 border-white/5 shadow-2xl' : 'bg-white border-zinc-150'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-supplyx-blue animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 leading-none">
                Calculadora de Cubagem B2B
              </h3>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="flex justify-between text-[8.5px] font-bold text-zinc-500 uppercase mb-2">
                  <span>Comprimento:</span>
                  <span className="text-white font-black">{length} metros</span>
                </label>
                <input 
                  type="range" min={1} max={15} step={0.5} value={length} 
                  onChange={(e) => setLength(parseFloat(e.target.value))} 
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-supplyx-blue"
                />
              </div>

              <div>
                <label className="flex justify-between text-[8.5px] font-bold text-zinc-500 uppercase mb-2">
                  <span>Largura do Fardo:</span>
                  <span className="text-white font-black">{width} metros</span>
                </label>
                <input 
                  type="range" min={1} max={4} step={0.1} value={width} 
                  onChange={(e) => setWidth(parseFloat(e.target.value))} 
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-supplyx-blue"
                />
              </div>

              <div>
                <label className="flex justify-between text-[8.5px] font-bold text-zinc-500 uppercase mb-2">
                  <span>Altura do Stack:</span>
                  <span className="text-white font-black">{height} metros</span>
                </label>
                <input 
                  type="range" min={1} max={4} step={0.1} value={height} 
                  onChange={(e) => setHeight(parseFloat(e.target.value))} 
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-supplyx-blue"
                />
              </div>

              <div>
                <label className="flex justify-between text-[8.5px] font-bold text-zinc-500 uppercase mb-2">
                  <span>Multiplicador Fardo Qtd:</span>
                  <span className="text-white font-black">{quantity} Unidades</span>
                </label>
                <input 
                  type="range" min={1} max={20} step={1} value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))} 
                  className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-supplyx-blue"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6 text-left">
            <span className="text-[8.5px] font-black uppercase text-zinc-500">Volume Total Previsto:</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <h3 className="text-xl sm:text-2xl font-black text-supplyx-blue italic">
                {estimatedM3} m³
              </h3>
              <span className="text-[8.5px] text-zinc-500 uppercase font-bold">Cúbicos</span>
            </div>
            <p className="text-[7.5px] text-zinc-650 uppercase font-black text-zinc-500 mt-1">Adequado para classe Volvo FH 540 ou Scania R450</p>
          </div>

        </div>

      </div>

    </div>
  );
}
