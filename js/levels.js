import CONFIG from './config.js';

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
    name: "Sector 2: Power Grid",
    desc: "Balance the power regulator grid. Mine cryptocurrency using GPUs and avoid wattage overloads with PSUs.",
    startingBits: 350,
    waves: 3,
    waveSetup: (waveNum) => {
      const queue = [];
      const glitches = 6 + waveNum * 2;
      const worms = waveNum > 1 ? 2 + waveNum : 0;
      for (let i = 0; i < glitches; i++) queue.push('glitch');
      for (let i = 0; i < worms; i++) queue.push('worm');
      return queue.sort(() => Math.random() - 0.5);
    },
    unlockedParts: ['socket', 'case-basic', 'case-gaming', 'mb-mini', 'mb-atx', 'cpu', 'ram', 'gpu', 'psu']
  },
  3: {
    id: 3,
    name: "Sector 3: Liquid Core",
    desc: "Fight heavy Trojan malware using Core i9 Extreme CPUs. Build liquid cooling loops to stop thermal throttling.",
    startingBits: 600,
    waves: 4,
    waveSetup: (waveNum) => {
      const queue = [];
      const glitches = 4 + waveNum;
      const worms = 3 + waveNum * 2;
      const trojans = waveNum > 1 ? waveNum - 1 : 0;
      for (let i = 0; i < glitches; i++) queue.push('glitch');
      for (let i = 0; i < worms; i++) queue.push('worm');
      for (let i = 0; i < trojans; i++) queue.push('trojan');
      return queue.sort(() => Math.random() - 0.5);
    },
    unlockedParts: ['socket', 'case-basic', 'case-gaming', 'mb-mini', 'mb-atx', 'cpu', 'cpu-extreme', 'ram', 'gpu', 'psu', 'cooler', 'repair']
  },
  4: {
    id: 4,
    name: "Sector 4: Endless Compiler",
    desc: "Defend against scaling waves of malware on a dynamic circuit grid.",
    startingBits: 400,
    waves: Infinity,
    waveSetup: (waveNum) => {
      const queue = [];
      const glitches = 5 + waveNum * 2;
      const worms = waveNum > 2 ? 3 + waveNum : 0;
      const trojans = waveNum > 5 ? Math.floor(waveNum / 2) : 0;
      for (let i = 0; i < glitches; i++) queue.push('glitch');
      for (let i = 0; i < worms; i++) queue.push('worm');
      for (let i = 0; i < trojans; i++) queue.push('trojan');
      return queue.sort(() => Math.random() - 0.5);
    },
    unlockedParts: ['socket', 'case-basic', 'case-gaming', 'mb-mini', 'mb-atx', 'cpu', 'cpu-extreme', 'ram', 'gpu', 'psu', 'cooler', 'repair']
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
