import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Truck, Star, CheckCircle, PlusCircle, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { CommercialDriver } from './types';

interface DriversSystemProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  drivers: CommercialDriver[];
  onAddDriver: (newDriver: CommercialDriver) => void;
}

export default function DriversSystem({
  isDarkMode,
  language,
  drivers = [],
  onAddDriver
}: DriversSystemProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    licenseId: '',
    vehicle: 'Volvo FH 540',
    capacity: '32 Toneladas',
    location: 'Maputo Port, Moçambique',
    status: 'Disponível'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.licenseId) return;

    const driverObj: CommercialDriver = {
      id: `DR-0${drivers.length + 1}`,
      name: newDriver.name,
      licenseId: newDriver.licenseId,
      vehicle: newDriver.vehicle,
      capacity: newDriver.capacity,
      location: newDriver.location,
      status: newDriver.status,
      rating: 5.0,
      trips: 0
    };

    onAddDriver(driverObj);
    setShowAddForm(false);
    setNewDriver({
      name: '',
      licenseId: '',
      vehicle: 'Volvo FH 540',
      capacity: '32 Toneladas',
      location: 'Maputo Port, Moçambique',
      status: 'Disponível'
    });
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* Top Banner and Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
            🚗 {language === 'PT' ? 'Central de Motoristas de Frotas' : 'Commercial Driver Workspace'}
          </h2>
          <p className="text-[10px] text-zinc-550 font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">
            Homologação, averbação de licenças e acompanhamento de frotas ativas
          </p>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-supplyx-blue hover:brightness-110 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all"
        >
          {showAddForm ? (language === 'PT' ? 'Fechar Cadastro' : 'Close Registry') : `+ ${language === 'PT' ? 'Cadastrar Motorista' : 'Onboard Driver'}`}
        </button>
      </div>

      {/* Driver expansion form */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-3xl border ${
            isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150'
          }`}
        >
          <div className="mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-supplyx-blue">
              {language === 'PT' ? 'Averbação de Novo Transportador' : 'New Hauler Credentials Registration'}
            </h4>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8.5px] font-black uppercase text-zinc-500 pl-1">Nome Completo do Motorista *</label>
              <input 
                required
                type="text" 
                value={newDriver.name}
                onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none"
                placeholder="Ex: Armando Nhacula"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8.5px] font-black uppercase text-zinc-500 pl-1">Código Carta de Condução (INATRO Code) *</label>
              <input 
                required
                type="text" 
                value={newDriver.licenseId}
                onChange={(e) => setNewDriver({ ...newDriver, licenseId: e.target.value })}
                className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none"
                placeholder="Ex: MC-87983-C"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-zinc-500 pl-1">Classe Veículo</label>
                <input 
                  type="text" 
                  value={newDriver.vehicle}
                  onChange={(e) => setNewDriver({ ...newDriver, vehicle: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-zinc-500 pl-1">Capacidade de Carga (Tons)</label>
                <input 
                  type="text" 
                  value={newDriver.capacity}
                  onChange={(e) => setNewDriver({ ...newDriver, capacity: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-zinc-500 pl-1">Base Logística / Parque de Estacionamento</label>
                <input 
                  type="text" 
                  value={newDriver.location}
                  onChange={(e) => setNewDriver({ ...newDriver, location: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-zinc-500 pl-1">Status Operativo de Entrada</label>
                <select 
                  value={newDriver.status}
                  onChange={(e) => setNewDriver({ ...newDriver, status: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white"
                >
                  <option value="Disponível">Disponível para Viagem</option>
                  <option value="Em Descanso">Em Intervalo / Folga</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="md:col-span-2 py-4 bg-supplyx-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest mt-4"
            >
              Homologar e Habilitar Viagens
            </button>
          </form>
        </motion.div>
      )}

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((drv) => (
          <div 
            key={drv.id}
            className={`p-6 rounded-[28px] border flex flex-col justify-between min-h-[190px] ${
              isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-supplyx-blue/10 border border-supplyx-blue/15 flex items-center justify-center text-supplyx-blue">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white italic">{drv.name}</h4>
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Carta: {drv.licenseId}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                  drv.status === 'Disponível'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : drv.status === 'Em Trânsito'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                      : 'bg-zinc-800 text-zinc-450 border-white/5'
                }`}>
                  {drv.status}
                </span>
              </div>

              <div className="space-y-2 text-left">
                <p className="text-[9.5px] font-bold text-zinc-300 flex items-center gap-1.5 leading-none">
                  <Truck className="w-3.5 h-3.5 text-zinc-455" /> {drv.vehicle} • <span className="text-supplyx-blue">{drv.capacity}</span>
                </p>
                <p className="text-[9.5px] font-bold text-zinc-500 flex items-center gap-1.5 leading-none">
                  <MapPin className="w-3.5 h-3.5 text-zinc-650" /> {drv.location}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/[0.03] text-[9.5px] font-bold">
              <span className="text-zinc-500 uppercase">Aprovado INATRO: SIM</span>
              <span className="text-amber-500 font-black flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-500 shrink-0" /> {drv.rating} • {drv.trips} Trips
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
