/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterClass, SaveSlot, Item } from '../types';
import { createItem } from '../data/items';

const SAVE_PREFIX = 'mu97d_save_slot_';

export const SaveSystem = {
  /**
   * Checks if a save exists in a slot.
   */
  hasSave(slot: number): boolean {
    return localStorage.getItem(`${SAVE_PREFIX}${slot}`) !== null;
  },

  /**
   * Retrieves all saves.
   */
  getAllSaves(): { [slot: number]: SaveSlot['character'] | null } {
    const saves: { [slot: number]: SaveSlot['character'] | null } = {};
    for (let i = 1; i <= 3; i++) {
      const raw = localStorage.getItem(`${SAVE_PREFIX}${i}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SaveSlot;
          saves[i] = parsed.character;
        } catch (e) {
          saves[i] = null;
        }
      } else {
        saves[i] = null;
      }
    }
    return saves;
  },

  /**
   * Loads a save from a specific slot.
   */
  load(slot: number): SaveSlot | null {
    const raw = localStorage.getItem(`${SAVE_PREFIX}${slot}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveSlot;
    } catch (e) {
      console.error('Failed to parse save game slot', slot, e);
      return null;
    }
  },

  /**
   * Saves game data to a specific slot.
   */
  save(slot: number, character: SaveSlot['character']) {
    const data: SaveSlot = {
      version: '1.0',
      timestamp: Date.now(),
      character,
    };
    localStorage.setItem(`${SAVE_PREFIX}${slot}`, JSON.stringify(data));
    localStorage.setItem('mu97d_last_played_slot', slot.toString());
  },

  /**
   * Gets the last played slot. Defaults to 1.
   */
  getLastPlayedSlot(): number {
    const last = localStorage.getItem('mu97d_last_played_slot');
    return last ? parseInt(last, 10) : 1;
  },

  /**
   * Deletes a save slot.
   */
  delete(slot: number) {
    localStorage.removeItem(`${SAVE_PREFIX}${slot}`);
  },

  /**
   * Creates a brand new, authentic character profile based on 97d starting specifications.
   */
  createNewCharacter(name: string, cls: CharacterClass): SaveSlot['character'] {
    const stats = {
      DK: { str: 28, agi: 20, vit: 25, ene: 10 },
      DW: { str: 18, agi: 15, vit: 15, ene: 30 },
      ELF: { str: 22, agi: 25, vit: 15, ene: 15 },
      MG: { str: 26, agi: 26, vit: 16, ene: 16 },
    }[cls];

    const maxHp = {
      DK: 110 + stats.vit * 2 + 3,
      DW: 90 + stats.vit * 1.5 + 2,
      ELF: 80 + stats.vit * 1.5 + 2,
      MG: 110 + stats.vit * 2 + 3, // MG inherits DK formula mostly
    }[cls];

    const maxMp = {
      DK: 110 + stats.ene * 1.5 + 1,
      DW: 80 + stats.ene * 3 + 5,
      ELF: 100 + stats.ene * 2 + 3, // standard Elf mana setup
      MG: 80 + stats.ene * 2 + 3,
    }[cls];

    // Seed equipment
    const equipped: { [key: string]: Item | null } = {
      helm: null,
      armor: null,
      gloves: null,
      pants: null,
      boots: null,
      weapon: null,
      shield: null,
      wings: null,
      ring1: null,
      ring2: null,
      pendant: null,
    };

    // Seed empty inventory slots (4x8 grid = 32 slots)
    const inventory: (Item | null)[] = Array(32).fill(null);

    // Default skills unlocked list
    const skills: string[] = [];

    // Class specific starter setup
    if (cls === 'DK') {
      equipped.weapon = createItem('short_sword', { level: 0 });
      equipped.gloves = createItem('leather_gloves', { level: 0 });
      equipped.boots = createItem('leather_boots', { level: 0 });
      
      // Starter consumables
      inventory[0] = createItem('potion_small', { stackCount: 15 });
      inventory[1] = createItem('potion_small', { stackCount: 15 });
    } else if (cls === 'DW') {
      equipped.weapon = createItem('skull_staff', { level: 0 });
      equipped.gloves = createItem('silk_gloves', { level: 0 });
      equipped.boots = createItem('silk_boots', { level: 0 });
      
      inventory[0] = createItem('mana_small', { stackCount: 20 });
      inventory[1] = createItem('potion_small', { stackCount: 10 });
      
      skills.push('poison'); // DW starts with Poison scroll active
    } else if (cls === 'ELF') {
      equipped.weapon = createItem('short_bow', { level: 0 });
      equipped.gloves = createItem('vine_gloves', { level: 0 });
      equipped.boots = createItem('vine_boots', { level: 0 });
      
      inventory[0] = createItem('potion_small', { stackCount: 15 });
      inventory[1] = createItem('potion_small', { stackCount: 15 });
      
      skills.push('triple_arrow'); // Elf starts with Triple Arrow
    } else if (cls === 'MG') {
      equipped.weapon = createItem('short_sword', { level: 0 });
      equipped.gloves = createItem('silk_gloves', { level: 0 });
      equipped.boots = createItem('silk_boots', { level: 0 });
      
      inventory[0] = createItem('potion_small', { stackCount: 20 });
      
      skills.push('twisting_slash'); // MG starts with basic DK slash active
    }

    return {
      name,
      class: cls,
      level: 1,
      exp: 0,
      stats,
      freePoints: 0,
      hp: maxHp,
      mp: maxMp,
      currentMap: 'Lorencia',
      posX: 64, // Center spawn coords in standard isogrid
      posY: 64,
      inventory,
      equipped,
      zen: 10000, // Starts with 10k Zen to buy potion refills
      skills,
    };
  }
};
