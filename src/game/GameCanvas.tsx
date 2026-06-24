/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { BootScene, GameScene, setGameBridge, GameBridge } from './PhaserGame';
import { CharacterClass, Item } from '../types';
import { Shield, Sparkles, MessageSquare, Swords } from 'lucide-react';

interface GameCanvasProps {
  characterData: any;
  onBridgeInit: (gameInstance: Phaser.Game | null, gameSceneInstance: GameScene | null) => void;
  bridgeCallbacks: GameBridge;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  characterData,
  onBridgeInit,
  bridgeCallbacks,
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const phaserContainerId = 'mu-phaser-container';

  // Joystick state
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickStartRef = useRef({ x: 0, y: 0 });
  const joystickIntervalRef = useRef<any>(null);
  const currentAngleRef = useRef<number>(0);

  useEffect(() => {
    // Setup bridge callbacks
    setGameBridge(bridgeCallbacks);

    // Phaser 3 configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: '100%',
      height: '100%',
      parent: phaserContainerId,
      pixelArt: true,
      antialias: false,
      audio: {
        noAudio: true,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scene: [BootScene, GameScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Wait until GameScene is booted and loaded to pass references
    const checkTimer = setInterval(() => {
      if (game.scene && game.scene.isActive('GameScene')) {
        const gameScene = game.scene.getScene('GameScene') as GameScene;
        // Pass data to scene if present
        if (characterData) {
          gameScene.init({ character: characterData });
        }
        onBridgeInit(game, gameScene);
        clearInterval(checkTimer);
      }
    }, 100);

    return () => {
      clearInterval(checkTimer);
      if (joystickIntervalRef.current) clearInterval(joystickIntervalRef.current);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      onBridgeInit(null, null);
    };
  }, [characterData]);

  // Touch handlers for Virtual Joystick
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    joystickStartRef.current = { x: touch.clientX, y: touch.clientY };
    setJoystickActive(true);
    setJoystickPos({ x: 0, y: 0 });

    if (joystickIntervalRef.current) clearInterval(joystickIntervalRef.current);

    // Continuous input streaming loop
    joystickIntervalRef.current = setInterval(() => {
      const scene = gameRef.current?.scene.getScene('GameScene') as GameScene;
      if (scene && scene.handleJoystickInput) {
        scene.handleJoystickInput(currentAngleRef.current);
      }
    }, 16); // 60 FPS tick
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickStartRef.current.x;
    const dy = touch.clientY - joystickStartRef.current.y;
    
    // Distance calculation
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 50; // Max visual slider limit

    let moveX = dx;
    let moveY = dy;

    if (distance > maxRadius) {
      moveX = (dx / distance) * maxRadius;
      moveY = (dy / distance) * maxRadius;
    }

    setJoystickPos({ x: moveX, y: moveY });
    currentAngleRef.current = Math.atan2(moveY, moveX);
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    if (joystickIntervalRef.current) {
      clearInterval(joystickIntervalRef.current);
      joystickIntervalRef.current = null;
    }
  };

  return (
    <div className="relative w-full h-[50vh] md:h-[60vh] bg-black border-b border-amber-500/20 rounded-t-xl overflow-hidden shadow-inner">
      {/* Target Container for Phaser 3 */}
      <div id={phaserContainerId} className="w-full h-full" />

      {/* Embedded Mobile Virtual Joystick */}
      <div 
        className="absolute bottom-6 left-6 z-10 select-none touch-none pointer-events-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="relative w-28 h-28 rounded-full border border-zinc-500/30 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center shadow-lg"
          style={{ touchAction: 'none' }}
        >
          {/* Outer ring guidance ticks */}
          <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-zinc-600/40" />
          <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-zinc-600/40" />
          <div className="absolute left-1 w-1.5 h-1.5 rounded-full bg-zinc-600/40" />
          <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-zinc-600/40" />

          {/* Draggable thumb */}
          <div 
            className="w-12 h-12 rounded-full border-2 border-amber-400 bg-gradient-to-br from-amber-600 to-amber-900 shadow-lg flex items-center justify-center transition-all duration-75 active:scale-95"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              boxShadow: joystickActive ? '0 0 12px rgba(245, 158, 11, 0.6)' : 'none',
            }}
          >
            <div className="w-4 h-4 rounded-full bg-amber-200 opacity-60" />
          </div>
        </div>
      </div>

      {/* Floating Tutorial Message on Load */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none bg-black/70 backdrop-blur-sm border border-amber-500/30 rounded-lg px-3 py-1.5 max-w-[200px] text-[10px] text-zinc-300">
        <p className="flex items-center gap-1 font-semibold text-amber-400">
          <Swords size={12} /> CONTROLES:
        </p>
        <ul className="list-disc pl-3 mt-1 space-y-0.5">
          <li>Arraste o analógico para andar</li>
          <li>Toque no monstro para travar mira</li>
          <li>Toque no chão para caminhar</li>
        </ul>
      </div>
    </div>
  );
};
