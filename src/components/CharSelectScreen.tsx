/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CharacterClass, SaveSlot } from '../types';
import { SaveSystem } from '../systems/save';
import { Swords, Wand2, ShieldAlert, Sparkles, UserPlus, Trash2, ArrowLeft } from 'lucide-react';

interface CharSelectScreenProps {
  onSelectCharacter: (slot: number, character: SaveSlot['character']) => void;
  onOpenSettings?: () => void;
}

export const CharSelectScreen: React.FC<CharSelectScreenProps> = ({
  onSelectCharacter,
}) => {
  const [saves, setSaves] = useState<{ [slot: number]: SaveSlot['character'] | null }>({});
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [newName, setNewName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('DK');

  useEffect(() => {
    // Load existing saves
    setSaves(SaveSystem.getAllSaves());
  }, [activeTab]);

  const handleSelectSlot = (slot: number) => {
    setSelectedSlot(slot);
    const existing = saves[slot];
    if (existing) {
      onSelectCharacter(slot, existing);
    } else {
      setActiveTab('create');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const formattedName = newName.trim().substring(0, 14); // original limit
    const newChar = SaveSystem.createNewCharacter(formattedName, selectedClass);
    SaveSystem.save(selectedSlot, newChar);
    
    // Notify app of selection
    onSelectCharacter(selectedSlot, newChar);
  };

  const handleDelete = (slot: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja apagar este personagem? Toda jornada sera perdida.')) {
      SaveSystem.delete(slot);
      setSaves(SaveSystem.getAllSaves());
    }
  };

  // Class description & formulas preview
  const classPreviews = {
    DK: {
      title: 'Dark Knight (DK)',
      desc: 'Mestre no combate corpo-a-corpo. Elevada Vida (HP) e Defesa. Especialista em espadas pesadas.',
      stats: { str: 28, agi: 20, vit: 25, ene: 10 },
      color: 'from-zinc-700 to-zinc-900 border-zinc-500',
      icon: <Swords className="text-zinc-400 w-12 h-12" />,
    },
    DW: {
      title: 'Dark Wizard (DW)',
      desc: 'Mago sombrio de magias elementais em area. Alta Mana e regeneracao de magias potentes.',
      stats: { str: 18, agi: 15, vit: 15, ene: 30 },
      color: 'from-blue-900 to-indigo-950 border-blue-500',
      icon: <Wand2 className="text-blue-400 w-12 h-12" />,
    },
    ELF: {
      title: 'Fairy Elf (Elf)',
      desc: 'Guerreira agil das florestas. Combate a distancia com arcos, flechas e magias curativas de suporte.',
      stats: { str: 22, agi: 25, vit: 15, ene: 15 },
      color: 'from-emerald-900 to-emerald-950 border-emerald-500',
      icon: <Sparkles className="text-emerald-400 w-12 h-12" />,
    },
    MG: {
      title: 'Magic Gladiator (MG)',
      desc: 'Guerreiro hibrido supremo. Combina magias de mago e ataques de cavaleiro. Evolucao acelerada.',
      stats: { str: 26, agi: 26, vit: 16, ene: 16 },
      color: 'from-purple-900 to-rose-950 border-purple-500',
      icon: <ShieldAlert className="text-purple-400 w-12 h-12" />,
    },
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#09090e] to-[#12121c] text-zinc-100 flex flex-col items-center justify-center p-4">
      {/* Title Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)] select-none">
          MU ONLINE
        </h1>
        <p className="text-xs tracking-[0.3em] text-amber-500/80 font-bold uppercase mt-1">
          Season 97d Mobile (Offline)
        </p>
      </div>

      {activeTab === 'select' ? (
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md border-2 border-amber-500/30 rounded-xl p-5 shadow-2xl">
          <h2 className="text-lg font-bold text-amber-400 border-b border-zinc-800 pb-2 mb-4 flex items-center justify-between">
            <span>SELECIONAR PERSONAGEM</span>
            <span className="text-xs text-zinc-500">3 Slots Disponiveis</span>
          </h2>

          <div className="space-y-4">
            {[1, 2, 3].map((slot) => {
              const char = saves[slot];
              return (
                <div
                  key={slot}
                  onClick={() => handleSelectSlot(slot)}
                  className={`relative group cursor-pointer border rounded-lg p-4 transition-all duration-300 ${
                    char 
                      ? 'bg-zinc-950/70 border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-950/25 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30'
                  }`}
                >
                  {char ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-md bg-gradient-to-br ${
                          char.class === 'DK' ? 'from-red-950/50 to-zinc-900' :
                          char.class === 'DW' ? 'from-blue-950/50 to-zinc-900' :
                          char.class === 'ELF' ? 'from-green-950/50 to-zinc-900' :
                          'from-purple-950/50 to-zinc-900'
                        } border border-zinc-800`}>
                          {char.class === 'DK' && <Swords size={20} className="text-red-400" />}
                          {char.class === 'DW' && <Wand2 size={20} className="text-blue-400" />}
                          {char.class === 'ELF' && <Sparkles size={20} className="text-emerald-400" />}
                          {char.class === 'MG' && <ShieldAlert size={20} className="text-purple-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                            {char.name}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {char.class === 'DK' ? 'Dark Knight' :
                             char.class === 'DW' ? 'Dark Wizard' :
                             char.class === 'ELF' ? 'Fairy Elf' :
                             'Magic Gladiator'} • <span className="text-amber-500 font-semibold">Level {char.level}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-500/70 font-mono font-medium">
                          {char.zen.toLocaleString()} Zen
                        </span>
                        <button
                          onClick={(e) => handleDelete(slot, e)}
                          className="p-1.5 rounded-md hover:bg-red-950/50 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Apagar Personagem"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-zinc-500 group-hover:text-amber-500/80">
                      <UserPlus size={24} className="mb-1" />
                      <p className="text-xs font-semibold uppercase tracking-wider">Criar Novo Slot {slot}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg bg-zinc-900/80 backdrop-blur-md border-2 border-amber-500/30 rounded-xl p-5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-5">
            <button
              onClick={() => setActiveTab('select')}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-bold text-amber-400">CRIAR PERSONAGEM (SLOT {selectedSlot})</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            {/* Class Choice */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Escolha a Classe
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['DK', 'DW', 'ELF', 'MG'] as CharacterClass[]).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`py-3 rounded-lg border-2 font-bold transition-all text-xs flex flex-col items-center gap-1.5 ${
                      selectedClass === cls
                        ? 'border-amber-400 bg-amber-500/10 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {cls === 'DK' && <Swords size={18} />}
                    {cls === 'DW' && <Wand2 size={18} />}
                    {cls === 'ELF' && <Sparkles size={18} />}
                    {cls === 'MG' && <ShieldAlert size={18} />}
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Class Card */}
            <div className={`p-4 rounded-lg bg-gradient-to-br ${classPreviews[selectedClass].color} border shadow-lg transition-all duration-300`}>
              <div className="flex gap-4">
                <div className="shrink-0">{classPreviews[selectedClass].icon}</div>
                <div>
                  <h3 className="font-bold text-amber-400 text-sm">
                    {classPreviews[selectedClass].title}
                  </h3>
                  <p className="text-[11px] text-zinc-300 leading-relaxed mt-1">
                    {classPreviews[selectedClass].desc}
                  </p>
                </div>
              </div>

              {/* Class base stats */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-zinc-800/60 text-center font-mono">
                <div>
                  <p className="text-[10px] text-zinc-400">FOR (STR)</p>
                  <p className="text-xs font-bold text-red-400 mt-0.5">
                    {classPreviews[selectedClass].stats.str}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">AGI (AGI)</p>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5">
                    {classPreviews[selectedClass].stats.agi}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">VIT (VIT)</p>
                  <p className="text-xs font-bold text-sky-400 mt-0.5">
                    {classPreviews[selectedClass].stats.vit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400">ENE (ENE)</p>
                  <p className="text-xs font-bold text-purple-400 mt-0.5">
                    {classPreviews[selectedClass].stats.ene}
                  </p>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Nome do Personagem
              </label>
              <input
                type="text"
                required
                maxLength={14}
                pattern="^[a-zA-Z0-9]+$"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: DarkWizard"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg py-2.5 px-4 font-mono text-zinc-100 placeholder-zinc-700 outline-none transition-all text-sm"
              />
              <span className="text-[9px] text-zinc-500 mt-1 block leading-tight">
                Apenas letras e numeros, sem espacos. Maximo de 14 caracteres.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!newName.trim()}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-zinc-950 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none rounded-lg py-3 font-bold uppercase tracking-widest text-xs"
            >
              CRIAR JORNADA
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
