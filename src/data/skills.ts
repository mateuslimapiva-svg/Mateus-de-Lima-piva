/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Skill } from '../types';

export const SKILLS: { [key: string]: Skill } = {
  // DARK KNIGHT
  twisting_slash: {
    id: 'twisting_slash',
    name: 'Twisting Slash',
    levelReq: 9,
    mpCost: 10,
    agCost: 10,
    damagePercent: 180,
    cooldown: 500,
    description: 'Ataque circular que desfere golpes devastadores em inimigos proximos.',
    effectType: 'aoe',
    range: 2,
    color: '#eaeaea',
  },
  rageful_blow: {
    id: 'rageful_blow',
    name: 'Rageful Blow',
    levelReq: 20,
    mpCost: 15,
    agCost: 20,
    damagePercent: 300,
    cooldown: 3000,
    description: 'Golpeia o solo criando uma enorme explosao que atordoa os inimigos.',
    effectType: 'aoe',
    range: 3,
    color: '#ff6600',
  },
  death_stab: {
    id: 'death_stab',
    name: 'Death Stab',
    levelReq: 50,
    mpCost: 20,
    agCost: 30,
    damagePercent: 400,
    cooldown: 1200,
    description: 'Um golpe perfurante de altissima velocidade que trespassa o alvo.',
    effectType: 'melee',
    range: 2,
    color: '#ff0033',
  },
  blood_attack: {
    id: 'blood_attack',
    name: 'Blood Attack',
    levelReq: 70,
    mpCost: 25,
    agCost: 25,
    damagePercent: 250,
    cooldown: 2000,
    description: 'Ataque de drenagem sanguinea que cura o jogador em 30% do dano causado.',
    effectType: 'melee',
    range: 1.5,
    color: '#990000',
  },

  // DARK WIZARD
  poison: {
    id: 'poison',
    name: 'Poison',
    levelReq: 1,
    mpCost: 8,
    agCost: 0,
    damagePercent: 80,
    cooldown: 800,
    description: 'Lanca uma nuvem venenosa que causa dano continuo ao longo de 3 segundos.',
    effectType: 'projectile',
    range: 5,
    color: '#00cc33',
  },
  meteorite: {
    id: 'meteorite',
    name: 'Meteorite',
    levelReq: 3,
    mpCost: 10,
    agCost: 0,
    damagePercent: 180,
    cooldown: 1000,
    description: 'Evoca um meteoro flamejante dos ceus em direcao ao inimigo.',
    effectType: 'projectile',
    range: 6,
    color: '#ffaa00',
  },
  ice_arrow: {
    id: 'ice_arrow',
    name: 'Ice Arrow',
    levelReq: 9,
    mpCost: 12,
    agCost: 0,
    damagePercent: 120,
    cooldown: 1500,
    description: 'Dispara uma seta de gelo que desacelera o movimento do monstro em 50% por 2s.',
    effectType: 'projectile',
    range: 6,
    color: '#00ccff',
  },
  thunder_ball: {
    id: 'thunder_ball',
    name: 'Thunder Ball',
    levelReq: 20,
    mpCost: 20,
    agCost: 0,
    damagePercent: 220,
    cooldown: 1200,
    description: 'Dispara uma esfera eletrica que explode causando dano em area.',
    effectType: 'projectile',
    range: 5,
    color: '#6600ff',
  },
  flame_ball: {
    id: 'flame_ball',
    name: 'Flame Ball',
    levelReq: 35,
    mpCost: 25,
    agCost: 0,
    damagePercent: 280,
    cooldown: 2000,
    description: 'Dispara uma poderosa bola de fogo de grande alcance e impacto.',
    effectType: 'projectile',
    range: 6,
    color: '#ff3300',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    levelReq: 50,
    mpCost: 40,
    agCost: 0,
    damagePercent: 400,
    cooldown: 5000,
    description: 'Gera uma enorme explosao cosmica centrada no mago destruindo tudo ao redor.',
    effectType: 'aoe',
    range: 4,
    color: '#9933ff',
  },
  evil_spirit: {
    id: 'evil_spirit',
    name: 'Evil Spirit',
    levelReq: 65,
    mpCost: 35,
    agCost: 0,
    damagePercent: 350,
    cooldown: 800,
    description: 'Invoca espiritos sombrios que atacam repetidamente multiplos alvos da tela.',
    effectType: 'aoe',
    range: 6,
    color: '#aa88ff',
  },
  soul_barrier: {
    id: 'soul_barrier',
    name: 'Soul Barrier',
    levelReq: 80,
    mpCost: 50,
    agCost: 0,
    damagePercent: 0,
    cooldown: 10000,
    description: 'Cria um escudo espiritual que reduz todo dano recebido em 30% por 10 segundos.',
    effectType: 'buff',
    effectValue: 30, // percent absorb
    color: '#00aacc',
  },

  // ELF
  triple_arrow: {
    id: 'triple_arrow',
    name: 'Triple Arrow',
    levelReq: 1,
    mpCost: 5,
    agCost: 5,
    damagePercent: 90, // each arrow
    cooldown: 400,
    description: 'Dispara 3 flechas simultaneas em leque contra o inimigo.',
    effectType: 'projectile',
    range: 6,
    color: '#ccff33',
  },
  penetration_arrow: {
    id: 'penetration_arrow',
    name: 'Penetration Arrow',
    levelReq: 9,
    mpCost: 8,
    agCost: 8,
    damagePercent: 140,
    cooldown: 800,
    description: 'Uma flecha super-carregada que atravessa multiplos inimigos em linha reta.',
    effectType: 'projectile',
    range: 7,
    color: '#00ffaa',
  },
  multi_shot: {
    id: 'multi_shot',
    name: 'Multi-Shot',
    levelReq: 20,
    mpCost: 15,
    agCost: 15,
    damagePercent: 80,
    cooldown: 1000,
    description: 'Lanca uma saraivada de 5 flechas que acertam alvos aleatorios no campo.',
    effectType: 'aoe',
    range: 5,
    color: '#ffff33',
  },
  elf_buff: {
    id: 'elf_buff',
    name: 'Atk/Def Buff',
    levelReq: 35,
    mpCost: 20,
    agCost: 0,
    damagePercent: 0,
    cooldown: 8000,
    description: 'Bencao das fadas que aumenta o Ataque e Defesa em 15% por 15 segundos.',
    effectType: 'buff',
    effectValue: 15,
    color: '#ff66cc',
  },
  hp_regen_buff: {
    id: 'hp_regen_buff',
    name: 'Regen Buff',
    levelReq: 50,
    mpCost: 30,
    agCost: 0,
    damagePercent: 0,
    cooldown: 12000,
    description: 'Regenera 5% HP a cada 3 segundos por 30s.',
    effectType: 'regen',
    effectValue: 5,
    color: '#33ff66',
  },
  plasma_arrow: {
    id: 'plasma_arrow',
    name: 'Plasma Arrow',
    levelReq: 75,
    mpCost: 25,
    agCost: 25,
    damagePercent: 180,
    cooldown: 2000,
    description: 'Dispara um projetil plasmatico de pura energia que ignora a defesa do alvo.',
    effectType: 'projectile',
    range: 6,
    color: '#ff33ff',
  },

  // MAGIC GLADIATOR
  flame_slash: {
    id: 'flame_slash',
    name: 'Flame Slash',
    levelReq: 20,
    mpCost: 10,
    agCost: 18,
    damagePercent: 250,
    cooldown: 600,
    description: 'Corta o ar criando ondas de chamas que dilaceram o alvo.',
    effectType: 'melee',
    range: 2,
    color: '#ff3300',
  },
  gigantic_storm: {
    id: 'gigantic_storm',
    name: 'Gigantic Storm',
    levelReq: 40,
    mpCost: 20,
    agCost: 35,
    damagePercent: 350,
    cooldown: 1500,
    description: 'Invoca uma tempestade de tornados gigantes que eletrocutam e esmagam em area.',
    effectType: 'aoe',
    range: 5,
    color: '#33ccff',
  },
  electric_spark: {
    id: 'electric_spark',
    name: 'Electric Spark',
    levelReq: 70,
    mpCost: 30,
    agCost: 45,
    damagePercent: 420,
    cooldown: 3000,
    description: 'Dispara um raio devastador em linha reta capaz de obliterar hordas.',
    effectType: 'projectile',
    range: 7,
    color: '#ffff99',
  },
};

/**
 * Returns available skills for a given class.
 */
export function getSkillsForClass(cls: string): Skill[] {
  const result: Skill[] = [];
  Object.values(SKILLS).forEach(s => {
    if (cls === 'DK') {
      if (s.id === 'twisting_slash' || s.id === 'rageful_blow' || s.id === 'death_stab' || s.id === 'blood_attack') {
        result.push(s);
      }
    } else if (cls === 'DW') {
      if (s.id === 'poison' || s.id === 'meteorite' || s.id === 'ice_arrow' || s.id === 'thunder_ball' || s.id === 'flame_ball' || s.id === 'nova' || s.id === 'evil_spirit' || s.id === 'soul_barrier') {
        result.push(s);
      }
    } else if (cls === 'ELF') {
      if (s.id === 'triple_arrow' || s.id === 'penetration_arrow' || s.id === 'multi_shot' || s.id === 'elf_buff' || s.id === 'hp_regen_buff' || s.id === 'plasma_arrow') {
        result.push(s);
      }
    } else if (cls === 'MG') {
      // inherits Twisting Slash plus MG-exclusive skills
      if (s.id === 'twisting_slash' || s.id === 'flame_slash' || s.id === 'gigantic_storm' || s.id === 'electric_spark') {
        result.push(s);
      }
    }
  });
  return result.sort((a, b) => a.levelReq - b.levelReq);
}
