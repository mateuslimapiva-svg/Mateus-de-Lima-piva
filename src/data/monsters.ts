/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BaseMonsterData {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  atkMin: number;
  atkMax: number;
  def: number;
  exp: number;
  speed: number;
  range: number;
  dropPool: string[];
  color: string;
  size: number;
}

export const MONSTERS: { [key: string]: BaseMonsterData } = {
  // LORENCIA MONSTERS
  budge_dragon: {
    id: 'budge_dragon',
    name: 'Budge Dragon',
    level: 1,
    maxHp: 20,
    atkMin: 3,
    atkMax: 5,
    def: 2,
    exp: 10,
    speed: 70,
    range: 1.2,
    dropPool: ['potion_small', 'mana_small', 'short_sword', 'skull_staff', 'short_bow', 'vine_boots', 'vine_gloves', 'leather_boots', 'leather_gloves'],
    color: '#ff4444',
    size: 24,
  },
  spider: {
    id: 'spider',
    name: 'Spider',
    level: 3,
    maxHp: 45,
    atkMin: 6,
    atkMax: 10,
    def: 5,
    exp: 25,
    speed: 80,
    range: 1.2,
    dropPool: ['potion_small', 'mana_small', 'mace', 'bronze_shield', 'vine_pants', 'vine_helm', 'leather_pants', 'leather_helm', 'silk_gloves'],
    color: '#aa3333',
    size: 26,
  },
  hell_hound: {
    id: 'hell_hound',
    name: 'Hell Hound',
    level: 7,
    maxHp: 110,
    atkMin: 14,
    atkMax: 18,
    def: 12,
    exp: 80,
    speed: 95,
    range: 1.2,
    dropPool: ['potion_medium', 'mana_medium', 'light_saber', 'bronze_helm', 'bronze_boots', 'silk_boots', 'silk_helm'],
    color: '#ff6600',
    size: 32,
  },
  lich: {
    id: 'lich',
    name: 'Lich',
    level: 14,
    maxHp: 250,
    atkMin: 28,
    atkMax: 36,
    def: 22,
    exp: 300,
    speed: 65,
    range: 3.5, // Ranged caster
    dropPool: ['potion_medium', 'mana_medium', 'thunder_staff', 'bronze_armor', 'bronze_pants', 'silk_armor', 'silk_pants'],
    color: '#9933ff',
    size: 30,
  },
  troll: {
    id: 'troll',
    name: 'Troll',
    level: 20,
    maxHp: 550,
    atkMin: 45,
    atkMax: 60,
    def: 40,
    exp: 800,
    speed: 60,
    range: 1.5,
    dropPool: ['potion_large', 'mana_medium', 'blade', 'scale_helm', 'scale_boots', 'scale_gloves', 'sphinx_helm', 'sphinx_boots', 'sphinx_gloves'],
    color: '#8b5a2b',
    size: 40,
  },

  // DUNGEON MONSTERS
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    level: 15,
    maxHp: 320,
    atkMin: 40,
    atkMax: 52,
    def: 32,
    exp: 500,
    speed: 75,
    range: 1.2,
    dropPool: ['potion_medium', 'jewel_of_chaos', 'scale_pants', 'sphinx_pants', 'ring_of_fire'],
    color: '#e0e0e0',
    size: 30,
  },
  dark_knight_mob: {
    id: 'dark_knight_mob',
    name: 'Dark Knight',
    level: 20,
    maxHp: 600,
    atkMin: 60,
    atkMax: 78,
    def: 55,
    exp: 1200,
    speed: 80,
    range: 1.2,
    dropPool: ['potion_large', 'jewel_of_bless', 'scale_armor', 'sphinx_armor', 'pendant_of_ability'],
    color: '#444455',
    size: 34,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    level: 25,
    maxHp: 450,
    atkMin: 70,
    atkMax: 90,
    def: 45,
    exp: 1500,
    speed: 90,
    range: 3.0, // Spell caster ghost
    dropPool: ['mana_medium', 'jewel_of_soul', 'brass_helm', 'brass_boots', 'brass_gloves'],
    color: '#88ccff',
    size: 32,
  },
  larva: {
    id: 'larva',
    name: 'Larva',
    level: 30,
    maxHp: 800,
    atkMin: 85,
    atkMax: 110,
    def: 70,
    exp: 2800,
    speed: 55,
    range: 1.2,
    dropPool: ['potion_large', 'brass_pants', 'brass_armor', 'ring_of_ice'],
    color: '#33aa66',
    size: 28,
  },
  devil_boss: {
    id: 'devil_boss',
    name: 'Devil (Boss)',
    level: 45,
    maxHp: 8000,
    atkMin: 150,
    atkMax: 200,
    def: 120,
    exp: 15000,
    speed: 85,
    range: 2.0,
    dropPool: ['jewel_of_bless', 'jewel_of_soul', 'wings_of_heaven', 'wings_of_satan', 'wings_of_elf', 'dark_helm', 'dark_boots', 'dark_gloves'],
    color: '#cc0000',
    size: 54,
  },

  // DEVIAS MONSTERS
  yeti: {
    id: 'yeti',
    name: 'Yeti',
    level: 32,
    maxHp: 1200,
    atkMin: 95,
    atkMax: 125,
    def: 85,
    exp: 3500,
    speed: 70,
    range: 1.2,
    dropPool: ['potion_large', 'jewel_of_chaos', 'plate_helm', 'plate_boots', 'plate_gloves', 'divine_helm', 'divine_boots', 'divine_gloves'],
    color: '#ffffff',
    size: 42,
  },
  elite_yeti: {
    id: 'elite_yeti',
    name: 'Elite Yeti',
    level: 40,
    maxHp: 2500,
    atkMin: 140,
    atkMax: 175,
    def: 115,
    exp: 8000,
    speed: 75,
    range: 1.5,
    dropPool: ['potion_large', 'jewel_of_soul', 'plate_pants', 'plate_armor', 'divine_pants', 'divine_armor'],
    color: '#00ccff',
    size: 48,
  },
  ice_queen: {
    id: 'ice_queen',
    name: 'Ice Queen (Boss)',
    level: 55,
    maxHp: 20000,
    atkMin: 220,
    atkMax: 280,
    def: 180,
    exp: 50000,
    speed: 90,
    range: 4.0, // Frost ranged caster
    dropPool: ['jewel_of_bless', 'jewel_of_soul', 'wings_of_heaven', 'wings_of_satan', 'wings_of_elf', 'staff_of_kundun', 'dragon_slayer', 'thunder_blade', 'dark_pants', 'dark_armor'],
    color: '#e0f7fa',
    size: 50,
  },
};

/**
 * Returns monsters that belong to a specific map.
 */
export function getMonstersForMap(mapId: 'Lorencia' | 'Dungeon' | 'Devias'): string[] {
  switch (mapId) {
    case 'Lorencia':
      return ['budge_dragon', 'spider', 'hell_hound', 'lich', 'troll'];
    case 'Dungeon':
      return ['skeleton', 'dark_knight_mob', 'ghost', 'larva', 'devil_boss'];
    case 'Devias':
      return ['yeti', 'elite_yeti', 'ice_queen'];
    default:
      return [];
  }
}
