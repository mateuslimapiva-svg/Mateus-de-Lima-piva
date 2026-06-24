/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CharacterClass, SaveSlot, Item, Skill } from './types';
import { SaveSystem } from './systems/save';
import { getSkillsForClass } from './data/skills';
import { GameCanvas } from './game/GameCanvas';
import { GameScene } from './game/PhaserGame';
import { CharSelectScreen } from './components/CharSelectScreen';
import { HUDOverlays } from './components/HUDOverlays';
import { audioManager } from './systems/audio';
import { Swords, Shield, Heart, Zap, Sparkles, MessageSquare, Award, Settings, User, ShoppingBag, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [character, setCharacter] = useState<SaveSlot['character'] | null>(null);

  // Core gameplay live values synced with Phaser
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [mp, setMp] = useState(50);
  const [maxMp, setMaxMp] = useState(50);
  const [ag, setAg] = useState(100);
  const [maxAg, setMaxAg] = useState(100);
  const [expPercent, setExpPercent] = useState(0);

  // Active equipped skill on Skill Bar
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [skillCooldowns, setSkillCooldowns] = useState<{ [skillId: string]: number }>({});

  // Chat Logs
  const [chatLogs, setChatLogs] = useState<{ text: string; color: string; id: string }[]>([
    { text: 'Seja bem-vindo ao MU Online 97d Mobile Offline!', color: '#ffaa00', id: 'welcome_1' },
    { text: 'Arraste o analogico para caminhar. Toque no shop para reabastecer.', color: '#00ccff', id: 'welcome_2' },
  ]);

  // Panels HUD overlays state
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<'inventory' | 'stats' | 'shop' | 'settings' | null>(null);

  // Character Death
  const [isDead, setIsDead] = useState(false);

  // Phaser Scenes refs
  const phaserGameRef = useRef<any>(null);
  const phaserSceneRef = useRef<GameScene | null>(null);

  // Load last played slot on launch
  useEffect(() => {
    audioManager.init();
    const lastSlot = SaveSystem.getLastPlayedSlot();
    const lastSave = SaveSystem.load(lastSlot);
    if (lastSave) {
      setActiveSlot(lastSlot);
      setCharacter(lastSave.character);
    }
  }, []);

  // Continuous auto-save timer (every 60 seconds)
  useEffect(() => {
    if (!character || !activeSlot) return;
    const interval = setInterval(() => {
      SaveSystem.save(activeSlot, character);
      addLogMessage('Progresso salvo automaticamente!', '#00ff88');
    }, 60000);
    return () => clearInterval(interval);
  }, [character, activeSlot]);

  // Skill cooldown ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setSkillCooldowns((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) {
            next[k] = Math.max(0, next[k] - 100);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Logger helper
  const addLogMessage = (text: string, color = '#ffffff') => {
    setChatLogs((prev) => [
      ...prev.slice(-35), // Keep last 35 messages
      { text, color, id: Math.random().toString(36).substring(2, 9) },
    ]);
  };

  // PHASER BRIDGE RECIPIENT CALLBACKS
  const handlePhaserInit = (game: any, scene: GameScene | null) => {
    phaserGameRef.current = game;
    phaserSceneRef.current = scene;

    if (scene && character) {
      // Set initial skill to the first unlocked if available
      const skills = getSkillsForClass(character.class);
      const unlocked = skills.filter((s) => character.skills.includes(s.id) || s.levelReq <= character.level);
      if (unlocked.length > 0) {
        setActiveSkillId(unlocked[0].id);
        scene.equipSkill(unlocked[0].id);
      }
    }
  };

  const bridgeCallbacks = {
    onHpMpChange: (hpVal: number, maxHpVal: number, mpVal: number, maxMpVal: number, agVal: number, maxAgVal: number) => {
      setHp(hpVal);
      setMaxHp(maxHpVal);
      setMp(mpVal);
      setMaxMp(maxMpVal);
      setAg(agVal);
      setMaxAg(maxAgVal);

      // Low HP Alarm Vibrate (if mobile supported)
      if (hpVal > 0 && hpVal < maxHpVal * 0.20 && Math.random() < 0.15) {
        if (navigator.vibrate) navigator.vibrate(80);
      }
    },

    onLootPickup: (item: Item) => {
      // Place item in inventory
      setCharacter((prev: any) => {
        if (!prev) return prev;
        const nextInv = [...prev.inventory];
        const freeIdx = nextInv.findIndex((i) => i === null);
        if (freeIdx !== -1) {
          nextInv[freeIdx] = item;
        }
        return { ...prev, inventory: nextInv };
      });
    },

    onZenPickup: (amount: number) => {
      setCharacter((prev: any) => {
        if (!prev) return prev;
        return { ...prev, zen: prev.zen + amount };
      });
    },

    onExpGain: (amount: number, currentExp: number, nextLevelExp: number) => {
      setExpPercent(Math.min(100, (currentExp / nextLevelExp) * 100));
      setCharacter((prev: any) => {
        if (!prev) return prev;
        return { ...prev, exp: currentExp };
      });
    },

    onLevelUp: (level: number, freePoints: number) => {
      setCharacter((prev: any) => {
        if (!prev) return prev;
        // Unlock appropriate skills on level up
        const availableSkills = getSkillsForClass(prev.class);
        const unlockedSkills = [...prev.skills];
        availableSkills.forEach((s) => {
          if (s.levelReq <= level && !unlockedSkills.includes(s.id)) {
            unlockedSkills.push(s.id);
            addLogMessage(`Habilidade liberada: ${s.name}!`, '#e040fb');
          }
        });

        return {
          ...prev,
          level,
          freePoints,
          skills: unlockedSkills,
        };
      });
    },

    onLogMessage: (msg: string, color?: string) => {
      addLogMessage(msg, color);
    },

    onPlayerDeath: () => {
      setIsDead(true);
    },

    onMapLoaded: (mapId: 'Lorencia' | 'Dungeon' | 'Devias') => {
      setCharacter((prev: any) => {
        if (!prev) return prev;
        return { ...prev, currentMap: mapId };
      });
    },
  };

  // CHARACTER STATE PROPAGATOR
  const handleUpdateCharacter = (updater: (prev: any) => any) => {
    setCharacter((prev) => {
      const next = updater(prev);
      if (next && activeSlot) {
        // Save automatically on updates
        SaveSystem.save(activeSlot, next);
      }
      return next;
    });
  };

  const handleSelectCharacter = (slot: number, char: SaveSlot['character']) => {
    setActiveSlot(slot);
    setCharacter(char);
    setIsDead(false);
    audioManager.init();
  };

  // COMBAT TRIGGERS
  const triggerAttack = () => {
    if (isDead || !phaserSceneRef.current) return;
    phaserSceneRef.current.triggerDirectAttack();
  };

  const selectSkill = (skillId: string) => {
    if (isDead) return;
    setActiveSkillId(skillId);
    if (phaserSceneRef.current) {
      phaserSceneRef.current.equipSkill(skillId);
    }
    addLogMessage(`Habilidade equipada: ${skillId.replace('_', ' ').toUpperCase()}`, '#00ffcc');
  };

  const handleDrinkHpPot = () => {
    if (isDead || !character) return;
    // Find index of first HP potion
    const idx = character.inventory.findIndex((i) => i && i.type === 'potion' && !i.name.includes('MP') && !i.name.includes('mana'));
    if (idx === -1) {
      addLogMessage('Nao possui Poção de HP na mochila!', '#ff3333');
      return;
    }

    const item = character.inventory[idx]!;
    const healAmt = item.name.includes('(M)') ? 150 : item.name.includes('(L)') ? 350 : 50;

    if (phaserSceneRef.current) {
      phaserSceneRef.current.triggerHealPotion(healAmt);
    }

    // Decrement item stack count
    handleUpdateCharacter((prev) => {
      const nextInv = [...prev.inventory];
      const target = nextInv[idx];
      if (target) {
        if (target.stackCount && target.stackCount > 1) {
          nextInv[idx] = { ...target, stackCount: target.stackCount - 1 };
        } else {
          nextInv[idx] = null;
        }
      }
      return { ...prev, inventory: nextInv };
    });
  };

  const handleDrinkMpPot = () => {
    if (isDead || !character) return;
    const idx = character.inventory.findIndex((i) => i && i.type === 'potion' && (i.name.includes('MP') || i.name.includes('mana')));
    if (idx === -1) {
      addLogMessage('Nao possui Poção de Mana na mochila!', '#ff3333');
      return;
    }

    const item = character.inventory[idx]!;
    const restoreAmt = item.name.includes('(M)') ? 120 : 50;

    if (phaserSceneRef.current) {
      phaserSceneRef.current.triggerManaPotion(restoreAmt);
    }

    handleUpdateCharacter((prev) => {
      const nextInv = [...prev.inventory];
      const target = nextInv[idx];
      if (target) {
        if (target.stackCount && target.stackCount > 1) {
          nextInv[idx] = { ...target, stackCount: target.stackCount - 1 };
        } else {
          nextInv[idx] = null;
        }
      }
      return { ...prev, inventory: nextInv };
    });
  };

  const handleRevive = () => {
    setIsDead(false);
    if (phaserSceneRef.current) {
      phaserSceneRef.current.respawn();
    }
    addLogMessage('Voce reviveu na cidade de Lorencia.', '#00ff44');
  };

  const handleMapPortal = (mapId: 'Lorencia' | 'Dungeon' | 'Devias') => {
    if (phaserSceneRef.current) {
      phaserSceneRef.current.changeMap(mapId);
      setCharacter((prev: any) => ({ ...prev, currentMap: mapId }));
      setPanelOpen(false);
      addLogMessage(`Teleportou para: ${mapId}`, '#00ffff');
    }
  };

  // Open HUD panels tabs helper
  const openHUDPanel = (p: 'inventory' | 'stats' | 'shop' | 'settings') => {
    setActivePanel(p);
    setPanelOpen(true);
  };

  // If no character loaded, show selection screen
  if (!character) {
    return <CharSelectScreen onSelectCharacter={handleSelectCharacter} />;
  }

  // Get active skills list for bar
  const classSkills = getSkillsForClass(character.class);
  const unlockedSkills = classSkills.filter((s) => s.levelReq <= character.level);

  // Count potions available
  const hpPotCount = character.inventory.filter((i) => i && i.type === 'potion' && !i.name.includes('MP') && !i.name.includes('mana')).reduce((acc, curr) => acc + (curr?.stackCount || 1), 0);
  const mpPotCount = character.inventory.filter((i) => i && i.type === 'potion' && (i.name.includes('MP') || i.name.includes('mana'))).reduce((acc, curr) => acc + (curr?.stackCount || 1), 0);

  return (
    <div className="w-full h-screen bg-[#07070b] text-zinc-100 flex flex-col justify-between overflow-hidden relative select-none">
      
      {/* HEADER HUD: Player statistics panel (HP, MP, Stamina, EXP) */}
      <div className="bg-zinc-950/80 backdrop-blur-sm border-b border-amber-500/10 px-4 py-2 shrink-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-md bg-gradient-to-br ${
            character.class === 'DK' ? 'from-red-950 to-zinc-900' :
            character.class === 'DW' ? 'from-blue-950 to-zinc-900' :
            character.class === 'ELF' ? 'from-emerald-950 to-zinc-900' :
            'from-purple-950 to-zinc-900'
          } border border-zinc-800 flex items-center justify-center font-black text-xs text-zinc-300`}>
            {character.class}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-zinc-100">{character.name}</span>
              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1 py-0.2">
                Lv {character.level}
              </span>
            </div>
            
            {/* Map portal trigger */}
            <p className="text-[10px] font-mono text-sky-400 font-semibold">{character.currentMap}</p>
          </div>
        </div>

        {/* Global HUD Nav Buttons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => openHUDPanel('stats')}
            className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-400/40 text-zinc-300 active:scale-95 transition-all"
            title="Dados & Stats"
          >
            <User size={16} />
          </button>
          <button 
            onClick={() => openHUDPanel('inventory')}
            className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-400/40 text-zinc-300 active:scale-95 transition-all"
            title="Inventario"
          >
            <ShoppingBag size={16} />
          </button>
          <button 
            onClick={() => openHUDPanel('settings')}
            className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-400/40 text-zinc-300 active:scale-95 transition-all"
            title="Configurações"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* CORE FRAME: Phaser viewport + overlays */}
      <div className="flex-1 relative w-full overflow-hidden flex flex-col justify-end bg-black">
        
        {/* Phaser Canvas wrapper Component */}
        <GameCanvas
          characterData={character}
          onBridgeInit={handlePhaserInit}
          bridgeCallbacks={bridgeCallbacks}
        />

        {/* Real-time system log logs chat layer (bottom left viewport overlap) */}
        <div className="absolute bottom-4 left-4 z-10 w-full max-w-[280px] pointer-events-none">
          <div className="bg-black/40 backdrop-blur-[1px] border border-zinc-900/40 rounded-lg p-2 max-h-[110px] overflow-y-auto space-y-1 scrollbar-none flex flex-col justify-end">
            {chatLogs.slice(-4).map((log) => (
              <p
                key={log.id}
                className="text-[10px] font-mono leading-tight font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,1)] truncate"
                style={{ color: log.color }}
              >
                {log.text}
              </p>
            ))}
          </div>
        </div>

        {/* COMBAT HUD CONTROLLERS (Right thumb panel overlap) */}
        <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-3 select-none">
          
          {/* Quick HP / MP Potion Belt */}
          <div className="flex gap-2">
            
            {/* HP Consumable */}
            <button
              onClick={handleDrinkHpPot}
              className="relative w-12 h-12 rounded-full border border-red-500/40 bg-gradient-to-b from-red-900/40 to-red-950/80 flex flex-col items-center justify-center active:scale-90 transition-all shadow-md group"
            >
              <Heart size={16} className="text-red-400 animate-pulse" />
              <span className="text-[8px] font-bold font-mono text-red-200 mt-0.5">HP ({hpPotCount})</span>
              <span className="absolute -top-1.5 -right-1 bg-red-600 text-[8px] font-mono text-white px-1 rounded-full border border-red-500 font-bold">Q</span>
            </button>

            {/* MP Consumable */}
            <button
              onClick={handleDrinkMpPot}
              className="relative w-12 h-12 rounded-full border border-blue-500/40 bg-gradient-to-b from-blue-900/40 to-blue-950/80 flex flex-col items-center justify-center active:scale-90 transition-all shadow-md group"
            >
              <Zap size={16} className="text-blue-400" />
              <span className="text-[8px] font-bold font-mono text-blue-200 mt-0.5">MP ({mpPotCount})</span>
              <span className="absolute -top-1.5 -right-1 bg-blue-600 text-[8px] font-mono text-white px-1 rounded-full border border-blue-500 font-bold">W</span>
            </button>

          </div>

          {/* Core Trigger Sword Slash Pad */}
          <button
            onClick={triggerAttack}
            className="w-18 h-18 rounded-full border-2 border-amber-500 bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:brightness-110 active:scale-90 transition-all flex items-center justify-center shadow-2xl shadow-red-500/20 text-zinc-950 select-none touch-none"
          >
            <Swords size={28} className="text-zinc-950" />
          </button>
        </div>

        {/* EXP Progress percentage strip at the bottom of gameplay canvas */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-900 z-10">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all duration-300"
            style={{ width: `${expPercent}%` }}
          />
        </div>

      </div>

      {/* FOOTER HUD: HP/MP/AG globes + skill selection belt */}
      <div className="bg-zinc-950 border-t border-amber-500/10 p-3 shrink-0 z-20 flex flex-col md:flex-row items-center gap-4 justify-between">
        
        {/* Core globes panel values (HP on Left, MP on Right) */}
        <div className="flex gap-4 w-full md:w-auto justify-between md:justify-start">
          
          {/* HP Globe */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full border border-red-500/40 bg-zinc-950 overflow-hidden shadow-inner">
              <div
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-red-800 to-red-500 transition-all duration-300"
                style={{ height: `${Math.max(0, (hp / maxHp) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold font-mono text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                {hp}
              </div>
            </div>
            <div className="text-left font-mono">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">HP Vitalidade</p>
              <p className="text-xs font-bold text-red-400">{hp} / {maxHp}</p>
            </div>
          </div>

          {/* AG / Stamina Bar (Ciano) */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full border border-cyan-500/40 bg-zinc-950 overflow-hidden shadow-inner">
              <div
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-800 to-cyan-500 transition-all duration-300"
                style={{ height: `${Math.max(0, (ag / maxAg) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold font-mono text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                {ag}
              </div>
            </div>
            <div className="text-left font-mono">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">AG Stamina</p>
              <p className="text-xs font-bold text-cyan-400">{ag} / {maxAg}</p>
            </div>
          </div>

          {/* MP Globe */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full border border-blue-500/40 bg-zinc-950 overflow-hidden shadow-inner">
              <div
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-800 to-blue-500 transition-all duration-300"
                style={{ height: `${Math.max(0, (mp / maxMp) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold font-mono text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                {mp}
              </div>
            </div>
            <div className="text-left font-mono">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">MP Mana</p>
              <p className="text-xs font-bold text-blue-400">{mp} / {maxMp}</p>
            </div>
          </div>

        </div>

        {/* Skill bar belt (F1 to F6 mapped quick selections) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center overflow-x-auto py-1 scrollbar-none">
          {unlockedSkills.slice(0, 6).map((skill, index) => {
            const isEquipped = activeSkillId === skill.id;
            return (
              <div
                key={skill.id}
                onClick={() => selectSkill(skill.id)}
                className={`relative w-11 h-11 rounded-lg border cursor-pointer flex flex-col items-center justify-center p-0.5 transition-all ${
                  isEquipped
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                {/* Numeric key bindings */}
                <span className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-zinc-500">
                  {index + 1}
                </span>

                <span className={`text-[8px] font-bold text-center leading-tight truncate w-full ${isEquipped ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {skill.name.split(' ')[0]}
                </span>

                {/* MP/AG requirement labels */}
                <span className="text-[7px] font-mono text-zinc-500 mt-1 block">
                  {skill.mpCost} MP
                </span>
              </div>
            );
          })}

          {unlockedSkills.length === 0 && (
            <p className="text-[10px] text-zinc-500 italic">Sem habilidades especiais desbloqueadas.</p>
          )}
        </div>

      </div>

      {/* OVERLAY PANEL COMPONENT (Inventory, Stats, Shop, Settings tabs) */}
      <HUDOverlays
        isOpen={panelOpen}
        activePanel={activePanel}
        onClose={() => {
          setPanelOpen(false);
          setActivePanel(null);
        }}
        character={character}
        onUpdateCharacter={handleUpdateCharacter}
        onTriggerHeal={(amt) => {
          if (phaserSceneRef.current) phaserSceneRef.current.triggerHealPotion(amt);
        }}
        onTriggerMana={(amt) => {
          if (phaserSceneRef.current) phaserSceneRef.current.triggerManaPotion(amt);
        }}
        onEquipSkill={(id) => {
          setActiveSkillId(id);
          if (phaserSceneRef.current) phaserSceneRef.current.equipSkill(id);
        }}
        onMapPortal={handleMapPortal}
        onLogMsg={addLogMessage}
      />

      {/* DEATH SCREEN OVERLAY MODAL */}
      {isDead && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center select-none font-mono">
          <div className="w-full max-w-sm bg-zinc-950/90 border-2 border-red-600 rounded-xl p-6 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
            <h2 className="text-3xl font-black tracking-widest text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)] animate-pulse">
              VOCÊ MORREU
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
              Sua vida chegou a zero lutando contra as forças das trevas. Seus itens permanecem seguros na mochila.
            </p>

            <button
              onClick={handleRevive}
              className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-zinc-950 hover:brightness-110 active:scale-[0.98] transition-all rounded-lg py-3 font-bold uppercase tracking-widest text-xs mt-6"
            >
              REVIVER EM LORENCIA
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
