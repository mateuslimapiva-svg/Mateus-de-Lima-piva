/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CharacterClass = 'DK' | 'DW' | 'ELF' | 'MG';

export interface CharacterStats {
  str: number;
  agi: number;
  vit: number;
  ene: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'shield' | 'helm' | 'armor' | 'gloves' | 'pants' | 'boots' | 'wings' | 'ring' | 'pendant' | 'potion' | 'etc';
  slotType?: 'helm' | 'armor' | 'gloves' | 'pants' | 'boots' | 'weapon' | 'shield' | 'wings' | 'ring1' | 'ring2' | 'pendant';
  levelReq: number;
  strReq: number;
  agiReq: number;
  eneReq?: number;
  def?: number;
  dmgMin?: number;
  dmgMax?: number;
  speed?: number;
  staffDmgBonus?: number; // percentage
  sizeX: number; // grid slots wide
  sizeY: number; // grid slots high
  price: number;
  // Options
  level: number; // +0 to +15
  hasLuck?: boolean;
  hasSkill?: boolean;
  isExcellent?: boolean;
  excOptions?: string[]; // e.g., 'hp_restore', 'mana_restore', 'exc_damage_rate'
  stackCount?: number;
  maxStack?: number;
}

export interface Skill {
  id: string;
  name: string;
  levelReq: number;
  mpCost: number;
  agCost: number;
  damagePercent: number; // e.g. 150
  cooldown: number; // in ms
  description: string;
  effectType: 'melee' | 'projectile' | 'aoe' | 'buff' | 'regen';
  effectValue?: number;
  range?: number;
  color?: string;
}

export interface SaveSlot {
  version: string;
  timestamp: number;
  character: {
    name: string;
    class: CharacterClass;
    level: number;
    exp: number;
    stats: CharacterStats;
    freePoints: number;
    hp: number;
    mp: number;
    currentMap: 'Lorencia' | 'Dungeon' | 'Devias';
    posX: number;
    posY: number;
    inventory: (Item | null)[]; // 32 grid slots
    equipped: { [key: string]: Item | null };
    zen: number;
    skills: string[]; // list of unlocked skill IDs
  };
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  hp: number;
  atkMin: number;
  atkMax: number;
  def: number;
  exp: number;
  speed: number;
  range: number;
  spawnTime: number; // in ms
  dropPool: string;
  color: string;
  size: number;
}

export interface MapData {
  id: 'Lorencia' | 'Dungeon' | 'Devias';
  name: string;
  width: number;
  height: number;
  levelReq: number;
  fogColor: string;
  ambientLight: string;
}
