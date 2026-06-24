/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Phaser from 'phaser';
import { CharacterClass, Item, Monster, Skill } from '../types';
import { createItem } from '../data/items';
import { getMonstersForMap, MONSTERS, BaseMonsterData } from '../data/monsters';
import { audioManager } from '../systems/audio';

// Isometric Projection Math Helpers
// 2:1 ratio isometric tile width and height
const TILE_W = 64;
const TILE_H = 32;

export function tileToScreen(tx: number, ty: number, mapW: number): { x: number; y: number } {
  // Center maps around a screen anchor
  const x = (tx - ty) * (TILE_W / 2);
  const y = (tx + ty) * (TILE_H / 2);
  return { x, y };
}

export function screenToTile(sx: number, sy: number, mapW: number): { x: number; y: number } {
  const tx = Math.floor((sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2);
  const ty = Math.floor((sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2);
  return { x: tx, y: ty };
}

// Global interface for Phaser -> React updates
export interface GameBridge {
  onHpMpChange: (hp: number, maxHp: number, mp: number, maxMp: number, ag: number, maxAg: number) => void;
  onLootPickup: (item: Item) => void;
  onZenPickup: (amount: number) => void;
  onExpGain: (amount: number, currentExp: number, nextLevelExp: number) => void;
  onLevelUp: (level: number, freePoints: number) => void;
  onLogMessage: (msg: string, color?: string) => void;
  onPlayerDeath: () => void;
  onMapLoaded: (mapId: 'Lorencia' | 'Dungeon' | 'Devias') => void;
}

export let bridge: GameBridge | null = null;
export function setGameBridge(b: GameBridge) {
  bridge = b;
}

// Obstacle maps (seeded simple procedural noise for maps)
const BLOCKED_TILES = new Set<string>();
function isTileBlocked(tx: number, ty: number, mapId: string): boolean {
  if (tx < 0 || ty < 0 || tx >= 128 || ty >= 128) return true;
  // Standard Lorencia safe-zone town walls (approximate center square)
  if (mapId === 'Lorencia') {
    // Spawn zone town central is walkable (40 to 80 is walkable)
    // Create some town walls or trees in the forest
    if (tx < 15 || ty < 15 || tx > 113 || ty > 113) return true; // borders
    if ((tx === 50 || tx === 78) && (ty >= 50 && ty <= 78)) return true; // central pillars
    if ((ty === 50 || ty === 78) && (tx >= 50 && tx <= 78)) return true;
  } else if (mapId === 'Dungeon') {
    // Dungeon is a labyrinth: block alternate rows and columns to make corridor corridors
    if (tx < 5 || ty < 5 || tx > 123 || ty > 123) return true;
    // Create corridor grids
    if (tx % 6 === 0 && ty % 6 !== 0 && ty % 8 !== 0) return true;
    if (ty % 6 === 0 && tx % 6 !== 0 && tx % 8 !== 0) return true;
  } else if (mapId === 'Devias') {
    // Ice map: open field with snow drifts
    if (tx < 10 || ty < 10 || tx > 118 || ty > 118) return true;
    // Scattered stone structures
    if (tx % 15 === 0 && ty % 15 === 0) return true;
    if ((tx + ty) % 25 === 0 && (tx - ty) % 12 === 0) return true;
  }
  return false;
}

// STATIC MAP TILES GRIDS (Fixed tileset matrix to keep textures consistent and avoid flickers)
export const MAP_FLOOR_GRIDS: { [mapId: string]: number[][] } = {};

export function initStaticMapGrids() {
  const maps: ('Lorencia' | 'Dungeon' | 'Devias')[] = ['Lorencia', 'Dungeon', 'Devias'];
  
  for (const mapId of maps) {
    const grid: number[][] = [];
    for (let x = 0; x < 128; x++) {
      const row: number[] = [];
      for (let y = 0; y < 128; y++) {
        let tileId = 0;
        
        if (mapId === 'Lorencia') {
          // Town safe area center is walkable and has paved stone streets
          if (x >= 50 && x <= 78 && y >= 50 && y <= 78) {
            if (x === 50 || x === 78 || y === 50 || y === 78) {
              tileId = 1; // Paved border road
            } else if ((x + y) % 4 === 0) {
              tileId = 2; // Stone tiles/bricks
            } else {
              tileId = 1; // Dirt path
            }
          } else {
            // Forest areas: Grass (0) with patches of flower grass (3) and dirt roads (1)
            if (Math.abs(x - 64) <= 4 || Math.abs(y - 64) <= 4) {
              tileId = 1; // Main roads extending out
            } else {
              const val = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 0.5 + 0.5;
              if (val > 0.7) {
                tileId = 3; // Flower/dense grass patches
              } else if (val < 0.2) {
                tileId = 1; // Some natural dirt path patches
              } else {
                tileId = 0; // Base grass
              }
            }
          }
        } else if (mapId === 'Dungeon') {
          const val = (x * 17 + y * 23) % 100;
          if (val < 15) {
            tileId = 1; // Cracked brick
          } else if (val >= 15 && val < 25) {
            tileId = 2; // Iron Grate
          } else if (val >= 25 && val < 30) {
            tileId = 3; // Slime trail
          } else {
            tileId = 0; // Standard brick
          }
        } else if (mapId === 'Devias') {
          const val = (Math.sin(x * 0.15) * Math.cos(y * 0.15)) * 0.5 + 0.5;
          if (val > 0.85) {
            tileId = 1; // Glacier blue ice patches
          } else if (val < 0.15) {
            tileId = 2; // Frozen Stone
          } else if (val > 0.7) {
            tileId = 3; // Snow paths / tracks
          } else {
            tileId = 0; // Pure white snow
          }
        }
        row.push(tileId);
      }
      grid.push(row);
    }
    MAP_FLOOR_GRIDS[mapId] = grid;
  }
}

// Initialize map grids immediately at module load
initStaticMapGrids();

// Optimized A* Pathfinding step limit (for mobile CPU)
interface PathNode {
  x: number;
  y: number;
  g: number;
  f: number;
  parent: PathNode | null;
}

export function findAStarPath(startX: number, startY: number, endX: number, endY: number, mapId: string): { x: number; y: number }[] {
  if (isTileBlocked(endX, endY, mapId)) return [];
  const openList: PathNode[] = [];
  const closedList = new Set<string>();

  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    f: Math.abs(endX - startX) + Math.abs(endY - startY),
    parent: null,
  };

  openList.push(startNode);
  let iterations = 0;
  const maxIterations = 180; // Safeguard for mobile performance

  while (openList.length > 0 && iterations++ < maxIterations) {
    // Get lowest F cost
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;
    const currentKey = `${current.x},${current.y}`;
    closedList.add(currentKey);

    if (current.x === endX && current.y === endY) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let curr: PathNode | null = current;
      while (curr !== null) {
        path.push({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      return path.reverse();
    }

    // Neighbors (4 directions + diagonals)
    const dirs = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
    ];

    for (const d of dirs) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      const nKey = `${nx},${ny}`;

      if (closedList.has(nKey) || isTileBlocked(nx, ny, mapId)) continue;

      const cost = (d.x !== 0 && d.y !== 0) ? 1.4 : 1.0;
      const g = current.g + cost;
      const h = Math.abs(endX - nx) + Math.abs(endY - ny);
      const f = g + h;

      const existingOpen = openList.find(node => node.x === nx && node.y === ny);
      if (existingOpen) {
        if (g < existingOpen.g) {
          existingOpen.g = g;
          existingOpen.f = f;
          existingOpen.parent = current;
        }
      } else {
        openList.push({ x: nx, y: ny, g, f, parent: current });
      }
    }
  }

  // Fallback: direct walk line if A* gets cut off but destination is clear
  return [];
}

// BOOT SCENE: Generates Canvas Textures for procedural sprites
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.cameras.main.setBackgroundColor('#000000');
    
    // Draw loading message
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Carregando MU Mobile...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd700',
    }).setOrigin(0.5);
  }

  create() {
    this.generateAllProceduralTextures();
    this.scene.start('GameScene');
  }

  private generateAllProceduralTextures() {
    // 1. TILES (Generate 4 fixed variations for each map scene using canvas grid drawing)
    for (let i = 0; i < 4; i++) {
      this.createIsometricTileTexture(`tile_lorencia_${i}`, 'lorencia', i);
      this.createIsometricTileTexture(`tile_dungeon_${i}`, 'dungeon', i);
      this.createIsometricTileTexture(`tile_devias_${i}`, 'devias', i);
    }

    // 2. PLAYERS
    this.createPlayerTexture('player_DK', '#42424b', '#b3a2c7', '#ffd700', 'sword'); // Silver armor + red wings/cape + Sword
    this.createPlayerTexture('player_DW', '#1a237e', '#3f51b5', '#e040fb', 'staff'); // Dark blue robe + purple wings + Staff
    this.createPlayerTexture('player_ELF', '#2e7d32', '#81c784', '#00ffcc', 'bow');  // Green agile armor + cyan wings + Bow
    this.createPlayerTexture('player_MG', '#311b92', '#d50000', '#ffd700', 'runesword'); // Violet runed heavy armor + dual style sword

    // 3. MONSTERS
    this.createMonsterTexture('mob_budge_dragon', '#cc2222', '#ff5555', 20);
    this.createMonsterTexture('mob_spider', '#8d0000', '#220000', 22);
    this.createMonsterTexture('mob_hell_hound', '#ff5500', '#ffff00', 28);
    this.createMonsterTexture('mob_lich', '#aa00ff', '#e040fb', 26);
    this.createMonsterTexture('mob_troll', '#5d4037', '#7b5e57', 36);
    this.createMonsterTexture('mob_skeleton', '#dcdcdc', '#a9a9a9', 28);
    this.createMonsterTexture('mob_dark_knight_mob', '#37474f', '#455a64', 30);
    this.createMonsterTexture('mob_ghost', '#80deea', '#00acc1', 28, true); // Ghost float
    this.createMonsterTexture('mob_larva', '#4caf50', '#81c784', 22);
    this.createMonsterTexture('mob_devil_boss', '#b71c1c', '#ff1744', 48);
    this.createMonsterTexture('mob_yeti', '#ffffff', '#e0e0e0', 38);
    this.createMonsterTexture('mob_elite_yeti', '#00e5ff', '#00838f', 44);
    this.createMonsterTexture('mob_ice_queen', '#e0f7fa', '#80deea', 44);

    // 4. DROPS
    this.createGroundDropTexture('drop_zen', '#ffd700');
    this.createGroundDropTexture('drop_potion_hp', '#ff1111');
    this.createGroundDropTexture('drop_potion_mp', '#1111ff');
    this.createGroundDropTexture('drop_jewel', '#e040fb'); // Glowing purple jewel shape
    this.createGroundDropTexture('drop_item', '#b0bec5');  // Regular weapon/armor drops
  }

  private createIsometricTileTexture(key: string, mapId: string, tileId: number) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    const canvas = this.textures.createCanvas(key, TILE_W, TILE_H);
    const ctx = canvas.getContext();

    // Reset canvas transparent background
    ctx.clearRect(0, 0, TILE_W, TILE_H);

    // Save and clip to isometric diamond shape (to ensure pixel-perfect bounds)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(TILE_W / 2, 0);
    ctx.lineTo(TILE_W, TILE_H / 2);
    ctx.lineTo(TILE_W / 2, TILE_H);
    ctx.lineTo(0, TILE_H / 2);
    ctx.closePath();
    ctx.clip();

    if (mapId === 'lorencia') {
      if (tileId === 0) {
        // Base grass: Rich forest green
        ctx.fillStyle = '#11250a';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        // Pixelated tufts of grass using fillRect grid
        ctx.fillStyle = '#224a14';
        for (let i = 0; i < TILE_W; i += 4) {
          for (let j = 0; j < TILE_H; j += 4) {
            if ((i + j) % 3 === 0) {
              ctx.fillRect(i, j, 2, 2);
            }
          }
        }
        ctx.fillStyle = '#1d3f11';
        for (let i = 2; i < TILE_W; i += 6) {
          for (let j = 2; j < TILE_H; j += 6) {
            ctx.fillRect(i, j, 3, 2);
          }
        }
      } else if (tileId === 1) {
        // Dirt path: Warm brown/ochre grid pattern
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#3e2723';
        for (let i = 0; i < TILE_W; i += 6) {
          for (let j = 0; j < TILE_H; j += 6) {
            if ((i * 2 + j) % 5 === 0) {
              ctx.fillRect(i, j, 4, 3);
            }
          }
        }
        ctx.fillStyle = '#5d4037';
        for (let i = 3; i < TILE_W; i += 8) {
          for (let j = 3; j < TILE_H; j += 8) {
            ctx.fillRect(i, j, 3, 2);
          }
        }
      } else if (tileId === 2) {
        // Town square stone bricks: Beautiful distinct grey brick grid
        ctx.fillStyle = '#37474f';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        // Grid lines via fillRect
        ctx.fillStyle = '#1c2429';
        for (let i = 0; i < TILE_W; i += 8) {
          ctx.fillRect(i, 0, 1, TILE_H);
        }
        for (let j = 0; j < TILE_H; j += 8) {
          ctx.fillRect(0, j, TILE_W, 1);
        }

        ctx.fillStyle = '#455a64';
        for (let i = 1; i < TILE_W; i += 8) {
          for (let j = 1; j < TILE_H; j += 8) {
            ctx.fillRect(i, j, 6, 2);
          }
        }
      } else {
        // Flower Grass: Lush green with small colorful flowers
        ctx.fillStyle = '#11250a';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#1c3e10';
        for (let i = 0; i < TILE_W; i += 4) {
          for (let j = 0; j < TILE_H; j += 4) {
            if ((i + j) % 2 === 0) ctx.fillRect(i, j, 2, 2);
          }
        }

        const colors = ['#e53935', '#ffb300', '#ffffff', '#29b6f6'];
        for (let i = 8; i < TILE_W - 8; i += 12) {
          for (let j = 4; j < TILE_H - 4; j += 10) {
            const col = colors[(i + j) % colors.length];
            ctx.fillStyle = col;
            ctx.fillRect(i, j, 3, 3);
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(i + 1, j + 1, 1, 1);
          }
        }
      }
    } else if (mapId === 'dungeon') {
      if (tileId === 0) {
        // Dark Stone Brick: Dark graphite gray brick
        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#0d0d0f';
        for (let i = 0; i < TILE_W; i += 8) {
          ctx.fillRect(i, 0, 2, TILE_H);
        }
        for (let j = 0; j < TILE_H; j += 8) {
          ctx.fillRect(0, j, TILE_W, 2);
        }
      } else if (tileId === 1) {
        // Cracked brick: Charcoal
        ctx.fillStyle = '#18181c';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#0a0a0c';
        for (let i = 4; i < TILE_W - 4; i += 16) {
          ctx.fillRect(i, i/2, 6, 2);
          ctx.fillRect(i + 4, i/2 + 2, 2, 4);
        }
      } else if (tileId === 2) {
        // Iron Grate: Metal mesh look
        ctx.fillStyle = '#0d0d0e';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#455a64';
        for (let i = 4; i < TILE_W; i += 8) {
          ctx.fillRect(i, 0, 2, TILE_H);
        }
        for (let j = 2; j < TILE_H; j += 4) {
          ctx.fillRect(0, j, TILE_W, 1);
        }
      } else {
        // Slime brick: Dark brick with purple moss/slime
        ctx.fillStyle = '#1a0f1a';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#311b92';
        for (let i = 0; i < TILE_W; i += 4) {
          for (let j = 0; j < TILE_H; j += 4) {
            if ((i * j) % 3 === 0) ctx.fillRect(i, j, 2, 2);
          }
        }
        ctx.fillStyle = '#e040fb';
        ctx.fillRect(TILE_W/2 - 4, TILE_H/2, 8, 2);
      }
    } else {
      // Devias
      if (tileId === 0) {
        // Snow: Pure white with ice grids
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#e0f2f1';
        for (let i = 0; i < TILE_W; i += 6) {
          for (let j = 0; j < TILE_H; j += 6) {
            ctx.fillRect(i, j, 2, 2);
          }
        }
      } else if (tileId === 1) {
        // Glacier Ice: Deep cyan ice
        ctx.fillStyle = '#b2ebf2';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#80deea';
        for (let i = 0; i < TILE_W; i += 10) {
          ctx.fillRect(i, i/2, 5, 2);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(TILE_W/2, TILE_H/2, 4, 4);
      } else if (tileId === 2) {
        // Frozen Stone
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#90a4ae';
        for (let i = 0; i < TILE_W; i += 8) {
          ctx.fillRect(i, 0, 1, TILE_H);
          ctx.fillRect(0, i/2, TILE_W, 1);
        }
      } else {
        // Snow paths
        ctx.fillStyle = '#eceff1';
        ctx.fillRect(0, 0, TILE_W, TILE_H);

        ctx.fillStyle = '#cfd8dc';
        for (let i = 0; i < TILE_W; i += 4) {
          if (i % 3 === 0) {
            ctx.fillRect(i, i/2, 3, 2);
          }
        }
      }
    }

    ctx.restore();

    // Sharp isometric tile border line (eliminates subpixel gap lines)
    ctx.strokeStyle = mapId === 'lorencia' ? '#070f04' : mapId === 'dungeon' ? '#050507' : '#90caf9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(TILE_W / 2, 0);
    ctx.lineTo(TILE_W, TILE_H / 2);
    ctx.lineTo(TILE_W / 2, TILE_H);
    ctx.lineTo(0, TILE_H / 2);
    ctx.closePath();
    ctx.stroke();

    canvas.refresh();
  }

  private createPlayerTexture(key: string, bodyColor: string, detailColor: string, wingColor: string, weaponType: string) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    // Generate a 48x64 sprite representing a standing character
    const canvas = this.textures.createCanvas(key, 48, 64);
    const ctx = canvas.getContext();

    // Clear background
    ctx.clearRect(0, 0, 48, 64);

    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(24, 56, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Wings (glowing cape style behind player)
    ctx.fillStyle = wingColor;
    ctx.shadowColor = wingColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    // Left wing
    ctx.moveTo(24, 28);
    ctx.quadraticCurveTo(4, 8, 8, 40);
    ctx.lineTo(24, 38);
    // Right wing
    ctx.moveTo(24, 28);
    ctx.quadraticCurveTo(44, 8, 40, 40);
    ctx.lineTo(24, 38);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset

    // Draw Body / Armor
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(24, 32, 10, 0, Math.PI * 2); // Core trunk
    ctx.fill();
    ctx.stroke();

    // Draw Legs
    ctx.fillStyle = bodyColor;
    ctx.fillRect(17, 40, 5, 14);
    ctx.fillRect(26, 40, 5, 14);

    // Head / Helm
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.arc(24, 18, 7, 0, Math.PI * 2);
    ctx.fill();
    // Helm crest/gold trim
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(22, 9, 4, 5);

    // Draw Shoulder pads
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.arc(12, 30, 4, 0, Math.PI * 2);
    ctx.arc(36, 30, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Weapon based on class
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (weaponType === 'sword') {
      // Blade slash right-side
      ctx.moveTo(36, 32);
      ctx.lineTo(46, 12);
      ctx.stroke();
      // Guard
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.moveTo(33, 28);
      ctx.lineTo(39, 28);
      ctx.stroke();
    } else if (weaponType === 'staff') {
      // Magic Staff
      ctx.moveTo(36, 38);
      ctx.lineTo(36, 6);
      ctx.stroke();
      // Glowing orb tip
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(36, 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (weaponType === 'bow') {
      // Bow on left arm
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(10, 30, 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      // Bowstring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, 22);
      ctx.lineTo(10, 38);
      ctx.stroke();
    } else if (weaponType === 'runesword') {
      // Red glowing giant sword
      ctx.strokeStyle = '#ff1744';
      ctx.moveTo(36, 32);
      ctx.lineTo(48, 10);
      ctx.stroke();
    }

    canvas.refresh();
  }

  private createMonsterTexture(key: string, bodyColor: string, accentColor: string, radius: number, float: boolean = false) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    const canvas = this.textures.createCanvas(key, 48, 64);
    const ctx = canvas.getContext();

    ctx.clearRect(0, 0, 48, 64);

    const floorY = 54;
    const bodyY = float ? 34 : 40;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(24, floorY, radius * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(24, bodyY, radius / 2, 0, Math.PI * 2);
    ctx.fill();

    // Accent eyes / detail
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(20, bodyY - 4, 3, 0, Math.PI * 2);
    ctx.arc(28, bodyY - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Horns / spikes
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24 - (radius / 3), bodyY - (radius / 3));
    ctx.lineTo(16, bodyY - 18);
    ctx.moveTo(24 + (radius / 3), bodyY - (radius / 3));
    ctx.lineTo(32, bodyY - 18);
    ctx.stroke();

    canvas.refresh();
  }

  private createGroundDropTexture(key: string, color: string) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    const canvas = this.textures.createCanvas(key, 24, 24);
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, 24, 24);

    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.fillStyle = color;

    ctx.beginPath();
    if (key.includes('zen')) {
      // Stack of gold coins
      ctx.arc(12, 12, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (key.includes('potion')) {
      // Flask diamond
      ctx.moveTo(12, 4);
      ctx.lineTo(18, 14);
      ctx.lineTo(12, 20);
      ctx.lineTo(6, 14);
      ctx.closePath();
      ctx.fill();
    } else if (key.includes('jewel')) {
      // Spinning gem octahedron
      ctx.moveTo(12, 3);
      ctx.lineTo(19, 12);
      ctx.lineTo(12, 21);
      ctx.lineTo(5, 12);
      ctx.closePath();
      ctx.fill();
    } else {
      // Regular weapon drop (diagonal line)
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, 20);
      ctx.lineTo(20, 4);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    canvas.refresh();
  }
}

// GAMEPLAY SCENE: Renders isometric viewport, player state, mobs, combat rules, pathfinding, floating text
export class GameScene extends Phaser.Scene {
  private playerClass: CharacterClass = 'DK';
  private playerLevel = 1;
  private playerName = 'DarkWarrior';
  private playerX = 64; // tile space
  private playerY = 64;
  private playerZen = 10000;
  private playerExp = 0;
  private playerFreePoints = 0;
  private playerStats = { str: 28, agi: 20, vit: 25, ene: 10 };
  private playerSkills: string[] = [];

  // Active runtime combat attributes
  private hp = 100;
  private maxHp = 100;
  private mp = 50;
  private maxMp = 50;
  private ag = 100;
  private maxAg = 100;

  // Render objects
  private tileSprites: { [key: string]: Phaser.GameObjects.Image } = {};
  private visibleTilesMap = new Map<string, Phaser.GameObjects.Image>();
  private mapGroup!: Phaser.GameObjects.Group;
  private entitiesGroup!: Phaser.GameObjects.Group;
  private dropsGroup!: Phaser.GameObjects.Group;

  private playerSprite!: Phaser.GameObjects.Container;
  private monsterSprites: Map<string, {
    container: Phaser.GameObjects.Container;
    data: BaseMonsterData;
    currentHp: number;
    tileX: number;
    tileY: number;
    lastAttackTime: number;
    isDead: boolean;
    state: 'idle' | 'chase' | 'attack';
  }> = new Map();

  // Movement & targeting state
  private isAutoAttacking = false;
  private currentTargetId: string | null = null;
  private activePath: { x: number; y: number }[] = [];
  private pathStepIndex = 0;
  private moveTimer = 0;
  private moveInterval = 250; // ms per tile movement speed basis
  private skillEquipped: string | null = null;

  // Map settings
  private currentMapId: 'Lorencia' | 'Dungeon' | 'Devias' = 'Lorencia';

  constructor() {
    super('GameScene');
  }

  init(data: any) {
    if (data && data.character) {
      const c = data.character;
      this.playerName = c.name;
      this.playerClass = c.class;
      this.playerLevel = c.level;
      this.playerExp = c.exp;
      this.playerZen = c.zen;
      this.playerFreePoints = c.freePoints;
      this.playerStats = { ...c.stats };
      this.playerSkills = [...c.skills];
      this.playerX = c.posX;
      this.playerY = c.posY;
      this.currentMapId = c.currentMap;
    }
    this.recalcCombatStats();
    // Refill fully on load
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.ag = this.maxAg;
  }

  create() {
    this.visibleTilesMap.clear();
    this.cameras.main.setBackgroundColor(
      this.currentMapId === 'Lorencia' ? '#0c0712' : this.currentMapId === 'Dungeon' ? '#060608' : '#0a141a'
    );

    // Dynamic depth group
    this.mapGroup = this.add.group();
    this.entitiesGroup = this.add.group();
    this.dropsGroup = this.add.group();

    // Build immediate viewport tiles
    this.rebuildVisibleTiles();

    // Create player container
    this.playerSprite = this.add.container(0, 0);
    const pBody = this.add.sprite(0, 0, `player_${this.playerClass}`);
    this.playerSprite.add(pBody);

    // Glowing circle underneath player
    const aura = this.add.graphics();
    aura.fillStyle(0x00ffff, 0.15);
    aura.fillCircle(0, 15, 12);
    this.playerSprite.add(aura);

    // Name Tag
    const nameTag = this.add.text(0, -42, `${this.playerName} (Lv ${this.playerLevel})`, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 4, y: 1 }
    }).setOrigin(0.5);
    this.playerSprite.add(nameTag);

    this.entitiesGroup.add(this.playerSprite);
    this.alignPlayerPositionToScreen();

    // Center camera on player
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.1);
    this.cameras.main.setRoundPixels(true);

    // Map input handles (Click on floor to walk)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignore click if HUD panels block it or pointer is over joystick/skills
      if (pointer.x < 150 && pointer.y > this.scale.height - 150) return; // joystick block
      if (pointer.x > this.scale.width - 150 && pointer.y > this.scale.height - 150) return; // attack button block

      // Get screen coordinates in world space
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Project back to iso coordinates
      const tile = screenToTile(worldX, worldY, 128);
      
      // Check if we tapped a monster instead
      let clickedMobId: string | null = null;
      this.monsterSprites.forEach((sprite, id) => {
        if (sprite.isDead) return;
        const bounds = sprite.container.getBounds();
        if (bounds.contains(worldX, worldY)) {
          clickedMobId = id;
        }
      });

      if (clickedMobId) {
        this.currentTargetId = clickedMobId;
        this.isAutoAttacking = true;
        this.activePath = []; // Clear walking path, we attack!
        if (bridge) bridge.onLogMessage(`Mirando em: ${this.monsterSprites.get(clickedMobId)!.data.name}`, '#ff4444');
      } else {
        // Tapped floor - clear target and find path to walk
        this.currentTargetId = null;
        this.isAutoAttacking = false;
        
        const path = findAStarPath(this.playerX, this.playerY, tile.x, tile.y, this.currentMapId);
        if (path && path.length > 0) {
          this.activePath = path;
          this.pathStepIndex = 0;
          this.moveTimer = this.time.now;
        } else {
          // If A* pathfinding fails or blocked, try walking to a nearest direct tile
          const dx = Phaser.Math.Clamp(tile.x, this.playerX - 1, this.playerX + 1);
          const dy = Phaser.Math.Clamp(tile.y, this.playerY - 1, this.playerY + 1);
          if (!isTileBlocked(dx, dy, this.currentMapId)) {
            this.activePath = [{ x: dx, y: dy }];
            this.pathStepIndex = 0;
            this.moveTimer = this.time.now;
          }
        }
      }
    });

    // Populate monsters
    this.spawnMonsters();

    // Start background soundtrack
    audioManager.startBGM(this.currentMapId);

    // Initial sync with React
    this.syncBridge();

    // Start auto-regens timer
    this.time.addEvent({
      delay: 1000,
      callback: this.handleRegenerations,
      callbackScope: this,
      loop: true
    });

    // Notify bridge
    if (bridge) bridge.onMapLoaded(this.currentMapId);
  }

  update(time: number, delta: number) {
    this.handleMovement(time);
    this.handleCombatLoop(time);
    this.depthSortAll();
  }

  // RECALCULATE ATK/DEF STATS FROM BASEFORMULAS
  private recalcCombatStats() {
    const s = this.playerStats;
    const l = this.playerLevel;

    // HP & MP formula per class from original specifications
    if (this.playerClass === 'DK') {
      this.maxHp = Math.floor(110 + s.vit * 2 + l * 3);
      this.maxMp = Math.floor(110 + s.ene * 1.5 + l * 1);
    } else if (this.playerClass === 'DW') {
      this.maxHp = Math.floor(90 + s.vit * 1.5 + l * 2);
      this.maxMp = Math.floor(80 + s.ene * 3 + l * 5);
    } else if (this.playerClass === 'ELF') {
      this.maxHp = Math.floor(80 + s.vit * 1.5 + l * 2);
      this.maxMp = Math.floor(100 + s.ene * 2 + l * 3);
    } else if (this.playerClass === 'MG') {
      this.maxHp = Math.floor(110 + s.vit * 2 + l * 3);
      this.maxMp = Math.floor(80 + s.ene * 2 + l * 3);
    }

    this.maxAg = Math.floor(100 + s.agi * 2 + l * 3);
  }

  private handleRegenerations() {
    // Regenerate values per 3 seconds in original, but let's do soft tick per second
    const isFighting = this.currentTargetId !== null;

    // HP: 1 + VIT * 0.1 per 3s. Off-combat increases by 2x
    const hpReg = (1 + this.playerStats.vit * 0.1) / (isFighting ? 3 : 1.5);
    this.hp = Math.min(this.maxHp, Math.floor(this.hp + hpReg));

    // MP: 1 + ENE * 0.1
    const mpReg = (1 + this.playerStats.ene * 0.1) / (isFighting ? 3 : 1);
    this.mp = Math.min(this.maxMp, Math.floor(this.mp + mpReg));

    // AG: 3 + AGI * 0.05 per second (always active)
    const agReg = 3 + this.playerStats.agi * 0.05;
    this.ag = Math.min(this.maxAg, Math.floor(this.ag + agReg));

    this.syncBridge();
  }

  private syncBridge() {
    if (bridge) {
      bridge.onHpMpChange(this.hp, this.maxHp, this.mp, this.maxMp, this.ag, this.maxAg);
    }
  }

  // SPAWN MONSTERS SPECIFIC TO MAP
  private spawnMonsters() {
    const list = getMonstersForMap(this.currentMapId);
    
    // Clear old monsters
    this.monsterSprites.forEach(m => m.container.destroy());
    this.monsterSprites.clear();

    // Spawn 10 to 15 monsters around player and map
    for (let i = 0; i < 18; i++) {
      const mobId = list[Math.floor(Math.random() * list.length)];
      const data = MONSTERS[mobId];
      if (!data) continue;

      // Spawn in scattered coords
      let spawnX = 0;
      let spawnY = 0;
      let retries = 0;
      do {
        spawnX = Phaser.Math.Between(15, 110);
        spawnY = Phaser.Math.Between(15, 110);
      } while (isTileBlocked(spawnX, spawnY, this.currentMapId) && retries++ < 20);

      this.createMonsterInstance(mobId + '_' + i, data, spawnX, spawnY);
    }
  }

  private createMonsterInstance(instanceId: string, data: BaseMonsterData, tx: number, ty: number) {
    const screen = tileToScreen(tx, ty, 128);

    const container = this.add.container(screen.x, screen.y);
    const sprite = this.add.sprite(0, 0, `mob_${data.id}`);
    container.add(sprite);

    // Shadow circle
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillCircle(0, 15, data.size / 2);
    container.add(shadow);

    // Name text
    const nameText = this.add.text(0, -32, data.name, {
      fontSize: '10px',
      color: '#ff4444',
      fontFamily: 'monospace',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);
    container.add(nameText);

    // Soft red HP bar above mob
    const hpBar = this.add.graphics();
    hpBar.fillStyle(0xff0000, 1);
    hpBar.fillRect(-15, -20, 30, 3);
    container.add(hpBar);

    this.entitiesGroup.add(container);

    this.monsterSprites.set(instanceId, {
      container,
      data,
      currentHp: data.maxHp,
      tileX: tx,
      tileY: ty,
      lastAttackTime: 0,
      isDead: false,
      state: 'idle',
    });
  }

  // VISIBLE TILES GRAPHICS VIEWPORT CACHE
  private rebuildVisibleTiles() {
    const range = 8; // Tiles rendered in surrounding radial viewport
    const startX = Math.max(0, this.playerX - range);
    const endX = Math.min(127, this.playerX + range);
    const startY = Math.max(0, this.playerY - range);
    const endY = Math.min(127, this.playerY + range);

    const visibleKeys = new Set<string>();
    const mapGrid = MAP_FLOOR_GRIDS[this.currentMapId];

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        if (isTileBlocked(x, y, this.currentMapId)) continue;

        const key = `${x},${y}`;
        visibleKeys.add(key);

        const tileId = mapGrid ? mapGrid[x][y] : 0;
        const tileKey = `tile_${this.currentMapId.toLowerCase()}_${tileId}`;

        let tileImg = this.visibleTilesMap.get(key);
        if (!tileImg) {
          const screen = tileToScreen(x, y, 128);
          tileImg = this.add.image(screen.x, screen.y, tileKey);
          tileImg.setDepth(-1000 + (x + y));
          this.mapGroup.add(tileImg);
          this.visibleTilesMap.set(key, tileImg);
        } else {
          // Keep it visible and ensure correct texture key (e.g. if map changed)
          tileImg.setTexture(tileKey);
          tileImg.setVisible(true);
        }
      }
    }

    // Hide or destroy tiles that are no longer visible
    for (const [key, img] of this.visibleTilesMap.entries()) {
      if (!visibleKeys.has(key)) {
        img.setVisible(false);
        // Destroy tiles that are far away from player to reclaim memory
        const [tx, ty] = key.split(',').map(Number);
        const dist = Math.max(Math.abs(tx - this.playerX), Math.abs(ty - this.playerY));
        if (dist > 12) {
          img.destroy();
          this.visibleTilesMap.delete(key);
        }
      }
    }
  }

  private alignPlayerPositionToScreen() {
    const screen = tileToScreen(this.playerX, this.playerY, 128);
    this.playerSprite.setPosition(screen.x, screen.y);
    this.playerSprite.setDepth(this.playerX + this.playerY);
  }

  // PLAYER MOVEMENT PROCESS
  private handleMovement(time: number) {
    if (this.activePath.length === 0) return;

    if (time >= this.moveTimer) {
      // Move to next step in path
      const nextTile = this.activePath[this.pathStepIndex];
      if (nextTile) {
        this.playerX = nextTile.x;
        this.playerY = nextTile.y;

        // Animate a simple sprite bobbing when walking
        this.tweens.add({
          targets: this.playerSprite.list[0],
          y: -4,
          duration: 100,
          yoyo: true,
          ease: 'Quad.easeInOut'
        });

        this.alignPlayerPositionToScreen();
        this.rebuildVisibleTiles();

        this.pathStepIndex++;
        if (this.pathStepIndex >= this.activePath.length) {
          this.activePath = [];
          this.pathStepIndex = 0;
        }
      }

      // Movement speed adjusted by player Agility stat (faster AGI = faster footsteps)
      const agiSpeedBonus = Math.min(120, this.playerStats.agi * 0.8);
      this.moveTimer = time + Math.max(140, this.moveInterval - agiSpeedBonus);
    }
  }

  // JOYSTICK OVERRIDE FOR CONTINUOUS MOVEMENT
  public handleJoystickInput(angleRad: number) {
    this.activePath = []; // Cancel A* touch paths
    
    // Project radian angle to tile directions
    const dx = Math.round(Math.cos(angleRad));
    const dy = Math.round(Math.sin(angleRad));

    const nextX = this.playerX + dx;
    const nextY = this.playerY + dy;

    if (!isTileBlocked(nextX, nextY, this.currentMapId)) {
      this.activePath = [{ x: nextX, y: nextY }];
      this.pathStepIndex = 0;
      this.moveTimer = this.time.now;
    }
  }

  // AUTO-ATTACK & SPELL CAST CORE COMBAT ENGINE
  private handleCombatLoop(time: number) {
    if (!this.isAutoAttacking || !this.currentTargetId) return;

    const target = this.monsterSprites.get(this.currentTargetId);
    if (!target || target.isDead) {
      this.currentTargetId = null;
      this.isAutoAttacking = false;
      return;
    }

    // Distance calculation
    const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY, target.tileX, target.tileY);

    // Decide attack reach range based on equipped skill or default melee (1.6 tiles)
    let reach = 1.6;
    let selectedSkill: Skill | null = null;

    if (this.skillEquipped) {
      const { SKILLS } = require('../data/skills'); // safe load
      selectedSkill = SKILLS[this.skillEquipped];
      if (selectedSkill) {
        reach = selectedSkill.range || 1.6;
      }
    }

    if (dist > reach) {
      // Target is out of reach - path find towards the target
      if (this.activePath.length === 0) {
        const path = findAStarPath(this.playerX, this.playerY, target.tileX, target.tileY, this.currentMapId);
        if (path && path.length > 0) {
          // Exclude final tile so player stops right before
          this.activePath = path.slice(0, -1);
          this.pathStepIndex = 0;
          this.moveTimer = this.time.now;
        }
      }
      return;
    }

    // Within range - trigger attack swing timer
    const atkSpeed = 1000 - Math.min(450, this.playerStats.agi * 1.5); // faster Agility = faster attack speed
    const lastAtk = (this.playerSprite as any).lastAttackTime || 0;

    if (time >= lastAtk + atkSpeed) {
      (this.playerSprite as any).lastAttackTime = time;
      this.executeAttackOnTarget(target, selectedSkill);
    }
  }

  private executeAttackOnTarget(target: any, skill: Skill | null) {
    if (this.hp <= 0) return;

    // Resource check
    if (skill) {
      if (this.mp < skill.mpCost) {
        if (bridge) bridge.onLogMessage('Sem Mana!', '#00aacc');
        this.isAutoAttacking = false;
        return;
      }
      if (this.ag < skill.agCost) {
        if (bridge) bridge.onLogMessage('Sem Stamina (AG)!', '#00ffcc');
        this.isAutoAttacking = false;
        return;
      }

      this.mp -= skill.mpCost;
      this.ag -= skill.agCost;
      this.syncBridge();
    }

    // Swing sword/glow anim
    this.tweens.add({
      targets: this.playerSprite.list[0],
      scaleX: 1.15,
      scaleY: 1.05,
      duration: 80,
      yoyo: true,
    });

    // Sound synthesize
    if (skill) {
      audioManager.playSpellCast(skill.color);
    } else {
      audioManager.playSwordHit();
    }

    // Emit spell visual effects
    this.showSkillEffect(target.container.x, target.container.y, skill);

    // DMG FORMULA CLASSIC MU 97d
    // Stats influence
    const s = this.playerStats;
    let baseMin = 1;
    let baseMax = 5;

    if (this.playerClass === 'DK') {
      baseMin = s.str / 7 + 10; // 10 is average weapon starter power
      baseMax = s.str / 5 + 18;
    } else if (this.playerClass === 'DW') {
      // Staff power bonuses based on energy
      baseMin = s.ene / 9 + 8;
      baseMax = s.ene / 7 + 14;
    } else if (this.playerClass === 'ELF') {
      baseMin = s.agi / 8 + s.str / 9 + 6;
      baseMax = s.agi / 6 + s.str / 7 + 12;
    } else if (this.playerClass === 'MG') {
      baseMin = s.str / 6 + s.ene / 10 + 12;
      baseMax = s.str / 4 + s.ene / 8 + 20;
    }

    const baseDmg = Phaser.Math.Between(Math.floor(baseMin), Math.floor(baseMax));
    const skillMultiplier = skill ? skill.damagePercent / 100 : 1.0;

    // Crit chance based on agi
    const critChance = Math.min(0.30, s.agi / 220);
    const isCrit = Math.random() < critChance;
    const critMult = isCrit ? 2.0 : 1.0;

    // Defense reduction of target
    const targetDef = target.data.def;
    const defReduction = targetDef / (targetDef + 60);

    let finalDmg = Math.floor(baseDmg * skillMultiplier * critMult * (1 - defReduction));
    finalDmg = Math.max(1, finalDmg);

    // Excellent damage roll (20% chance if we have excellent modifiers)
    const isExcellent = Math.random() < 0.12; // simulated classic modifier
    if (isExcellent) {
      finalDmg = Math.floor(finalDmg * 1.25);
    }

    // Special Vampiric Heal on Blood Attack
    if (skill && skill.id === 'blood_attack') {
      const heal = Math.floor(finalDmg * 0.30);
      this.hp = Math.min(this.maxHp, this.hp + heal);
      this.showDamageText(this.playerSprite.x, this.playerSprite.y - 20, `+${heal}`, '#00ff44');
      this.syncBridge();
    }

    // Apply HP change
    target.currentHp -= finalDmg;

    // Float DMG number over mob
    let dmgColor = '#ffff00'; // Yellow normal
    let dmgLabel = `${finalDmg}`;

    if (isExcellent) {
      dmgColor = '#aa00ff'; // Violet Excellent
      dmgLabel = `EX ${finalDmg}!`;
    } else if (isCrit) {
      dmgColor = '#ff6600'; // Orange Crit
      dmgLabel = `${finalDmg}!!`;
    }

    this.showDamageText(target.container.x, target.container.y - 15, dmgLabel, dmgColor);

    // Re-draw HP mini-bar over mob
    const barG = target.container.list[3] as Phaser.GameObjects.Graphics;
    barG.clear();
    const hpPercent = Math.max(0, target.currentHp / target.data.maxHp);
    barG.fillStyle(0x00ff00, 1);
    barG.fillRect(-15, -20, 30 * hpPercent, 3);
    barG.fillStyle(0xff0000, 0.4);
    barG.fillRect(-15 + 30 * hpPercent, -20, 30 * (1 - hpPercent), 3);

    // Mob aggros player on attack
    if (target.state === 'idle') {
      target.state = 'chase';
    }

    // Handle target death
    if (target.currentHp <= 0) {
      this.handleMonsterDeath(target);
    }
  }

  // FLOAT DAMAGES
  private showDamageText(x: number, y: number, label: string, color: string) {
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '15px',
      stroke: '#000000',
      strokeThickness: 3,
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    text.setDepth(2000);

    this.tweens.add({
      targets: text,
      y: y - 45,
      alpha: 0,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  // SPELL VISUALS EMITTER
  private showSkillEffect(x: number, y: number, skill: Skill | null) {
    if (!skill) return;

    const g = this.add.graphics();
    g.setDepth(1500);

    if (skill.effectType === 'aoe') {
      // Expanding circle
      g.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(skill.color).color, 0.8);
      g.strokeCircle(x, y, 10);
      this.tweens.add({
        targets: g,
        scaleX: 4,
        scaleY: 4,
        alpha: 0,
        x: x - x * 3, // keep centered on scaling
        y: y - y * 3,
        duration: 400,
        onComplete: () => g.destroy()
      });
    } else {
      // Lightning bolts or shards
      g.fillStyle(Phaser.Display.Color.HexStringToColor(skill.color).color, 0.7);
      for (let i = 0; i < 5; i++) {
        const rx = x + Phaser.Math.Between(-20, 20);
        const ry = y + Phaser.Math.Between(-20, 20);
        g.fillCircle(rx, ry, Phaser.Math.Between(3, 7));
      }
      this.time.delayedCall(250, () => g.destroy());
    }
  }

  // MONSTER DEATHS & DROP ENGINE
  private handleMonsterDeath(target: any) {
    target.isDead = true;
    audioManager.playDeath();

    const mobName = target.data.name;
    const expReward = target.data.exp;

    if (bridge) bridge.onLogMessage(`Monstro derrotado: ${mobName}! Ganhou +${expReward} EXP`, '#00ff88');

    // Float EXP text
    this.showDamageText(this.playerSprite.x, this.playerSprite.y - 30, `+${expReward} EXP`, '#00ff88');

    // Award EXP
    this.playerExp += expReward;
    this.checkLevelUp();

    // Spawn Ground Drop
    this.rollDrops(target);

    // Death fade out
    this.tweens.add({
      targets: target.container,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        // Respawn timer
        this.time.delayedCall(target.data.spawnTime || 6000, () => {
          if (this.scene.isActive('GameScene')) {
            target.currentHp = target.data.maxHp;
            target.isDead = false;
            target.container.alpha = 1;
            target.container.list[3].clear(); // reset hp bar
            // respawn at a random near position
            target.tileX = Phaser.Math.Clamp(target.tileX + Phaser.Math.Between(-5, 5), 15, 110);
            target.tileY = Phaser.Math.Clamp(target.tileY + Phaser.Math.Between(-5, 5), 15, 110);
            const screen = tileToScreen(target.tileX, target.tileY, 128);
            target.container.setPosition(screen.x, screen.y);
            target.state = 'idle';
          }
        });
      }
    });
  }

  private rollDrops(target: any) {
    const pool = target.data.dropPool;
    const x = target.container.x;
    const y = target.container.y;
    const tx = target.tileX;
    const ty = target.tileY;

    // 70% chance to drop Zen, 20% item/potion, 10% nothing
    const rand = Math.random();

    if (rand < 0.60) {
      // Drop Zen
      const amt = Phaser.Math.Between(50, 200) * target.data.level;
      this.createGroundDrop('zen', `Zen (${amt})`, x, y, tx, ty, amt);
    } else if (rand < 0.85) {
      // Drop items or potions from its pool
      const key = pool[Math.floor(Math.random() * pool.length)];
      if (key) {
        let label = key.replace('_', ' ').toUpperCase();
        this.createGroundDrop(key, label, x, y, tx, ty);
      }
    }
  }

  private createGroundDrop(key: string, label: string, x: number, y: number, tx: number, ty: number, zenAmt?: number) {
    const container = this.add.container(x, y);

    // Match drop visual key
    let sprKey = 'drop_item';
    if (key === 'zen') sprKey = 'drop_zen';
    else if (key.includes('potion')) sprKey = 'drop_potion_hp';
    else if (key.includes('mana')) sprKey = 'drop_potion_mp';
    else if (key.includes('jewel')) sprKey = 'drop_jewel';

    const sprite = this.add.sprite(0, -6, sprKey);
    container.add(sprite);

    // Bounce tween
    this.tweens.add({
      targets: sprite,
      y: -12,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut'
    });

    // Label on ground
    const text = this.add.text(0, 10, label, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: key.includes('jewel') ? '#e040fb' : key === 'zen' ? '#ffd700' : '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);
    container.add(text);

    // Pickup radius check click handle
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Pick item
      pointer.event.stopPropagation();
      this.pickupLoot(container, key, label, tx, ty, zenAmt);
    });

    this.dropsGroup.add(container);

    // Auto despawn after 45s
    this.time.delayedCall(45000, () => {
      if (container) container.destroy();
    });
  }

  private pickupLoot(container: any, key: string, label: string, tx: number, ty: number, zenAmt?: number) {
    const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY, tx, ty);
    if (dist > 2.5) {
      if (bridge) bridge.onLogMessage('Muito longe para pegar o item!', '#cccccc');
      return;
    }

    audioManager.playItemDrop(); // Play picking chime

    if (key === 'zen' && zenAmt) {
      this.playerZen += zenAmt;
      if (bridge) {
        bridge.onZenPickup(zenAmt);
        bridge.onLogMessage(`Recolheu +${zenAmt} Zen do chao.`, '#ffd700');
      }
    } else {
      // Create actual item model
      const item = createItem(key);
      if (bridge) {
        bridge.onLootPickup(item);
        bridge.onLogMessage(`Pegou item: ${item.name}`, item.isExcellent ? '#aa00ff' : '#00ffff');
      }
    }

    container.destroy();
  }

  // LEVEL UP RULES
  private checkLevelUp() {
    const { EXP_TABLE } = require('../data/items'); // dummy check
    // Formula for levels: level^3 * 10 or lookup map
    // Let's create an elegant scalable formula
    const nextExp = Math.floor(Math.pow(this.playerLevel, 3) * 120 + 200);

    if (this.playerExp >= nextExp) {
      this.playerLevel++;
      this.playerExp -= nextExp;
      this.playerFreePoints += 5; // gain 5 stat points per level up
      this.recalcCombatStats();

      // Refill fully
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      this.ag = this.maxAg;

      audioManager.playLevelUp();

      // Golden aura emitter on player
      const flash = this.add.graphics();
      flash.fillStyle(0xffd700, 0.4);
      flash.fillCircle(this.playerSprite.x, this.playerSprite.y, 80);
      flash.setDepth(3000);
      this.tweens.add({
        targets: flash,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 800,
        onComplete: () => flash.destroy()
      });

      if (bridge) {
        bridge.onLevelUp(this.playerLevel, this.playerFreePoints);
        bridge.onLogMessage(`Parabens! Voce subiu para o Level ${this.playerLevel}! (+5 pontos livres)`, '#ffaa00');
      }

      this.playerSprite.list[1] instanceof Phaser.GameObjects.Text;
      const label = this.playerSprite.list[2] as Phaser.GameObjects.Text;
      if (label && label.setText) {
        label.setText(`${this.playerName} (Lv ${this.playerLevel})`);
      }
    }

    // Sync progress bar
    const nextNextExp = Math.floor(Math.pow(this.playerLevel, 3) * 120 + 200);
    if (bridge) {
      bridge.onExpGain(0, this.playerExp, nextNextExp);
    }
  }

  // FORCE EXECUTING DAMAGE ON SELF (PVP / MONSTER AGGROS)
  public receiveDamage(amount: number) {
    if (this.hp <= 0) return;

    // Defense mitigates damage
    const armorBonus = 0.05; // 5% base
    const finalDef = (this.playerStats.agi / 3) * (1 + armorBonus);
    const reduction = finalDef / (finalDef + 80);
    
    let finalDmg = Math.floor(amount * (1 - reduction));
    finalDmg = Math.max(1, finalDmg);

    this.hp = Math.max(0, this.hp - finalDmg);
    this.showDamageText(this.playerSprite.x, this.playerSprite.y - 12, `-${finalDmg}`, '#ff0000');

    this.syncBridge();

    if (this.hp <= 0) {
      // Trigger death scene
      audioManager.playDeath();
      if (bridge) {
        bridge.onPlayerDeath();
        bridge.onLogMessage('Voce morreu! Clique em reviver na barra de status.', '#ff0000');
      }
    }
  }

  // INVOKED BY REACT CONSUMABLE BUTTONS
  public triggerHealPotion(amount: number) {
    if (this.hp <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.showDamageText(this.playerSprite.x, this.playerSprite.y - 12, `+${amount} HP`, '#00ff44');
    this.syncBridge();
  }

  public triggerManaPotion(amount: number) {
    if (this.hp <= 0) return;
    this.mp = Math.min(this.maxMp, this.mp + amount);
    this.showDamageText(this.playerSprite.x, this.playerSprite.y - 12, `+${amount} MP`, '#3366ff');
    this.syncBridge();
  }

  // PORTAL TELEPORTS
  public changeMap(mapId: 'Lorencia' | 'Dungeon' | 'Devias') {
    this.currentMapId = mapId;
    this.playerX = 64;
    this.playerY = 64;
    this.activePath = [];
    this.currentTargetId = null;
    this.isAutoAttacking = false;

    // Save position state
    if (this.scene) {
      this.scene.restart();
    }
  }

  public respawn() {
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.ag = this.maxAg;
    this.playerX = 64;
    this.playerY = 64;
    this.activePath = [];
    this.currentTargetId = null;
    this.isAutoAttacking = false;
    this.alignPlayerPositionToScreen();
    this.syncBridge();
    this.rebuildVisibleTiles();
  }

  public equipSkill(skillId: string | null) {
    this.skillEquipped = skillId;
  }

  public triggerDirectAttack() {
    // Quick Cast slot 1 / ATK key
    if (this.currentTargetId) {
      this.isAutoAttacking = true;
    } else {
      // Look for closest monster in reach
      let closestId: string | null = null;
      let minDist = 999;
      this.monsterSprites.forEach((m, id) => {
        if (m.isDead) return;
        const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY, m.tileX, m.tileY);
        if (dist < minDist && dist < 4) {
          minDist = dist;
          closestId = id;
        }
      });
      if (closestId) {
        this.currentTargetId = closestId;
        this.isAutoAttacking = true;
      }
    }
  }

  // RENDER DEPTH SORTING
  private depthSortAll() {
    this.entitiesGroup.getChildren().forEach((child: any) => {
      // Calculate depth based on Y height coords inside map projection
      child.setDepth(child.y + 10);
    });

    this.dropsGroup.getChildren().forEach((child: any) => {
      child.setDepth(child.y + 8);
    });
  }
}
