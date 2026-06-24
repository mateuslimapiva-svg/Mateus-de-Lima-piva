/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item } from '../types';

export const BASE_ITEMS: { [key: string]: Partial<Item> } = {
  // WEAPONS
  short_sword: {
    name: 'Short Sword',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 1,
    strReq: 18,
    agiReq: 10,
    dmgMin: 3,
    dmgMax: 7,
    speed: 40,
    sizeX: 1,
    sizeY: 3,
    price: 150,
  },
  mace: {
    name: 'Mace',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 1,
    strReq: 20,
    agiReq: 12,
    dmgMin: 6,
    dmgMax: 10,
    speed: 30,
    sizeX: 1,
    sizeY: 3,
    price: 250,
  },
  light_saber: {
    name: 'Light Saber',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 10,
    strReq: 30,
    agiReq: 15,
    dmgMin: 15,
    dmgMax: 25,
    speed: 45,
    sizeX: 1,
    sizeY: 4,
    price: 1200,
  },
  blade: {
    name: 'Blade',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 20,
    strReq: 60,
    agiReq: 25,
    dmgMin: 40,
    dmgMax: 55,
    speed: 35,
    sizeX: 1,
    sizeY: 4,
    price: 5400,
  },
  dragon_slayer: {
    name: 'Dragon Slayer',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 50,
    strReq: 130,
    agiReq: 40,
    dmgMin: 110,
    dmgMax: 145,
    speed: 25,
    sizeX: 2,
    sizeY: 4,
    price: 45000,
  },
  thunder_blade: {
    name: 'Thunder Blade',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 70,
    strReq: 150,
    agiReq: 50,
    dmgMin: 150,
    dmgMax: 180,
    speed: 30,
    sizeX: 2,
    sizeY: 4,
    price: 98000,
  },
  skull_staff: {
    name: 'Skull Staff',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 1,
    strReq: 20,
    agiReq: 10,
    dmgMin: 3,
    dmgMax: 7,
    staffDmgBonus: 5,
    sizeX: 1,
    sizeY: 3,
    price: 180,
  },
  thunder_staff: {
    name: 'Thunder Staff',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 15,
    strReq: 30,
    agiReq: 12,
    eneReq: 40,
    dmgMin: 22,
    dmgMax: 35,
    staffDmgBonus: 18,
    sizeX: 1,
    sizeY: 4,
    price: 4500,
  },
  staff_of_kundun: {
    name: 'Staff of Kundun',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 60,
    strReq: 50,
    agiReq: 30,
    eneReq: 120,
    dmgMin: 100,
    dmgMax: 130,
    staffDmgBonus: 55,
    sizeX: 1,
    sizeY: 4,
    price: 89000,
  },
  short_bow: {
    name: 'Short Bow',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 1,
    strReq: 15,
    agiReq: 22,
    dmgMin: 4,
    dmgMax: 8,
    speed: 40,
    sizeX: 1,
    sizeY: 3,
    price: 160,
  },
  elven_bow: {
    name: 'Elven Bow',
    type: 'weapon',
    slotType: 'weapon',
    levelReq: 30,
    strReq: 30,
    agiReq: 80,
    dmgMin: 55,
    dmgMax: 75,
    speed: 35,
    sizeX: 1,
    sizeY: 4,
    price: 18500,
  },

  // SHIELDS
  bronze_shield: {
    name: 'Bronze Shield',
    type: 'shield',
    slotType: 'shield',
    levelReq: 5,
    strReq: 25,
    agiReq: 15,
    def: 6,
    sizeX: 2,
    sizeY: 2,
    price: 450,
  },
  elven_shield: {
    name: 'Elven Shield',
    type: 'shield',
    slotType: 'shield',
    levelReq: 12,
    strReq: 20,
    agiReq: 40,
    def: 14,
    sizeX: 2,
    sizeY: 2,
    price: 2300,
  },

  // WINGS
  wings_of_heaven: {
    name: 'Wings of Heaven',
    type: 'wings',
    slotType: 'wings',
    levelReq: 50,
    strReq: 30,
    agiReq: 30,
    def: 15,
    sizeX: 2,
    sizeY: 2,
    price: 50000,
  },
  wings_of_satan: {
    name: 'Wings of Satan',
    type: 'wings',
    slotType: 'wings',
    levelReq: 50,
    strReq: 40,
    agiReq: 30,
    def: 18,
    sizeX: 2,
    sizeY: 2,
    price: 55000,
  },
  wings_of_elf: {
    name: 'Wings of Fairy',
    type: 'wings',
    slotType: 'wings',
    levelReq: 50,
    strReq: 25,
    agiReq: 45,
    def: 12,
    sizeX: 2,
    sizeY: 2,
    price: 48000,
  },

  // RINGS & PENDANTS
  ring_of_fire: { name: 'Ring of Fire', type: 'ring', slotType: 'ring1', levelReq: 10, strReq: 0, agiReq: 0, def: 2, sizeX: 1, sizeY: 1, price: 5000 },
  ring_of_ice: { name: 'Ring of Ice', type: 'ring', slotType: 'ring2', levelReq: 10, strReq: 0, agiReq: 0, def: 2, sizeX: 1, sizeY: 1, price: 5000 },
  pendant_of_ability: { name: 'Pendant of Ability', type: 'pendant', slotType: 'pendant', levelReq: 15, strReq: 0, agiReq: 0, dmgMin: 2, dmgMax: 2, sizeX: 1, sizeY: 1, price: 7500 },

  // POTIONS
  potion_small: { name: 'HP Potion (S)', type: 'potion', levelReq: 1, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 20, stackCount: 5, maxStack: 50 },
  potion_medium: { name: 'HP Potion (M)', type: 'potion', levelReq: 10, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 100, stackCount: 5, maxStack: 30 },
  potion_large: { name: 'HP Potion (L)', type: 'potion', levelReq: 25, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 500, stackCount: 5, maxStack: 20 },
  mana_small: { name: 'MP Potion (S)', type: 'potion', levelReq: 1, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 20, stackCount: 5, maxStack: 50 },
  mana_medium: { name: 'MP Potion (M)', type: 'potion', levelReq: 10, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 100, stackCount: 5, maxStack: 30 },

  // JEWELS
  jewel_of_bless: { name: 'Jewel of Bless', type: 'etc', levelReq: 1, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 10000 },
  jewel_of_soul: { name: 'Jewel of Soul', type: 'etc', levelReq: 1, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 15000 },
  jewel_of_chaos: { name: 'Jewel of Chaos', type: 'etc', levelReq: 1, strReq: 0, agiReq: 0, sizeX: 1, sizeY: 1, price: 5000 },
};

// Add Sets dynamically
const ARMOR_SETS = [
  { name: 'Leather', def: 18, class: 'DK/MG', levelReq: 2, basePrice: 500 },
  { name: 'Bronze', def: 36, class: 'DK', levelReq: 8, basePrice: 1500 },
  { name: 'Scale', def: 72, class: 'DK/MG', levelReq: 20, basePrice: 4000 },
  { name: 'Brass', def: 98, class: 'DK', levelReq: 35, basePrice: 9000 },
  { name: 'Plate', def: 138, class: 'DK', levelReq: 50, basePrice: 22000 },
  { name: 'Vine', def: 24, class: 'ELF', levelReq: 6, basePrice: 800 },
  { name: 'Silk', def: 45, class: 'DW/ELF', levelReq: 15, basePrice: 2500 },
  { name: 'Sphinx', def: 72, class: 'DW', levelReq: 28, basePrice: 7500 },
  { name: 'Divine', def: 110, class: 'ELF', levelReq: 40, basePrice: 18000 },
  { name: 'Dark', def: 80, class: 'DK/MG', levelReq: 30, basePrice: 12000 },
];

const PIECE_TYPES: { type: 'helm' | 'armor' | 'gloves' | 'pants' | 'boots'; nameSuffix: string; size: [number, number] }[] = [
  { type: 'helm', nameSuffix: 'Helm', size: [2, 2] },
  { type: 'armor', nameSuffix: 'Armor', size: [2, 3] },
  { type: 'gloves', nameSuffix: 'Gloves', size: [2, 2] },
  { type: 'pants', nameSuffix: 'Pants', size: [2, 2] },
  { type: 'boots', nameSuffix: 'Boots', size: [2, 2] },
];

ARMOR_SETS.forEach(set => {
  PIECE_TYPES.forEach(piece => {
    // Vine set has no helm for Elf sometimes, but let's generate it anyway
    const itemKey = `${set.name.toLowerCase()}_${piece.type}`;
    const defShare = Math.floor(set.def * (piece.type === 'armor' ? 0.35 : piece.type === 'pants' ? 0.25 : 0.15));

    BASE_ITEMS[itemKey] = {
      name: `${set.name} ${piece.nameSuffix}`,
      type: piece.type,
      slotType: piece.type,
      levelReq: set.levelReq,
      strReq: set.class.includes('DK') ? set.levelReq * 2.5 + 10 : set.levelReq * 1.5 + 10,
      agiReq: set.class.includes('ELF') ? set.levelReq * 2.5 + 10 : set.levelReq * 1.0 + 10,
      def: Math.max(2, defShare),
      sizeX: piece.size[0],
      sizeY: piece.size[1],
      price: Math.floor(set.basePrice * (piece.type === 'armor' ? 1.5 : 1.0)),
    };
  });
});

export const EXC_OPTIONS_POOL = [
  'Life Restore (8% on kill)',
  'Mana Restore (8% on kill)',
  'Excellent Damage Chance +20%',
  'Attack Speed +7',
  'Defense +10%',
  'Zen Drop +40%',
];

/**
 * Generates an Item instance with randomized or specific level/options.
 */
export function createItem(key: string, overrides: Partial<Item> = {}): Item {
  const base = BASE_ITEMS[key];
  if (!base) {
    // Fallback item
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Unidentified Item',
      type: 'etc',
      levelReq: 1,
      strReq: 0,
      agiReq: 0,
      sizeX: 1,
      sizeY: 1,
      price: 10,
      level: 0,
      ...overrides,
    };
  }

  const isExc = overrides.isExcellent ?? (Math.random() < 0.05); // 5% chance for Excellent drops
  const hasLuck = overrides.hasLuck ?? (Math.random() < 0.3);
  const hasSkill = overrides.hasSkill ?? (base.type === 'weapon' && Math.random() < 0.4);
  const level = overrides.level ?? (Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 6)); // +0 to +5 random drops

  let name = base.name!;
  let excOpts: string[] = [];
  if (isExc) {
    name = `Excellent ${name}`;
    // Draw 1-2 excellent options
    const numOpts = Math.random() < 0.8 ? 1 : 2;
    const shuffled = [...EXC_OPTIONS_POOL].sort(() => 0.5 - Math.random());
    excOpts = shuffled.slice(0, numOpts);
  }

  if (level > 0) {
    name = `${name} +${level}`;
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    type: base.type!,
    slotType: base.slotType,
    levelReq: base.levelReq!,
    strReq: base.strReq!,
    agiReq: base.agiReq!,
    eneReq: base.eneReq,
    def: base.def ? base.def + (level * 3) : undefined,
    dmgMin: base.dmgMin ? base.dmgMin + (level * 3) : undefined,
    dmgMax: base.dmgMax ? base.dmgMax + (level * 3) : undefined,
    speed: base.speed,
    staffDmgBonus: base.staffDmgBonus ? base.staffDmgBonus + level : undefined,
    sizeX: base.sizeX!,
    sizeY: base.sizeY!,
    price: Math.floor(base.price! * (1 + level * 0.4) * (isExc ? 3.0 : 1.0)),
    level,
    hasLuck,
    hasSkill,
    isExcellent: isExc,
    excOptions: excOpts,
    stackCount: base.stackCount,
    maxStack: base.maxStack,
    ...overrides,
  };
}

/**
 * Gets exact item display properties for styling (glows, text colors).
 */
export function getItemColors(item: Item): { text: string; bg: string; glow?: string } {
  if (item.isExcellent) {
    return {
      text: 'text-purple-400 font-bold',
      bg: 'bg-purple-950/40 border-purple-500/80',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)] shadow-purple-500/50 animate-pulse',
    };
  }
  if (item.level >= 7) {
    return {
      text: 'text-yellow-400 font-medium',
      bg: 'bg-yellow-950/30 border-yellow-500/70',
      glow: 'shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse',
    };
  }
  if (item.level > 0 || item.hasLuck || item.hasSkill) {
    return {
      text: 'text-sky-300',
      bg: 'bg-sky-950/20 border-sky-500/50',
    };
  }
  return {
    text: 'text-amber-100/90',
    bg: 'bg-zinc-900/60 border-zinc-700',
  };
}
