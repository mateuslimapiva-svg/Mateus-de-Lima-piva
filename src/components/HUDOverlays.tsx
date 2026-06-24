/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CharacterClass, Item, CharacterStats } from '../types';
import { getSkillsForClass } from '../data/skills';
import { BASE_ITEMS, createItem, getItemColors } from '../data/items';
import { Swords, Heart, Zap, Sparkles, X, ShoppingBag, ShieldAlert, Award, Volume2, Save, LogOut } from 'lucide-react';

interface HUDOverlaysProps {
  isOpen: boolean;
  activePanel: 'inventory' | 'stats' | 'shop' | 'warehouse' | 'settings' | null;
  onClose: () => void;
  character: any;
  onUpdateCharacter: (updater: (prev: any) => any) => void;
  onTriggerHeal: (amount: number) => void;
  onTriggerMana: (amount: number) => void;
  onEquipSkill: (skillId: string | null) => void;
  onMapPortal: (mapId: 'Lorencia' | 'Dungeon' | 'Devias') => void;
  onLogMsg: (msg: string, color?: string) => void;
}

export const HUDOverlays: React.FC<HUDOverlaysProps> = ({
  isOpen,
  activePanel: initialPanel,
  onClose,
  character,
  onUpdateCharacter,
  onTriggerHeal,
  onTriggerMana,
  onEquipSkill,
  onMapPortal,
  onLogMsg,
}) => {
  const [panel, setPanel] = useState<'inventory' | 'stats' | 'shop' | 'warehouse' | 'settings'>(
    initialPanel || 'inventory'
  );

  // Sync state if initial panel prop changes
  React.useEffect(() => {
    if (initialPanel) setPanel(initialPanel);
  }, [initialPanel]);

  if (!isOpen || !character) return null;

  // Attributes increment formulas
  const handleAddStat = (statKey: keyof CharacterStats) => {
    if (character.freePoints <= 0) return;

    onUpdateCharacter((prev) => {
      const nextStats = { ...prev.stats, [statKey]: prev.stats[statKey] + 1 };
      let hpBonus = 0;
      let mpBonus = 0;
      let agBonus = 0;

      // Recalculate max stats
      if (prev.class === 'DK' || prev.class === 'MG') {
        hpBonus = 2; // +2 hp per VIT
        mpBonus = 1.5; // +1.5 mp per ENE
      } else if (prev.class === 'DW') {
        hpBonus = 1.5;
        mpBonus = 3; // +3 mp per ENE
      } else if (prev.class === 'ELF') {
        hpBonus = 1.5;
        mpBonus = 2;
      }
      agBonus = 2; // +2 AG per AGI

      return {
        ...prev,
        stats: nextStats,
        freePoints: prev.freePoints - 1,
      };
    });
  };

  // Consume pot
  const handleUseItem = (item: Item, index: number) => {
    if (item.type === 'potion') {
      if (item.id.includes('mana') || item.name.includes('MP')) {
        // mana
        const restore = item.name.includes('(M)') ? 120 : 50;
        onTriggerMana(restore);
      } else {
        // hp
        const restore = item.name.includes('(M)') ? 150 : item.name.includes('(L)') ? 350 : 50;
        onTriggerHeal(restore);
      }

      // Decrement stack
      onUpdateCharacter((prev) => {
        const nextInv = [...prev.inventory];
        const target = nextInv[index];
        if (target) {
          if (target.stackCount && target.stackCount > 1) {
            nextInv[index] = { ...target, stackCount: target.stackCount - 1 };
          } else {
            nextInv[index] = null;
          }
        }
        return { ...prev, inventory: nextInv };
      });
    } else if (item.slotType) {
      // Is equipable
      handleEquipItem(item, index);
    }
  };

  // Equip item logic
  const handleEquipItem = (item: Item, index: number) => {
    // Check requirements
    const s = character.stats;
    if (s.str < item.strReq || s.agi < item.agiReq || (item.eneReq && s.ene < item.eneReq)) {
      onLogMsg('Atributos insuficientes para equipar este item!', '#ff2222');
      return;
    }

    const slot = item.slotType!;
    
    onUpdateCharacter((prev) => {
      const nextInv = [...prev.inventory];
      const nextEquip = { ...prev.equipped };

      // Swap equipped slot with inventory
      const currentlyEquipped = nextEquip[slot];
      nextEquip[slot] = item;
      nextInv[index] = currentlyEquipped;

      onLogMsg(`Equipou: ${item.name}`, '#ffff00');
      return { ...prev, inventory: nextInv, equipped: nextEquip };
    });
  };

  const handleUnequipItem = (slotKey: string) => {
    const item = character.equipped[slotKey];
    if (!item) return;

    // Find first empty inventory slot
    const freeIndex = character.inventory.findIndex((i: any) => i === null);
    if (freeIndex === -1) {
      onLogMsg('Inventario cheio! Abra espaco para desequipar.', '#ff3333');
      return;
    }

    onUpdateCharacter((prev) => {
      const nextInv = [...prev.inventory];
      const nextEquip = { ...prev.equipped };

      nextInv[freeIndex] = item;
      nextEquip[slotKey] = null;

      onLogMsg(`Desequipou: ${item.name}`, '#cccccc');
      return { ...prev, inventory: nextInv, equipped: nextEquip };
    });
  };

  // Shop item list
  const shopItems = [
    { key: 'potion_small', label: 'HP Potion (S)', price: 20 },
    { key: 'potion_medium', label: 'HP Potion (M)', price: 100 },
    { key: 'mana_small', label: 'MP Potion (S)', price: 20 },
    { key: 'mana_medium', label: 'MP Potion (M)', price: 100 },
    { key: 'light_saber', label: 'Light Saber', price: 1200 },
    { key: 'short_bow', label: 'Short Bow', price: 160 },
    { key: 'skull_staff', label: 'Skull Staff', price: 180 },
    { key: 'bronze_shield', label: 'Bronze Shield', price: 450 },
    { key: 'leather_armor', label: 'Leather Armor', price: 750 },
    { key: 'leather_helm', label: 'Leather Helm', price: 500 },
    { key: 'leather_gloves', label: 'Leather Gloves', price: 400 },
    { key: 'leather_boots', label: 'Leather Boots', price: 400 },
    { key: 'silk_armor', label: 'Silk Armor', price: 1200 },
    { key: 'silk_pants', label: 'Silk Pants', price: 1000 },
    { key: 'jewel_of_chaos', label: 'Jewel of Chaos', price: 5000 },
    { key: 'jewel_of_bless', label: 'Jewel of Bless', price: 10000 },
  ];

  const handleBuyItem = (shopItemKey: string, price: number) => {
    if (character.zen < price) {
      onLogMsg('Zen insuficiente para esta compra!', '#ffd700');
      return;
    }

    // Find free slot
    const freeIndex = character.inventory.findIndex((i: any) => i === null);
    if (freeIndex === -1) {
      onLogMsg('Inventario cheio! Venda itens para liberar espaco.', '#ff3333');
      return;
    }

    const newItem = createItem(shopItemKey, { isExcellent: false, level: 0 }); // shops sell basic +0 items
    
    onUpdateCharacter((prev) => {
      const nextInv = [...prev.inventory];
      nextInv[freeIndex] = newItem;
      onLogMsg(`Comprou: ${newItem.name} por ${price.toLocaleString()} Zen`, '#ffd700');
      return {
        ...prev,
        inventory: nextInv,
        zen: prev.zen - price,
      };
    });
  };

  const handleSellItem = (item: Item, index: number) => {
    const sellPrice = Math.floor(item.price * 0.4); // sell for 40% value
    onUpdateCharacter((prev) => {
      const nextInv = [...prev.inventory];
      nextInv[index] = null;
      onLogMsg(`Vendeu: ${item.name} por +${sellPrice.toLocaleString()} Zen`, '#ffd700');
      return {
        ...prev,
        inventory: nextInv,
        zen: prev.zen + sellPrice,
      };
    });
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-[10%] z-25 bg-[#0a0a10]/95 border-t-2 border-amber-500/40 backdrop-blur-md rounded-t-2xl flex flex-col overflow-hidden text-zinc-100 select-none">
      {/* HUD Header with Navigation tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2 shrink-0 bg-zinc-950">
        <div className="flex items-center gap-1">
          {(['inventory', 'stats', 'shop', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPanel(t)}
              className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all ${
                panel === t
                  ? 'bg-amber-500/10 border border-amber-400 text-amber-300'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              {t === 'inventory' ? 'Inventario' :
               t === 'stats' ? 'Atributos' :
               t === 'shop' ? 'Shop NPC' : 'Configs'}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Content Scroll Viewport */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        
        {/* PANEL: INVENTORY & EQUIPMENT */}
        {panel === 'inventory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            
            {/* Equipment Grid */}
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-zinc-400 border-b border-zinc-800 pb-1.5 mb-3 flex items-center gap-1 uppercase">
                <Swords size={12} className="text-amber-500" />
                Equipamentos
              </h3>

              {/* Character Visual Armor Slots Grid */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto py-2">
                
                {/* Helm */}
                <div className="col-start-2">
                  <EquipSlot
                    slot="helm"
                    item={character.equipped.helm}
                    onUnequip={() => handleUnequipItem('helm')}
                    label="Elmo"
                  />
                </div>

                {/* Wings / Cape */}
                <div className="col-start-3 row-start-1">
                  <EquipSlot
                    slot="wings"
                    item={character.equipped.wings}
                    onUnequip={() => handleUnequipItem('wings')}
                    label="Asas"
                  />
                </div>

                {/* Left hand Weapon */}
                <div className="row-start-2 col-start-1">
                  <EquipSlot
                    slot="weapon"
                    item={character.equipped.weapon}
                    onUnequip={() => handleUnequipItem('weapon')}
                    label="Arma"
                  />
                </div>

                {/* Armor chest */}
                <div className="row-start-2 col-start-2">
                  <EquipSlot
                    slot="armor"
                    item={character.equipped.armor}
                    onUnequip={() => handleUnequipItem('armor')}
                    label="Armadura"
                  />
                </div>

                {/* Shield / Right hand */}
                <div className="row-start-2 col-start-3">
                  <EquipSlot
                    slot="shield"
                    item={character.equipped.shield}
                    onUnequip={() => handleUnequipItem('shield')}
                    label="Escudo"
                  />
                </div>

                {/* Gloves */}
                <div className="row-start-3 col-start-1">
                  <EquipSlot
                    slot="gloves"
                    item={character.equipped.gloves}
                    onUnequip={() => handleUnequipItem('gloves')}
                    label="Luvas"
                  />
                </div>

                {/* Pants */}
                <div className="row-start-3 col-start-2">
                  <EquipSlot
                    slot="pants"
                    item={character.equipped.pants}
                    onUnequip={() => handleUnequipItem('pants')}
                    label="Calças"
                  />
                </div>

                {/* Boots */}
                <div className="row-start-3 col-start-3">
                  <EquipSlot
                    slot="boots"
                    item={character.equipped.boots}
                    onUnequip={() => handleUnequipItem('boots')}
                    label="Botas"
                  />
                </div>

              </div>

              {/* Status parameters below */}
              <div className="bg-zinc-950/80 p-2.5 rounded-md border border-zinc-900 mt-4 text-[11px] font-mono flex justify-between">
                <span>Gold/Zen: <span className="text-amber-400 font-bold">{character.zen.toLocaleString()}</span></span>
                <span>Level: <span className="text-amber-500 font-bold">{character.level}</span></span>
              </div>
            </div>

            {/* Inventory Bag */}
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-3 flex flex-col">
              <h3 className="text-xs font-bold text-zinc-400 border-b border-zinc-800 pb-1.5 mb-3 flex items-center justify-between uppercase">
                <span className="flex items-center gap-1">
                  <ShoppingBag size={12} className="text-amber-500" />
                  Mochila (Inventário)
                </span>
                <span className="text-[10px] font-normal text-zinc-500">Toque para usar/equipar</span>
              </h3>

              {/* 32 slots grid (4 cols x 8 rows) */}
              <div className="grid grid-cols-4 gap-2 flex-1 auto-rows-fr">
                {character.inventory.map((item: Item | null, i: number) => (
                  <div
                    key={i}
                    onClick={() => item && handleUseItem(item, i)}
                    className={`relative aspect-square rounded-md border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                      item 
                        ? getItemColors(item).bg + ' hover:brightness-125'
                        : 'border-zinc-800/40 bg-zinc-950/20 hover:bg-zinc-950/40'
                    }`}
                  >
                    {item ? (
                      <>
                        {/* Display item stack or level */}
                        {item.stackCount && item.stackCount > 1 && (
                          <span className="absolute top-0.5 right-1 text-[9px] font-mono font-bold text-amber-400">
                            x{item.stackCount}
                          </span>
                        )}
                        {item.level > 0 && (
                          <span className="absolute bottom-0.5 left-1 text-[8px] font-mono font-bold text-sky-400">
                            +{item.level}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold text-center leading-tight truncate w-full ${getItemColors(item).text}`}>
                          {item.name.replace('Excellent ', '').split(' +')[0]}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] text-zinc-700/60 font-mono select-none">{i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* PANEL: CHARACTER STATS */}
        {panel === 'stats' && (
          <div className="space-y-4 max-w-md mx-auto w-full">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 font-mono">
              <h3 className="text-xs font-bold text-zinc-400 border-b border-zinc-800 pb-1.5 mb-4 flex items-center justify-between">
                <span>DADOS DO PERSONAGEM</span>
                <span className="text-amber-500 font-bold uppercase">{character.class === 'DK' ? 'Dark Knight' : character.class === 'DW' ? 'Dark Wizard' : character.class === 'ELF' ? 'Fairy Elf' : 'Magic Gladiator'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs border-b border-zinc-800 pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nome:</span>
                  <span className="font-bold text-zinc-200">{character.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Level:</span>
                  <span className="font-bold text-amber-400">{character.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mapa:</span>
                  <span className="font-bold text-sky-400">{character.currentMap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Zen:</span>
                  <span className="font-bold text-yellow-400">{character.zen.toLocaleString()}</span>
                </div>
              </div>

              {/* Free points notice */}
              {character.freePoints > 0 && (
                <div className="bg-amber-500/10 border border-amber-400/40 text-amber-300 rounded p-2.5 text-center text-xs font-bold mb-4 animate-pulse">
                  VOCE POSSUI {character.freePoints} PONTOS LIVRES!
                </div>
              )}

              {/* Attribute Allocation List */}
              <div className="space-y-3.5">
                <StatRow
                  label="Força (STR)"
                  val={character.stats.str}
                  color="text-red-400"
                  canAdd={character.freePoints > 0}
                  onAdd={() => handleAddStat('str')}
                />
                <StatRow
                  label="Agilidade (AGI)"
                  val={character.stats.agi}
                  color="text-emerald-400"
                  canAdd={character.freePoints > 0}
                  onAdd={() => handleAddStat('agi')}
                />
                <StatRow
                  label="Vitalidade (VIT)"
                  val={character.stats.vit}
                  color="text-sky-400"
                  canAdd={character.freePoints > 0}
                  onAdd={() => handleAddStat('vit')}
                />
                <StatRow
                  label="Energia (ENE)"
                  val={character.stats.ene}
                  color="text-purple-400"
                  canAdd={character.freePoints > 0}
                  onAdd={() => handleAddStat('ene')}
                />
              </div>
            </div>

            {/* Calculations specs list */}
            <div className="bg-zinc-950/30 border border-zinc-800 rounded-lg p-3 text-xs font-mono">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Estatisticas de Batalha</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">Ataque Físico:</span>
                  <span className="font-bold text-zinc-300">
                    {Math.floor(character.stats.str / 7 + 10)}~{Math.floor(character.stats.str / 5 + 18)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">Defesa Defensiva:</span>
                  <span className="font-bold text-zinc-300">{Math.floor(character.stats.agi / 3)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">Poder de Spell:</span>
                  <span className="font-bold text-zinc-300">+{Math.floor(character.stats.ene / 3)}%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span className="text-zinc-500">Velocidade Atk:</span>
                  <span className="font-bold text-zinc-300">+{Math.floor(character.stats.agi / 10)}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* PANEL: NPC SHOP */}
        {panel === 'shop' && (
          <div className="flex flex-col gap-3 flex-1">
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-amber-400 uppercase">Falar com Hanzo (Armeiro)</p>
                <p className="text-[10px] text-zinc-500">Equipamentos e orbs de classe para evoluir.</p>
              </div>
              <div className="font-mono text-zinc-300">
                Seu Zen: <span className="text-amber-400 font-bold">{character.zen.toLocaleString()}</span>
              </div>
            </div>

            {/* Shop layout split: Shop buyable lists vs backpack selling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* Items for Sale list */}
              <div className="border border-zinc-800/80 rounded-lg p-3 bg-zinc-950/20 max-h-[350px] overflow-y-auto">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase pb-1.5 border-b border-zinc-800 mb-3">Itens do Mercador</h4>
                <div className="grid grid-cols-2 gap-2">
                  {shopItems.map((si) => (
                    <div
                      key={si.key}
                      onClick={() => handleBuyItem(si.key, si.price)}
                      className="border border-zinc-800 hover:border-amber-500 bg-zinc-950/60 p-2.5 rounded-md flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-all"
                    >
                      <p className="font-bold text-[11px] text-zinc-200 group-hover:text-amber-400 truncate">{si.label}</p>
                      <p className="text-[10px] text-amber-500 font-mono font-bold mt-1.5">
                        {si.price.toLocaleString()} Zen
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Backpack Sell Helper */}
              <div className="border border-zinc-800/80 rounded-lg p-3 bg-zinc-950/20 max-h-[350px] overflow-y-auto">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase pb-1.5 border-b border-zinc-800 mb-3">Vender seus itens (Toque para Vender - 40% valor)</h4>
                <div className="grid grid-cols-4 gap-2">
                  {character.inventory.map((item: Item | null, i: number) => (
                    <div
                      key={i}
                      onClick={() => item && handleSellItem(item, i)}
                      className={`aspect-square border rounded-md p-1 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        item 
                          ? 'border-red-900/40 hover:border-red-500 bg-red-950/10 hover:bg-red-950/30'
                          : 'border-zinc-900 bg-zinc-950/10 cursor-not-allowed'
                      }`}
                    >
                      {item ? (
                        <>
                          <span className="text-[8px] font-bold text-center leading-tight truncate w-full text-red-400">{item.name.replace('Excellent ', '')}</span>
                          <span className="text-[8px] text-amber-400 mt-1 font-bold font-mono">
                            {Math.floor(item.price * 0.4).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] text-zinc-800 font-mono">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PANEL: SETTINGS & RESET */}
        {panel === 'settings' && (
          <div className="max-w-md mx-auto w-full space-y-6 py-4 font-mono">
            
            {/* Volume controls */}
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 border-b border-zinc-800 pb-1.5 mb-3 flex items-center gap-1 uppercase">
                <Volume2 size={14} className="text-amber-500" />
                Ajustes de Audio
              </h3>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Musica Ambiente (BGM)</span>
                  <span className="font-bold text-amber-400">70%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="70"
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Efeitos Sonoros (SFX)</span>
                  <span className="font-bold text-amber-400">90%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="90"
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* Portal teleports travel */}
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-xs font-bold text-zinc-400 border-b border-zinc-800 pb-1.5 mb-3 flex items-center gap-1 uppercase">
                <Sparkles size={14} className="text-amber-500" />
                Teleporte Rapido de Mapas
              </h3>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => onMapPortal('Lorencia')}
                  className={`py-2 px-1 text-xs font-bold border rounded-lg transition-all ${
                    character.currentMap === 'Lorencia'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Lorencia (Lv1)
                </button>
                <button
                  onClick={() => {
                    if (character.level < 15) {
                      onLogMsg('Falta level 15 para teleportar para o Dungeon!', '#ff2222');
                    } else {
                      onMapPortal('Dungeon');
                    }
                  }}
                  className={`py-2 px-1 text-xs font-bold border rounded-lg transition-all ${
                    character.currentMap === 'Dungeon'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Dungeon (Lv15)
                </button>
                <button
                  onClick={() => {
                    if (character.level < 30) {
                      onLogMsg('Falta level 30 para teleportar para Devias!', '#ff2222');
                    } else {
                      onMapPortal('Devias');
                    }
                  }}
                  className={`py-2 px-1 text-xs font-bold border rounded-lg transition-all ${
                    character.currentMap === 'Devias'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Devias (Lv30)
                </button>
              </div>
            </div>

            {/* Quick action exit */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-bold transition-all"
              >
                <LogOut size={14} /> Sair do Jogo
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

// SUBCOMPONENT: StatRow allocation helper
const StatRow: React.FC<{
  label: string;
  val: number;
  color: string;
  canAdd: boolean;
  onAdd: () => void;
}> = ({ label, val, color, canAdd, onAdd }) => {
  return (
    <div className="flex justify-between items-center border-b border-zinc-900/60 pb-2">
      <div>
        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{label}</p>
        <p className={`text-sm font-bold ${color} mt-0.5`}>{val}</p>
      </div>

      {canAdd && (
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-md bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold flex items-center justify-center text-sm transition-all"
        >
          +
        </button>
      )}
    </div>
  );
};

// SUBCOMPONENT: Slot visual render mapping
const EquipSlot: React.FC<{
  slot: string;
  item: Item | null;
  onUnequip: () => void;
  label: string;
}> = ({ slot, item, onUnequip, label }) => {
  return (
    <div
      onClick={onUnequip}
      className={`relative aspect-square w-14 rounded-md border flex flex-col items-center justify-center p-1 cursor-pointer hover:border-red-500/50 hover:bg-red-950/10 transition-all ${
        item 
          ? getItemColors(item).bg + ' ' + (getItemColors(item).glow || '')
          : 'border-zinc-800 bg-zinc-950/60'
      }`}
    >
      {item ? (
        <>
          {item.level > 0 && (
            <span className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-sky-400">
              +{item.level}
            </span>
          )}
          <span className={`text-[8px] font-bold text-center leading-tight truncate w-full ${getItemColors(item).text}`}>
            {item.name.replace('Excellent ', '').split(' +')[0]}
          </span>
        </>
      ) : (
        <span className="text-[9px] text-zinc-700 uppercase font-bold tracking-wide select-none">{label}</span>
      )}
    </div>
  );
};
