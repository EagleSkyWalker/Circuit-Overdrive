// Game Configuration and Constants
export const CONFIG = {
  // Logical Canvas Resolution
  LOGICAL_WIDTH: 1280,
  LOGICAL_HEIGHT: 720,
  
  GRID: {
    CELL_SIZE: 80,
    COLS: 16,
    ROWS: 9,
  },
  
  STARTING_BITS: 400,
  KERNEL_MAX_HP: 10, // 10 leaks = Game Over
  
  // Grid Paths for Malware (List of coordinate checkpoints)
  // Drawn as clean neon traces
  PATHS: [
    [
      { x: 0, y: 4 },   // Start left
      { x: 4, y: 4 },
      { x: 4, y: 1 },
      { x: 10, y: 1 },
      { x: 10, y: 7 },
      { x: 14, y: 7 },
      { x: 14, y: 4 },
      { x: 15, y: 4 }  // End at Kernel Node center
    ],
    [
      { x: 0, y: 4 },   // Alternative branching path
      { x: 2, y: 4 },
      { x: 2, y: 7 },
      { x: 8, y: 7 },
      { x: 8, y: 4 },
      { x: 12, y: 4 },
      { x: 12, y: 2 },
      { x: 14, y: 2 },
      { x: 14, y: 4 },
      { x: 15, y: 4 }  // End at Kernel Node center
    ]
  ],
  
  // Base Socket
  SOCKET: {
    name: "Interface Pad",
    cost: 20
  },

  // PC Cases (The grid-placed bases)
  CASES: {
    basic: {
      name: "Mini Tower Case",
      cost: 40,
      maxHp: 100,
      maxMbSize: "mini-itx",
      airflow: 8, // passive heat dissipation per second
      width: 60,
      height: 60,
      color: "#2a2e3d",
      glowColor: "rgba(100, 100, 100, 0.3)"
    },
    gaming: {
      name: "ATX Server Tower",
      cost: 80,
      maxHp: 250,
      maxMbSize: "atx",
      airflow: 18,
      width: 66,
      height: 66,
      color: "#12141a",
      glowColor: "#00ffcc"
    }
  },
  
  // Motherboards (determines slots inside Case)
  MOTHERBOARDS: {
    "mini-itx": {
      name: "Mini-ITX Board",
      cost: 45,
      slots: {
        cpu: 1,
        ram: 2,
        gpu: 1,
        psu: 1,
        cooler: 1
      }
    },
    "atx": {
      name: "Full ATX Board",
      cost: 100,
      slots: {
        cpu: 1,
        ram: 4,
        gpu: 3,
        psu: 2,
        cooler: 2
      }
    }
  },
  
  // Hardware Component Configurations
  COMPONENTS: {
    cpu: {
      name: "Core i5 Processor",
      cost: 30,
      damage: 40,  // increased from 25 to 40
      wattage: 20, // wattage draw
      heat: 6,     // heat generated per shot (reduced from 12)
      color: "#ff0055"
    },
    'cpu-extreme': {
      name: "Core i9 Extreme",
      cost: 65,
      damage: 100,
      wattage: 40,
      heat: 14,
      color: "#ff00a0"
    },
    ram: {
      name: "DDR5 Memory Stick",
      cost: 25,
      speedFactor: 0.35, // decreases shot cooldown by 35% per stick
      wattage: 5,
      heat: 1,           // heat generated per shot (reduced from 2)
      color: "#a020f0"
    },
    gpu: {
      name: "RTX Miner Edition",
      cost: 50,
      cryptoRate: 1.0, // generating 1 Qubit per second actively
      range: 120, // range to collect bonus Bits from defeated enemies
      rangeBonusRate: 10, // bonus Bits awarded on nearby malware kills
      wattage: 35,
      heat: 18,
      color: "#ffb700"
    },
    psu: {
      name: "80+ Platinum PSU",
      cost: 40,
      maxPower: 110, // Max wattage it supplies
      heatReduction: 0.35, // Reduces total heat generation of the tower by 35%
      wattage: 0,
      heat: 0,
      color: "#ffffff"
    },
    cooler: {
      name: "Liquid AIO Cooler",
      cost: 35,
      coolingRate: 40, // heat dissipated per second (increased from 25)
      wattage: 10,
      heat: 0,
      color: "#00ffcc"
    }
  },
  
  // Types of Malware (Enemies)
  MALWARE: {
    glitch: {
      name: "Glitch.exe",
      hp: 60, // reduced from 80
      speed: 1.8,
      reward: 12,
      color: "#ff0055",
      size: 14,
      attackPower: 10 // damage to tower if it targets it
    },
    worm: {
      name: "Worm.msi",
      hp: 120, // reduced from 150
      speed: 1.2,
      reward: 20,
      color: "#a020f0",
      size: 18,
      attackPower: 20
    },
    trojan: {
      name: "Trojan.dll",
      hp: 280, // reduced from 350
      speed: 0.8,
      reward: 45,
      color: "#ffb700",
      size: 24,
      attackPower: 35
    }
  }
};
export default CONFIG;

