import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Skull, RefreshCw } from 'lucide-react';

interface LobbyProps {
  botCount: number;
  setBotCount: (count: number) => void;
  selectedCharId: string;
  setSelectedCharId: (id: string) => void;
  characters: any[];
  bots: any[];
  onStart: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ 
  botCount, setBotCount, selectedCharId, setSelectedCharId, characters, bots, onStart 
}) => {
  return (
    <motion.div 
      key="lobby"
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 1.1 }}
      className="relative z-10 w-full max-w-2xl p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl text-center"
    >
      <h1 className="text-6xl font-black mb-2 tracking-tighter text-starwars-yellow uppercase">
        UNO <span className="block text-3xl text-white opacity-90 -mt-2">NO MERCY</span>
      </h1>
      <p className="text-slate-400 mb-8 font-medium">A versão mais implacável do clássico, agora em uma galáxia distante.</p>
      
      <div className="space-y-8 mb-10">
        <section className="text-left">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-jedi-blue mb-4">Escolha seu Herói</h3>
          <div className="grid grid-cols-4 gap-4">
            {characters.map(char => (
              <button 
                key={char.id} 
                onClick={() => setSelectedCharId(char.id)}
                className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${selectedCharId === char.id ? 'bg-jedi-blue/20 ring-1 ring-jedi-blue shadow-[0_0_20px_rgba(0,247,255,0.2)]' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <img src={char.avatar} alt={char.name} className={`w-14 h-14 rounded-full border-2 transition-transform group-hover:scale-105 ${selectedCharId === char.id ? 'border-jedi-blue' : 'border-transparent'}`} />
                <span className="text-[10px] font-bold text-center leading-tight uppercase opacity-80">{char.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-jedi-blue">Oponentes do Império</h3>
            <span className="text-sm font-bold text-starwars-yellow">{botCount} Bots</span>
          </div>
          <div className="relative flex items-center gap-4 mb-8">
            <span className="text-[10px] font-black text-white/20">1</span>
            <input 
              type="range" min="1" max="6" value={botCount} 
              onChange={(e) => setBotCount(parseInt(e.target.value))}
              className="flex-1 custom-range"
            />
            <span className="text-[10px] font-black text-white/20">6</span>
          </div>
          <div className="flex justify-center gap-3 min-h-[40px]">
            {bots.map((bot, index) => (
              <motion.img 
                layout 
                key={bot.id} 
                src={bot.avatar} 
                className={`w-10 h-10 rounded-full border transition-all duration-500 ${
                  index < botCount 
                    ? 'border-starwars-yellow opacity-100 grayscale-0 scale-110 shadow-[0_0_15px_rgba(255,232,31,0.4)]' 
                    : 'border-white/10 opacity-20 grayscale'
                }`} 
              />
            ))}
          </div>
        </section>
      </div>

      <button 
        onClick={onStart}
        className="w-full py-4 bg-transparent border-2 border-starwars-yellow text-starwars-yellow font-black text-lg tracking-[0.2em] uppercase rounded-xl hover:bg-starwars-yellow hover:text-black transition-all shadow-[0_0_15px_rgba(255,232,31,0.2)] hover:shadow-[0_0_30px_rgba(255,232,31,0.4)] mb-8"
      >
        Iniciar Duelo
      </button>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider justify-center"><Zap size={14} className="text-starwars-yellow" /> Stacking</div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider justify-center"><Skull size={14} className="text-sith-red" /> 25 Cartas</div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider justify-center"><RefreshCw size={14} className="text-jedi-blue" /> Regras 7/0</div>
      </div>
    </motion.div>
  );
};

export default Lobby;
