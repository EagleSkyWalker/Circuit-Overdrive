import CONFIG from './config.js';
import { PcTower } from './entities.js';

export const LEVELS = {
  1: {
    id: 1,
    name: "Sector 1: System Boot",
    desc: "Run a basic diagnostics sweep on a fresh sector of the circuit board.",
    startingBits: 150,
    waves: 1,
    waveSetup: (waveNum) => {
      // 1 wave of 4 glitches
      return ['glitch', 'glitch', 'glitch', 'glitch'];
    },
    unlockedParts: ['socket', 'case-basic', 'mb-mini', 'cpu'],
    isTutorial: true
  },
  2: {
    id: 2,
    name: "Sector 2: Crypto Exchange",
    desc: "Peaceful sandbox. Construct mining rigs to mine Hashes and Chia, and trade on the stock market to reach 450 QB.",
    startingBits: 350,
    waves: 0,
    waveSetup: (waveNum) => [],
    unlockedParts: ['socket', 'case-basic', 'mb-mini', 'gpu', 'ssd', 'pcie-m2'],
    isTutorial: true,
    targetHashes: 100,
    targetChia: 200,
    targetQB: 450,
    paths: [
      [
        { x: 0, y: 4 },
        { x: 15, y: 4 }
      ]
    ],
    uniqueTraces: [
      [
        { x: 0, y: 4 },
        { x: 15, y: 4 }
      ]
    ]
  },
  3: {
    id: 3,
    name: "Sector 3: Liquid Core",
    desc: "Fight heavy Trojan malware using Core i9 Extreme CPUs. Build liquid cooling loops to stop thermal throttling.",
    startingBits: 600,
    waves: 1,
    waveSetup: (waveNum) => {
      // Slightly enlarged wave containing glitches, worms, and trojans
      return ['glitch', 'glitch', 'glitch', 'glitch', 'worm', 'worm', 'worm', 'trojan', 'trojan'].sort(() => Math.random() - 0.5);
    },
    unlockedParts: ['socket', 'case-basic', 'mb-mini', 'cpu', 'ram', 'cooler', 'repair'],
    isTutorial: true,
    paths: [
      [
        { x: 0, y: 4 },
        { x: 3, y: 4 },
        { x: 3, y: 7 },
        { x: 6, y: 7 },
        { x: 6, y: 1 },
        { x: 11, y: 1 },
        { x: 11, y: 6 },
        { x: 14, y: 6 },
        { x: 14, y: 4 },
        { x: 15, y: 4 }
      ]
    ],
    uniqueTraces: [
      [
        { x: 0, y: 4 },
        { x: 3, y: 4 },
        { x: 3, y: 7 },
        { x: 6, y: 7 },
        { x: 6, y: 1 },
        { x: 11, y: 1 },
        { x: 11, y: 6 },
        { x: 14, y: 6 },
        { x: 14, y: 4 },
        { x: 15, y: 4 }
      ]
    ],
    onInit: (game) => {
      // Spawn pre-existing broken, overheated server tower at coordinate [8, 3]
      const tower = new PcTower(8, 3);
      tower.installCase('basic');
      tower.installMotherboard('mini-itx');
      tower.installComponent('cpu');
      tower.installComponent('ram');
      
      // Make it broken and overheated
      tower.status = 'broken';
      tower.hp = 0;
      tower.heat = 98.5;
      
      game.towers.push(tower);
    }
  },
  4: {
    id: 4,
    name: "Sector 4: Power Distribution",
    desc: "Address power limits by installing PSUs. Restore an overloaded firewall server and build another high-draw Core i9 machine.",
    startingBits: 275,
    waves: 3,
    waveSetup: (waveNum) => {
      const queue = [];
      if (waveNum === 1) {
        // Wave 1 (Easy reconnaissance): 4 Glitches, 2 Worms (480 total HP)
        for (let i = 0; i < 4; i++) queue.push('glitch');
        for (let i = 0; i < 2; i++) queue.push('worm');
      } else if (waveNum === 2) {
        // Wave 2 (Moderate push): 6 Glitches, 4 Worms, 1 Trojan (1120 total HP)
        for (let i = 0; i < 6; i++) queue.push('glitch');
        for (let i = 0; i < 4; i++) queue.push('worm');
        for (let i = 0; i < 1; i++) queue.push('trojan');
      } else {
        // Wave 3 (Final heavy assault calibrated for 2x i9 + 2x RAM rigs): 8 Glitches, 8 Worms, 6 Trojans (3120 total HP)
        for (let i = 0; i < 8; i++) queue.push('glitch');
        for (let i = 0; i < 8; i++) queue.push('worm');
        for (let i = 0; i < 6; i++) queue.push('trojan');
      }
      return queue.sort(() => Math.random() - 0.5);
    },
    unlockedParts: ['socket', 'case-basic', 'mb-mini', 'cpu', 'cpu-extreme', 'ram', 'psu', 'cooler', 'repair'],
    isTutorial: true,
    paths: [
      [
        { x: 0, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 3 },
        { x: 13, y: 3 },
        { x: 13, y: 4 },
        { x: 15, y: 4 }
      ],
      [
        { x: 0, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 5 },
        { x: 13, y: 5 },
        { x: 13, y: 4 },
        { x: 15, y: 4 }
      ]
    ],
    uniqueTraces: [
      [
        { x: 0, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 3 },
        { x: 13, y: 3 },
        { x: 13, y: 4 },
        { x: 15, y: 4 }
      ],
      [
        { x: 2, y: 4 },
        { x: 2, y: 5 },
        { x: 13, y: 5 },
        { x: 13, y: 4 }
      ]
    ],
    onInit: (game) => {
      // Spawn overloaded tower at coordinate [7, 4]
      const tower = new PcTower(7, 4);
      tower.installCase('basic');
      tower.installMotherboard('mini-itx');
      tower.installComponent('cpu-extreme'); // i9: 40W
      tower.installComponent('ram'); // RAM 1: 5W
      tower.installComponent('ram'); // RAM 2: 5W
      tower.installComponent('cooler'); // Cooler: 10W
      // Total draw = 60W. Mini-ITX capacity = 40W.
      tower.status = 'broken';
      tower.hp = 0;
      tower.heat = 45.0;
      game.towers.push(tower);
    }
  },
  5: {
    id: 5,
    name: "Sector 5: CPU Faction Architecture",
    desc: "Learn the operational split between Intel single-target burst and AMD Ryzen multi-threaded split-ray laser cores.",
    startingBits: 400,
    waves: 3,
    unlockedParts: ['socket', 'case-basic', 'mb-mini', 'cpu', 'cpu-ryzen5', 'ram', 'psu', 'cooler', 'repair'],
    isTutorial: true,
    paths: [
      [
        { x: 0, y: 1 },
        { x: 13, y: 1 },
        { x: 13, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 5 },
        { x: 13, y: 5 },
        { x: 13, y: 7 },
        { x: 15, y: 7 },
        { x: 15, y: 4 }
      ]
    ],
    uniqueTraces: [
      [
        { x: 0, y: 1 },
        { x: 13, y: 1 },
        { x: 13, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 5 },
        { x: 13, y: 5 },
        { x: 13, y: 7 },
        { x: 15, y: 7 },
        { x: 15, y: 4 }
      ]
    ],
    waveSetup: (waveNum) => {
      const queue = [];
      if (waveNum === 1) {
        // Wave 1: DDoS Swarm introduction (15 swarms)
        for (let i = 0; i < 15; i++) queue.push('swarm');
        return queue;
      } else if (waveNum === 2) {
        // Wave 2: Heavy armor push (4 Trojans + 4 Worms)
        for (let i = 0; i < 4; i++) queue.push('worm');
        for (let i = 0; i < 4; i++) queue.push('trojan');
        return queue.sort(() => Math.random() - 0.5);
      } else {
        // Wave 3: Combined Assault (19 Swarms + 4 Worms + 3 Trojans)
        for (let i = 0; i < 19; i++) queue.push('swarm');
        for (let i = 0; i < 4; i++) queue.push('worm');
        for (let i = 0; i < 3; i++) queue.push('trojan');
        return queue.sort(() => Math.random() - 0.5);
      }
    }
  },
  6: {
    id: 6,
    name: "Sector 6: Enterprise Core Breach",
    desc: "Master ATX Mega-Rigs, EE-ATX Dual-Socket boards, and AMD Ryzen multi-threading against the Ransomware.Titan Boss.",
    startingBits: 500,
    waves: 4,
    unlockedParts: ['socket', 'case-basic', 'case-gaming', 'mb-mini', 'mb-atx', 'mb-eeatx', 'cpu', 'cpu-extreme', 'cpu-ryzen5', 'cpu-ryzen9', 'ram', 'psu', 'cooler', 'repair', 'gpu', 'ssd', 'pcie-m2'],
    isTutorial: true,
    paths: [
      [
        { x: 0, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 1 },
        { x: 6, y: 1 },
        { x: 6, y: 3 },
        { x: 10, y: 3 },
        { x: 10, y: 1 },
        { x: 13, y: 1 },
        { x: 13, y: 4 },
        { x: 15, y: 4 }
      ],
      [
        { x: 0, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 7 },
        { x: 6, y: 7 },
        { x: 6, y: 5 },
        { x: 10, y: 5 },
        { x: 10, y: 7 },
        { x: 13, y: 7 },
        { x: 13, y: 4 },
        { x: 15, y: 4 }
      ]
    ],
    uniqueTraces: [
      [
        { x: 0, y: 4 },
        { x: 2, y: 4 }
      ],
      [
        { x: 2, y: 4 },
        { x: 2, y: 1 },
        { x: 6, y: 1 },
        { x: 6, y: 3 },
        { x: 10, y: 3 },
        { x: 10, y: 1 },
        { x: 13, y: 1 },
        { x: 13, y: 4 }
      ],
      [
        { x: 2, y: 4 },
        { x: 2, y: 7 },
        { x: 6, y: 7 },
        { x: 6, y: 5 },
        { x: 10, y: 5 },
        { x: 10, y: 7 },
        { x: 13, y: 7 },
        { x: 13, y: 4 }
      ],
      [
        { x: 13, y: 4 },
        { x: 15, y: 4 }
      ]
    ],
    waveSetup: (waveNum) => {
      const queue = [];
      if (waveNum === 1) {
        // Wave 1: DDoS Swarm introduction (10 swarms + 4 glitches)
        for (let i = 0; i < 10; i++) queue.push('swarm');
        for (let i = 0; i < 4; i++) queue.push('glitch');
        return queue.sort(() => Math.random() - 0.5);
      } else if (waveNum === 2) {
        // Wave 2: Heavy Rogue processes (Single-target Intel burst required)
        for (let i = 0; i < 4; i++) queue.push('worm');
        for (let i = 0; i < 3; i++) queue.push('trojan');
        return queue.sort(() => Math.random() - 0.5);
      } else if (waveNum === 3) {
        // Wave 3: Combined Assault (27 Swarms + 6 Worms + 3 Trojans)
        for (let i = 0; i < 27; i++) queue.push('swarm');
        for (let i = 0; i < 6; i++) queue.push('worm');
        for (let i = 0; i < 3; i++) queue.push('trojan');
        return queue.sort(() => Math.random() - 0.5);
      } else {
        // Wave 4: Core Breach Ultra-Assault!
        // Step 1: Initial rapid burst of 45 DDoS Swarms + 8 Glitches (~4 sec)
        for (let i = 0; i < 45; i++) queue.push('swarm');
        for (let i = 0; i < 8; i++) queue.push('glitch');

        // Step 2: Doubled Heavy Armor Push + Constant Glitch Stream (12 Worms + 8 Trojans + 8 Glitches)
        for (let i = 0; i < 12; i++) queue.push('worm');
        for (let i = 0; i < 8; i++) queue.push('trojan');
        for (let i = 0; i < 8; i++) queue.push('glitch');

        // Step 3: Dramatic 1.8s pause marker before final surge
        queue.push('pause');

        // Step 4: Massive Surprise Tsunami: 80 DDoS Swarms + 8 Constant Glitches + Ransomware.Titan BOSS!
        for (let i = 0; i < 80; i++) queue.push('swarm');
        for (let i = 0; i < 8; i++) queue.push('glitch');
        queue.push('boss'); // Climax encounter!
        return queue; // Preserving sequence for scripted ambush!
      }
    }
  }
};

export class LevelManager {
  constructor() {
    this.currentLevelId = 1;
    this.loadProgress();
  }

  loadProgress() {
    const saved = localStorage.getItem('circuit_overdrive_unlocked_level');
    this.unlockedLevel = saved ? parseInt(saved, 10) : 1;
  }

  saveProgress(levelId) {
    if (levelId > this.unlockedLevel) {
      this.unlockedLevel = levelId;
      localStorage.setItem('circuit_overdrive_unlocked_level', levelId);
    }
  }

  getLevel(id) {
    return LEVELS[id] || LEVELS[1];
  }

  isUnlocked(id) {
    return id <= this.unlockedLevel;
  }
}
export default LevelManager;
