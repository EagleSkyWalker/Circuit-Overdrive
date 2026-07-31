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
    name: "Grid Anchor",
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
      name: "ATX Case",
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
  
  MOTHERBOARDS: {
    "mini-itx": {
      name: "Mini-ITX Board",
      cost: 45,
      slots: {
        cpu: 1,
        ram: 2,
        gpu: 1,
        psu: 1,
        cooler: 1,
        m2: 1
      }
    },
    "atx": {
      name: "Full ATX Board",
      cost: 100,
      basePowerDraw: 0,
      range: 300,
      slots: {
        cpu: 1,
        ram: 4,
        gpu: 3,
        psu: 2,
        cooler: 2,
        m2: 2
      }
    },
    "ee-atx": {
      name: "EE-ATX Dual-Socket Board",
      cost: 180,
      basePowerDraw: 40, // 40W baseline power draw
      range: 380, // 4.75 Tiles (380px)
      slots: {
        cpu: 2,
        ram: 6,
        gpu: 4,
        psu: 2,
        cooler: 3,
        m2: 2
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
      color: "#ff0055",
      maxTargets: 1
    },
    'cpu-extreme': {
      name: "Core i9 Extreme",
      cost: 65,
      damage: 100,
      wattage: 40,
      heat: 14,
      color: "#ff00a0",
      maxTargets: 1
    },
    'cpu-ryzen5': {
      name: "Ryzen 5 Processor",
      cost: 35,
      damage: 15,
      wattage: 15,
      heat: 6,
      color: "#ff6600",
      maxTargets: 3
    },
    'cpu-ryzen9': {
      name: "Ryzen 9 3D-Cache",
      cost: 70,
      damage: 35,
      wattage: 30,
      heat: 10,
      color: "#ff9900",
      maxTargets: 5
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
      wattage: 15,
      heat: 5,
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
    },
    ssd: {
      name: "M.2 NVMe SSD",
      cost: 30,
      wattage: 10,
      heat: 2,
      color: "#00aaff",
      chiaRate: 3.0 // 3.0 Chia/sec
    },
    'pcie-m2': {
      name: "PCIE M.2 Adapter",
      cost: 25,
      wattage: 5,
      heat: 1,
      color: "#ff8800",
      m2Extra: 4 // Adds 4 extra M.2 slots
    }
  },
  
  // Types of Malware (Enemies)
  MALWARE: {
    swarm: {
      name: "DDoS.Swarm",
      hp: 15,
      speed: 3.2,
      reward: 2,
      color: "#00e5ff",
      size: 8,
      attackPower: 5
    },
    glitch: {
      name: "Glitch.exe",
      hp: 60, // reduced from 80
      speed: 1.8,
      reward: 8, // reduced from 12
      color: "#ff0055",
      size: 14,
      attackPower: 10 // damage to tower if it targets it
    },
    worm: {
      name: "Worm.msi",
      hp: 120, // reduced from 150
      speed: 1.2,
      reward: 15, // reduced from 20
      color: "#a020f0",
      size: 18,
      attackPower: 20
    },
    trojan: {
      name: "Trojan.dll",
      hp: 280, // reduced from 350
      speed: 0.8,
      reward: 32, // reduced from 45
      color: "#ffb700",
      size: 24,
      attackPower: 35
    },
    boss: {
      name: "Ransomware.Titan",
      hp: 1750, // increased by +250 HP from 1500
      speed: 0.5,
      reward: 150,
      color: "#ff0044",
      size: 42,
      attackPower: 50,
      shedThreshold: 50 // Sheds 1 swarm unit every 50 HP lost
    }
  }
};
export default CONFIG;

