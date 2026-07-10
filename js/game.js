import CONFIG from './config.js';
import { PcTower, MalwareEnemy, LaserProjectile } from './entities.js';
import GameRenderer from './canvas.js';
import InputHandler from './input.js';
import LevelManager from './levels.js';
import SYSOPHandler from './sysop.js';
import TutorialController from './tutorial.js';

class GameController {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('game-container');
    
    // Core engine systems
    this.renderer = new GameRenderer(this.canvas);
    this.input = new InputHandler(
      this.canvas, 
      this.renderer,
      (col, row) => this.handleCellClick(col, row),
      (cell) => this.handleCellHover(cell)
    );
    
    // Modular progression and tutorial handlers
    this.levelManager = new LevelManager();
    this.sysop = new SYSOPHandler();
    this.tutorial = null; // initialized per level if tutorial
    this.currentLevel = null;
    
    // Game state variables
    this.bits = CONFIG.STARTING_BITS;
    this.kernelHp = CONFIG.KERNEL_MAX_HP;
    this.kernelMaxHp = CONFIG.KERNEL_MAX_HP;
    
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.gpuMiningTimer = 0;
    this.notifTimeout = null;
    this.waveRestTimer = 0;
    
    this.waveNumber = 0;
    this.waveActive = false;
    
    this.selectedTower = null;
    this.lastSelectedTowerStatus = null;
    this.hardwareExpanded = false; // default collapsed
    this.hoverCell = null;
    this.activeBuildCell = null;
    
    // Hotbar UI mode state
    this.uiMode = 'BUY'; // 'BUY' or 'BUILD'
    this.selectedBuildItem = null; // selected hotbar slot name to build
    this.inventory = {
      socket: 0,
      'case-basic': 0,
      'case-gaming': 0,
      'mb-mini': 0,
      'mb-atx': 0,
      cpu: 0,
      'cpu-extreme': 0,
      ram: 0,
      gpu: 0,
      psu: 0,
      cooler: 0,
      repair: 0
    };

    // Wave spawn tracking
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 800; // ms between spawns
    
    // Loop timing
    this.lastTime = 0;
    this.gameActive = false;
    
    // Bind UI elements
    this.setupUI();
    
    // Initial resize to fit screen
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    
    // Start drawing a static board on load
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupUI() {
    // Menu buttons
    document.getElementById('btn-start').addEventListener('click', () => this.showLevelSelect());
    document.getElementById('btn-back-menu').addEventListener('click', () => this.showMainMenu());
    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      if (confirm("Are you sure you want to format BIOS partition records? This will delete all completed Sector history and re-lock advanced Sectors!")) {
        localStorage.removeItem('circuit_overdrive_unlocked_level');
        this.levelManager.unlockedLevel = 1;
        this.updateLevelSelectUI();
      }
    });
    document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-next-wave').addEventListener('click', () => this.startNextWave());
    document.getElementById('btn-close-monitor').addEventListener('click', () => this.deselectTower());
    document.getElementById('btn-toggle-hardware').addEventListener('click', () => this.toggleHardwareExpanded());
    
    // Level selection cards click handlers
    document.querySelectorAll('.level-card').forEach(card => {
      const levelId = parseInt(card.getAttribute('data-level'), 10);
      card.addEventListener('click', () => {
        if (this.levelManager.isUnlocked(levelId)) {
          this.startLevel(levelId);
        }
      });
    });

    // Victory popup button bindings
    document.getElementById('btn-victory-continue').addEventListener('click', () => this.continueToNextLevel());
    document.getElementById('btn-victory-select').addEventListener('click', () => this.returnToLevelSelect());

    // Buy/Build Mode Toggle
    document.getElementById('btn-mode-toggle').addEventListener('click', () => this.toggleUIMode());

    // Hotbar clicks and hover events for tooltips
    document.querySelectorAll('.hotbar-slot').forEach(slotBtn => {
      const slotName = slotBtn.getAttribute('data-slot');
      
      slotBtn.addEventListener('click', (e) => {
        this.handleHotbarClick(slotName);
        this.showSlotTooltip(slotName); // update description on click (for mobile tap)
      });

      slotBtn.addEventListener('mouseenter', () => {
        this.showSlotTooltip(slotName);
      });

      slotBtn.addEventListener('mouseleave', () => {
        this.clearSlotTooltip();
      });
    });
  }

  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.resize(w, h);
  }

  showLevelSelect() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('level-select').classList.remove('hidden');
    document.getElementById('level-victory').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    this.updateLevelSelectUI();
  }

  showMainMenu() {
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('level-select').classList.add('hidden');
  }

  updateLevelSelectUI() {
    this.levelManager.loadProgress(); // reload progress
    
    for (let id = 1; id <= 4; id++) {
      const card = document.querySelector(`.level-card[data-level="${id}"]`);
      if (!card) continue;
      
      const statusIcon = document.getElementById(`status-level-${id}`);
      
      if (this.levelManager.isUnlocked(id)) {
        card.className = "level-card unlocked";
        if (statusIcon) {
          statusIcon.innerText = id < this.levelManager.unlockedLevel ? "✓" : "▶";
        }
      } else {
        card.className = "level-card locked";
        if (statusIcon) {
          statusIcon.innerText = "🔒";
        }
      }
    }
  }

  startLevel(levelId) {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('level-select').classList.add('hidden');
    document.getElementById('level-victory').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('bottom-bar').classList.remove('hidden');
    
    const lvl = this.levelManager.getLevel(levelId);
    this.currentLevel = lvl;
    this.levelManager.currentLevelId = levelId;
    
    this.bits = lvl.startingBits;
    this.kernelHp = CONFIG.KERNEL_MAX_HP;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.gpuMiningTimer = 0;
    this.waveRestTimer = 0;
    
    this.waveNumber = 0;
    this.waveActive = false;
    this.selectedTower = null;
    this.uiMode = 'BUY';
    this.selectedBuildItem = null;
    
    // Clear inventory
    Object.keys(this.inventory).forEach(key => {
      this.inventory[key] = 0;
    });

    if (this.notifTimeout) {
      clearTimeout(this.notifTimeout);
      this.notifTimeout = null;
    }
    document.getElementById('top-notification').classList.add('hidden');

    // Initialize tutorial if Level 1
    if (lvl.isTutorial) {
      this.tutorial = new TutorialController(this);
      this.tutorial.refreshActiveInstruction();
    } else {
      this.tutorial = null;
      this.sysop.hide();
    }

    this.gameActive = true;
    this.updateHUD();
    this.updateHotbarUI();
    this.deselectTower();
    
    document.getElementById('hotbar-tooltip').classList.remove('hidden');
    this.clearSlotTooltip();
  }

  levelCleared() {
    this.gameActive = false;
    
    // Save unlocked progress
    const nextLevelId = this.levelManager.currentLevelId + 1;
    this.levelManager.saveProgress(nextLevelId);
    
    // Open Victory popup
    const victoryScreen = document.getElementById('level-victory');
    victoryScreen.classList.remove('hidden');
    
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('bottom-bar').classList.add('hidden');
    document.getElementById('tower-monitor').classList.add('hidden');
    if (this.sysop) this.sysop.hide();
    
    const unlockList = document.getElementById('victory-unlock-list');
    unlockList.innerHTML = '';
    
    let unlocks = [];
    if (this.levelManager.currentLevelId === 1) {
      unlocks = ["RTX GPU MINER", "80+ PLATINUM PSU", "SECTOR 02: POWER GRID"];
    } else if (this.levelManager.currentLevelId === 2) {
      unlocks = ["LIQUID AIO COOLER", "CORE I9 EXTREME CPU", "SECTOR 03: LIQUID CORE"];
    } else if (this.levelManager.currentLevelId === 3) {
      unlocks = ["SECTOR 04: ENDLESS COMPILER"];
    }
    
    unlocks.forEach(item => {
      const badge = document.createElement('div');
      badge.className = 'unlock-badge';
      badge.innerText = item;
      unlockList.appendChild(badge);
    });
  }

  continueToNextLevel() {
    document.getElementById('level-victory').classList.add('hidden');
    const nextLevelId = this.levelManager.currentLevelId + 1;
    if (nextLevelId <= 4) {
      this.startLevel(nextLevelId);
    } else {
      this.showLevelSelect();
    }
  }

  returnToLevelSelect() {
    document.getElementById('level-victory').classList.add('hidden');
    this.showLevelSelect();
  }

  showSlotTooltip(slotName) {
    const bar = document.getElementById('hotbar-tooltip');
    bar.classList.remove('hidden');
    
    let desc = "";
    switch(slotName) {
      case 'socket':
        desc = "SOCKET: Base motherboard pad connector. Required to place cases. Cost: 20QB.";
        break;
      case 'case-basic':
        desc = "CASE (ITX): Basic case. HP: 100, Passive Airflow: 8°C/s. Support: Mini-ITX motherboard. Cost: 40QB.";
        break;
      case 'case-gaming':
        desc = "CASE (ATX): Server ATX case. HP: 250, Passive Airflow: 18°C/s. Support: Full ATX motherboard. Cost: 80QB.";
        break;
      case 'mb-mini':
        desc = "MB (ITX): ITX Motherboard. Range: 2.75 Tiles. Slots: 1 CPU, 2 RAM, 1 GPU, 1 PSU, 1 Cooler. Cost: 45QB.";
        break;
      case 'mb-atx':
        desc = "MB (ATX): ATX Motherboard. Range: 3.75 Tiles. Slots: 1 CPU, 4 RAM, 3 GPU, 1 PSU, 2 Coolers. Cost: 100QB.";
        break;
      case 'cpu':
        desc = "CPU (I5): Core i5 Processor. Fires lasers at malware. Damage: +40, Wattage: 20W, Heat: 6 per shot. Cost: 30QB.";
        break;
      case 'cpu-extreme':
        desc = "CPU (I9): Core i9 Extreme. Extreme processors. Damage: +100, Wattage: 40W, Heat: 14 per shot. Cost: 65QB.";
        break;
      case 'ram':
        desc = "RAM: DDR5 Memory. Speeds up tower fire cooldown rate by +35%. Wattage: 5W, Heat: 1 per shot. Cost: 25QB.";
        break;
      case 'gpu':
        desc = "GPU: RTX Miner. Generates +1QB/sec actively (in ticks), plus +10QB for malware defeated in range (1.5 Tiles). Wattage: 35W, Heat: 18/s. Cost: 50QB.";
        break;
      case 'psu':
        desc = "PSU: 80+ Platinum. Supplies up to 110W power and reduces total heat output by 35%. Cost: 40QB.";
        break;
      case 'cooler':
        desc = "COOLER: Liquid AIO. Active liquid loops that dissipate 40 units of heat per second. Wattage: 10W. Cost: 35QB.";
        break;
      case 'repair':
        desc = "REPAIR: System Restore. Restores case HP to 100% and resets broken status. Cost: 40QB.";
        break;
      default:
        desc = "Select an item to view specifications.";
    }
    bar.innerText = desc;
  }

  clearSlotTooltip() {
    const bar = document.getElementById('hotbar-tooltip');
    if (!bar) return;
    if (this.uiMode === 'BUILD') {
      bar.innerText = "BUILD Mode: Select a map tile first, then tap a hotbar item to install it.";
    } else {
      bar.innerText = "BUY Mode: Tap slots to purchase parts to inventory. Tap a tower to inspect stats.";
    }
  }

  restartGame() {
    document.getElementById('game-over').classList.add('hidden');
    if (this.currentLevel) {
      this.startLevel(this.currentLevel.id);
    } else {
      this.startLevel(1);
    }
  }

  gameOver() {
    this.gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('bottom-bar').classList.add('hidden');
    document.getElementById('tower-monitor').classList.add('hidden');
    document.getElementById('stat-final-waves').innerText = this.waveNumber;
    document.getElementById('stat-final-bits').innerText = Math.round(this.bits);
  }

  // Toggles mode and clears active highlights/selections
  toggleUIMode() {
    // Hook: Tutorial intercept checks
    if (this.tutorial) {
      if (!this.tutorial.canToggleMode()) return;
    }

    const btn = document.getElementById('btn-mode-toggle');
    const label = document.getElementById('val-mode');
    
    if (this.uiMode === 'BUY') {
      this.uiMode = 'BUILD';
      btn.className = 'mode-btn build-mode';
      label.innerText = 'BUILD';
      
      // Auto select first available item in inventory
      const firstAvailable = Object.keys(this.inventory).find(k => this.inventory[k] > 0);
      if (firstAvailable) {
        this.selectedBuildItem = firstAvailable;
      } else {
        this.selectedBuildItem = null;
      }
    } else {
      this.uiMode = 'BUY';
      btn.className = 'mode-btn buy-mode';
      label.innerText = 'BUY';
      this.selectedBuildItem = null;
    }
    
    // Hook: Notify tutorial mode change
    if (this.tutorial) {
      this.tutorial.onActionTriggered('toggleMode', null);
    }
    
    this.updateHotbarUI();
  }

  getCostOfItem(slotName) {
    switch(slotName) {
      case 'socket': return CONFIG.SOCKET.cost;
      case 'case-basic': return CONFIG.CASES.basic.cost;
      case 'case-gaming': return CONFIG.CASES.gaming.cost;
      case 'mb-mini': return CONFIG.MOTHERBOARDS['mini-itx'].cost;
      case 'mb-atx': return CONFIG.MOTHERBOARDS['atx'].cost;
      default: return CONFIG.COMPONENTS[slotName] ? CONFIG.COMPONENTS[slotName].cost : 40; // components or repair
    }
  }



  handleHotbarClick(slotName) {
    if (!this.gameActive) return;

    if (this.uiMode === 'BUY') {
      // Hook: Tutorial intercept buy checks
      if (this.tutorial) {
        if (!this.tutorial.canBuyItem(slotName)) return;
      }

      // Spend bits to add to stock
      const cost = this.getCostOfItem(slotName);
      if (this.bits >= cost) {
        this.bits -= cost;
        this.inventory[slotName]++;
        this.updateHUD();
        this.updateHotbarUI();

        // Hook: Notify tutorial buy action
        if (this.tutorial) {
          this.tutorial.onActionTriggered('buy', slotName);
        }
      }
    } else {
      // Build mode: Select part to build
      if (this.inventory[slotName] > 0) {
        this.selectedBuildItem = slotName;
        
        // If we have an active cell, try to build it immediately!
        if (this.activeBuildCell) {
          this.buildItemAtCell(slotName, this.activeBuildCell.x, this.activeBuildCell.y);
        }
        
        this.updateHotbarUI();
      }
    }
  }

  buildItemAtCell(item, col, row) {
    // Hook: Tutorial intercept build checks
    if (this.tutorial) {
      if (!this.tutorial.canBuildItem(item, col, row)) return;
    }

    const tower = this.towers.find(t => t.gridX === col && t.gridY === row);
    let buildSuccess = false;

    if (item === 'socket') {
      // Socket placement: cell must be empty, not on path, not kernel
      if (!tower && !this.isCellOnPath(col, row) && col < 15) {
        const newSocket = new PcTower(col, row);
        this.towers.push(newSocket);
        buildSuccess = true;
        this.selectTower(newSocket);
      }
    } else if (tower) {
      if (item === 'case-basic' || item === 'case-gaming') {
        const caseType = item === 'case-basic' ? 'basic' : 'gaming';
        if (!tower.hasCase) {
          buildSuccess = tower.installCase(caseType);
        }
      } else if (item === 'mb-mini' || item === 'mb-atx') {
        const mbType = item === 'mb-mini' ? 'mini-itx' : 'atx';
        if (tower.hasCase && !tower.motherboard) {
          if (mbType === 'atx' && tower.caseType === 'basic') {
            console.log("ATX board too large for Mini Case!");
          } else {
            buildSuccess = tower.installMotherboard(mbType);
          }
        }
      } else if (item === 'repair') {
        if (tower.status === 'broken') {
          buildSuccess = tower.repair();
        }
      } else {
        // CPU, RAM, GPU, PSU, Cooler
        buildSuccess = tower.installComponent(item);
      }
    }

    if (buildSuccess) {
      this.inventory[item]--;
      this.updateHUD();
      this.updateHotbarUI();
      if (tower) {
        this.selectTower(tower);
      }

      // Hook: Notify tutorial build success
      if (this.tutorial) {
        this.tutorial.onActionTriggered('buildItem', item);
      }
    }
  }

  updateHotbarUI() {
    document.querySelectorAll('.hotbar-slot').forEach(btn => {
      const slotName = btn.getAttribute('data-slot');
      
      // Filter out locked items in Level 1 (or other levels)
      if (this.currentLevel) {
        const isUnlocked = this.currentLevel.unlockedParts.includes(slotName);
        if (!isUnlocked) {
          btn.style.display = 'none';
          return;
        } else {
          btn.style.display = 'flex';
        }
      } else {
        btn.style.display = 'flex';
      }

      const cost = this.getCostOfItem(slotName);
      const stock = this.inventory[slotName];

      const badge = document.getElementById(`stock-${slotName}`);
      if (badge) {
        badge.innerText = stock;
        if (stock > 0) {
          badge.classList.add('has-stock');
        } else {
          badge.classList.remove('has-stock');
        }
      }
      
      btn.classList.remove('highlighted', 'selected');

      if (this.uiMode === 'BUY') {
        btn.disabled = this.bits < cost;
      } else {
        btn.classList.add('highlighted');
        btn.disabled = stock <= 0;
        if (this.selectedBuildItem === slotName) {
          btn.classList.add('selected');
        }
      }
    });
  }

  isCellOnPath(col, row) {
    for (const path of CONFIG.PATHS) {
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        
        if (p1.x === p2.x) { // Vertical segment
          if (col === p1.x && row >= minY && row <= maxY) return true;
        } else if (p1.y === p2.y) { // Horizontal segment
          if (row === p1.y && col >= minX && col <= maxX) return true;
        }
      }
    }
    return false;
  }

  handleCellClick(col, row) {
    if (!this.gameActive) return;

    // Hook: Tutorial intercept cell click checks
    if (this.tutorial) {
      if (!this.tutorial.canClickCell(col, row)) return;
    }

    const tower = this.towers.find(t => t.gridX === col && t.gridY === row);

    if (this.uiMode === 'BUILD') {
      this.activeBuildCell = { x: col, y: row };
      
      // Select tower if exists so stats are visible while building
      if (tower) {
        this.selectTower(tower);
      } else {
        this.deselectTower();
      }
      
      // Hook: Notify tutorial cell selection
      if (this.tutorial) {
        this.tutorial.onActionTriggered('selectCell', this.activeBuildCell);
      }
      
      // If we already have a build item selected, try to place it
      if (this.selectedBuildItem && this.inventory[this.selectedBuildItem] > 0) {
        this.buildItemAtCell(this.selectedBuildItem, col, row);
      }
    } else {
      // BUY mode: click selects tower
      this.activeBuildCell = null;
      if (tower) {
        this.selectTower(tower);
      } else {
        this.deselectTower();
      }
    }
  }

  handleCellHover(cell) {
    this.hoverCell = cell;
  }

  selectTower(tower) {
    this.selectedTower = tower;
    this.lastSelectedTowerStatus = tower.status;
    this.hardwareExpanded = false; // default collapsed on selection
    this.updateHardwareListVisibility();
    
    // Open system monitor panel (Top-Right default, positioned dynamically)
    const monitor = document.getElementById('tower-monitor');
    monitor.classList.remove('hidden');
    
    this.updateMonitorUI();
  }

  deselectTower() {
    this.selectedTower = null;
    this.lastSelectedTowerStatus = null;
    this.hardwareExpanded = false;
    document.getElementById('tower-monitor').classList.add('hidden');
  }

  toggleHardwareExpanded() {
    this.hardwareExpanded = !this.hardwareExpanded;
    this.updateHardwareListVisibility();
    if (this.selectedTower) {
      this.updateMonitorUI();
    }
  }

  updateHardwareListVisibility() {
    const container = document.getElementById('hardware-list-container');
    const icon = document.getElementById('hardware-toggle-icon');
    if (container && icon) {
      if (this.hardwareExpanded) {
        container.classList.remove('collapsed');
        icon.innerText = '▼';
      } else {
        container.classList.add('collapsed');
        icon.innerText = '▶';
      }
    }
  }

  updateMonitorPosition(tower) {
    const monitor = document.getElementById('tower-monitor');
    if (!monitor || monitor.classList.contains('hidden')) return;
    
    // Centered and scaled coordinates matching canvas.js scale factor (0.8) and translations (128, 20)
    const logicalX = tower.x * 0.8 + 128;
    const logicalY = tower.y * 0.8 + 20;
    
    // Convert logic coordinates to screen container pixels
    const screenX = logicalX * this.renderer.scale;
    const screenY = logicalY * this.renderer.scale;
    
    const popWidth = monitor.offsetWidth || 350; // read exact width dynamically (supports mobile responsive sizes)
    const popHeight = monitor.offsetHeight || 280; // read exact height dynamically (collapsed or expanded)
    
    // Center horizontally
    let left = screenX - popWidth / 2;
    
    // Bound check horizontal container limits
    const container = document.getElementById('game-container');
    const containerWidth = container ? container.clientWidth : 1280;
    const maxLeft = containerWidth - popWidth - 10;
    if (left < 10) left = 10;
    if (left > maxLeft) left = maxLeft;
    
    // Default: float above the tower (increased offset to 85px to avoid covering tower)
    let top = screenY - popHeight - 85;
    
    // Switch to below if it overflows past the top edge of screen (increased offset to 85px)
    if (top < 10) {
      top = screenY + 85;
    }
    
    monitor.style.left = `${left}px`;
    monitor.style.top = `${top}px`;
    monitor.style.right = 'auto'; // override default CSS layout
  }

  updateMonitorTextOnly() {
    if (!this.selectedTower) return;
    const tower = this.selectedTower;

    // Health
    const hpEl = document.getElementById('mon-hp');
    hpEl.innerText = `${Math.round(tower.hp)} / ${tower.maxHp}`;
    
    // Status Row
    const statusEl = document.getElementById('mon-status');
    statusEl.innerText = tower.status.toUpperCase();
    
    if (tower.status === 'broken') {
      hpEl.className = 'neon-red';
      statusEl.className = 'neon-red';
      statusEl.innerText = "CORRUPTED";
    } else if (tower.status === 'throttled') {
      hpEl.className = 'neon-orange';
      statusEl.className = 'neon-orange';
      statusEl.innerText = "THROTTLED";
    } else if (tower.status === 'overloaded') {
      hpEl.className = 'neon-orange';
      statusEl.className = 'neon-orange';
      statusEl.innerText = "OVERLOADED";
    } else {
      hpEl.className = 'neon-green';
      statusEl.className = 'neon-green';
      statusEl.innerText = "ACTIVE";
    }

    // Damage, Speed, Range, Cooling Stats
    document.getElementById('mon-dmg').innerText = tower.damage;
    document.getElementById('mon-speed').innerText = tower.damage > 0 ? (1000 / tower.fireCooldown).toFixed(1) + "/s" : "0/s";
    document.getElementById('mon-range').innerText = tower.range > 0 ? (tower.range / 80).toFixed(1) + " Tiles" : "0 Tiles";
    document.getElementById('mon-cooling').innerText = tower.coolingRate + "°C/s";

    // Wattage
    document.getElementById('mon-wattage').innerText = `${tower.wattageDrawn}W / ${tower.wattageProvided}W`;

    // Temperature
    const tempEl = document.getElementById('mon-temp');
    tempEl.innerText = `${Math.round(tower.heat)}°C`;
    if (tower.heat >= 85) tempEl.className = 'neon-red';
    else if (tower.heat >= 60) tempEl.className = 'neon-orange';
    else tempEl.className = 'neon-cyan';

    // Position popup
    this.updateMonitorPosition(tower);
  }

  updateMonitorUI() {
    if (!this.selectedTower) return;
    const tower = this.selectedTower;

    // Type name
    let typeName = "Socket Base";
    if (tower.hasCase) {
      typeName = tower.caseType === 'basic' ? "ITX Mini Tower" : "ATX Server Tower";
    }
    document.getElementById('mon-type').innerText = typeName;

    // List components
    const list = document.getElementById('mon-hardware-list');
    list.innerHTML = '';

    if (!tower.motherboard) {
      const li = document.createElement('li');
      li.innerText = !tower.hasCase ? "Install Case first" : "Install Motherboard next";
      li.style.color = 'var(--text-muted)';
      list.appendChild(li);
    } else {
      const mb = tower.motherboard;
      
      // Board label
      const mbLi = document.createElement('li');
      mbLi.innerHTML = `<span>[MB] ${mb.name}</span>`;
      mbLi.style.borderLeftColor = 'var(--neon-cyan)';
      list.appendChild(mbLi);

      // Iterate slot-by-slot for each hardware type to show active parts and empty slots
      const slotTypes = ['cpu', 'ram', 'gpu', 'psu', 'cooler'];
      slotTypes.forEach(type => {
        const totalSlots = mb.stats.slots[type] || 0;
        const installedArr = mb.installed[type] || [];
        
        for (let i = 0; i < totalSlots; i++) {
          const li = document.createElement('li');
          if (i < installedArr.length) {
            const comp = installedArr[i];
            li.innerHTML = `
              <span>[${type.toUpperCase()}] ${comp.stats.name}</span>
              <button data-uninstall="${type}" data-id="${comp.id}">SELL</button>
            `;
            li.style.borderLeftColor = 'var(--neon-purple)';
            
            // Uninstall handler
            li.querySelector('button').addEventListener('click', (e) => {
              const pType = e.currentTarget.getAttribute('data-uninstall');
              const pId = e.currentTarget.getAttribute('data-id');
              this.uninstallComponent(pType, pId);
            });
          } else {
            // Empty placeholder
            li.innerHTML = `
              <span style="color: rgba(255, 255, 255, 0.25); font-style: italic;">
                [${type.toUpperCase()}${totalSlots > 1 ? ' ' + (i + 1) : ''}] (Available)
              </span>
            `;
            li.style.borderLeftColor = 'rgba(255, 255, 255, 0.05)';
          }
          list.appendChild(li);
        }
      });
    }

    // Load current values
    this.updateMonitorTextOnly();
  }

  uninstallComponent(partType, id) {
    if (!this.selectedTower) return;
    const removed = this.selectedTower.removeComponent(partType, id);
    if (removed) {
      // Refund 50% of cost in bits
      this.bits += Math.floor(removed.stats.cost / 2);
      this.updateHUD();
      this.updateMonitorUI();
      this.updateHotbarUI();
    }
  }

  startNextWave() {
    if (this.waveActive) return;
    
    // Hook: Notify tutorial wave start
    if (this.tutorial) {
      this.tutorial.onActionTriggered('startWave', null);
    }
    
    // If wave has started and we are resting, award overclocking bonus
    if (this.waveNumber > 0 && this.waveRestTimer > 0) {
      const bonusQB = Math.ceil(this.waveRestTimer);
      this.bits += bonusQB;
      this.showNotification(`OVERCLOCK BONUS: +${bonusQB}QB`);
    }
    
    this.waveRestTimer = 0;
    this.waveNumber++;
    this.waveActive = true;
    this.updateHUD();

    // Generate wave queue
    if (this.currentLevel) {
      this.spawnQueue = this.currentLevel.waveSetup(this.waveNumber);
    } else {
      this.spawnQueue = [];
      let glitches = 5 + this.waveNumber * 2;
      let worms = this.waveNumber > 2 ? 3 + this.waveNumber : 0;
      let trojans = this.waveNumber > 5 ? Math.floor(this.waveNumber / 2) : 0;

      for (let i = 0; i < glitches; i++) this.spawnQueue.push('glitch');
      for (let i = 0; i < worms; i++) this.spawnQueue.push('worm');
      for (let i = 0; i < trojans; i++) this.spawnQueue.push('trojan');

      this.spawnQueue.sort(() => Math.random() - 0.5);
    }
    
    this.spawnTimer = 0;
  }

  updateHUD() {
    document.getElementById('val-bits').innerText = String(Math.floor(this.bits)).padStart(4, '0');
    
    const waveEl = document.getElementById('val-wave');
    if (this.currentLevel && this.currentLevel.waves !== Infinity) {
      waveEl.innerText = `${this.waveNumber} / ${this.currentLevel.waves}`;
    } else {
      waveEl.innerText = this.waveNumber;
    }
    
    const hpPct = Math.max(0, (this.kernelHp / this.kernelMaxHp) * 100);
    document.getElementById('val-integrity').innerText = `${Math.round(hpPct)}%`;
    document.getElementById('hp-bar-fill').style.width = `${hpPct}%`;
    
    const btn = document.getElementById('btn-next-wave');
    if (this.waveNumber === 0) {
      btn.innerText = "INITIALIZE PROTOCOL";
      btn.disabled = false;
    } else if (this.waveActive) {
      btn.innerText = "COMPILING WAVE...";
      btn.disabled = true;
    } else {
      const bonusQB = Math.ceil(this.waveRestTimer);
      btn.innerText = `OVERCLOCK (+${bonusQB}QB)`;
      btn.disabled = false;
    }
  }

  spawnEnemy(type) {
    const pathIndex = Math.floor(Math.random() * CONFIG.PATHS.length);
    const path = CONFIG.PATHS[pathIndex];
    const newEnemy = new MalwareEnemy(type, path, pathIndex);
    this.enemies.push(newEnemy);
  }

  spawnProjectile(startX, startY, target, damage) {
    const proj = new LaserProjectile(startX, startY, target, damage);
    this.projectiles.push(proj);
  }

  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.gameActive) {
      this.update(dt);
    }
    
    this.renderer.render(this, this.selectedTower, this.hoverCell);
    
    requestAnimationFrame((t) => this.loop(t));
  }

  showNotification(message) {
    const banner = document.getElementById('top-notification');
    const text = document.getElementById('notif-text');
    
    text.innerText = message;
    banner.classList.remove('hidden');
    
    if (this.notifTimeout) {
      clearTimeout(this.notifTimeout);
    }
    
    this.notifTimeout = setTimeout(() => {
      banner.classList.add('hidden');
      this.notifTimeout = null;
    }, 3000);
  }

  update(dt) {
    // 1. Spawning
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const nextType = this.spawnQueue.shift();
        this.spawnEnemy(nextType);
      }
    }

    // 2. Active GPU Mining (every 1 second)
    this.gpuMiningTimer += dt;
    if (this.gpuMiningTimer >= 1000) {
      this.gpuMiningTimer = 0;
      // Only mine passive Qubits if the first wave protocol has been initialized
      if (this.waveNumber > 0) {
        this.towers.forEach(tower => {
          if (tower.status === 'active' && tower.motherboard) {
            const gpuCount = tower.motherboard.installed.gpu.length;
            if (gpuCount > 0) {
              const qbEarned = gpuCount * 1; // 1 QB per second per active GPU
              this.bits += qbEarned;
              
              // Floating text above GPU tower
              this.floatingTexts.push({
                x: tower.x,
                y: tower.y - 40,
                text: `+${qbEarned}QB`,
                color: '#39ff14', // Green for GPU gain
                life: 1.2
              });
              this.updateHUD();
            }
          }
        });
      }
    }

    // 2b. Update drifting floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const txt = this.floatingTexts[i];
      txt.life -= dt / 1000;
      txt.y -= 25 * (dt / 1000); // drift up by 25px/sec
      if (txt.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 3. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt);
      
      if (enemy.finished) {
        this.kernelHp--;
        this.enemies.splice(i, 1);
        this.updateHUD();
        
        if (this.kernelHp <= 0) {
          this.gameOver();
          return;
        }
      } else if (enemy.hp <= 0) {
        // Normal enemy defeat reward
        this.bits += enemy.reward;
        this.floatingTexts.push({
          x: enemy.x,
          y: enemy.y - 10,
          text: `+${enemy.reward}QB`,
          color: '#00ffcc', // Cyan for basic reward
          life: 1.0
        });
        
        // GPU range collection
        this.towers.forEach(tower => {
          if (tower.status === 'active' && tower.motherboard) {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= tower.range) {
              const gpuCount = tower.motherboard.installed.gpu.length;
              if (gpuCount > 0) {
                const bonusQB = gpuCount * CONFIG.COMPONENTS.gpu.rangeBonusRate;
                this.bits += bonusQB;
                
                this.floatingTexts.push({
                  x: tower.x,
                  y: tower.y - 40,
                  text: `+${bonusQB}QB`,
                  color: '#39ff14', // Green for GPU bonus
                  life: 1.2
                });
              }
            }
          }
        });

        this.enemies.splice(i, 1);
        this.updateHUD();
      }
    }

    // 4. Update Towers
    this.towers.forEach(tower => {
      const prevStatus = tower.status;
      tower.update(dt, this.enemies, (sx, sy, t, d) => this.spawnProjectile(sx, sy, t, d));
      
      // If status changed to throttled or overloaded, trigger SYS-OP warnings
      if (tower.status !== prevStatus && this.sysop) {
        if (tower.status === 'overloaded') {
          this.sysop.showError("[FATAL ERROR] INTELLECT LIMIT EXCEEDED! Look at the amber lightning symbol flashing in your face! The motherboard wattage cap is blown! The whole sector just went dead! Install a PSU before I format your hard drive!");
        } else if (tower.status === 'throttled') {
          this.sysop.showError("[FATAL ERROR] IT'S MELTING! Your CPU core is running at 100°C and the orange fire badge is glowing! The chips are frying themselves alive! Deploy a Liquid AIO Cooler to initiate a heat dissipation cycle before we smell burning silicon!");
        }
      }
    });

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt);
      if (proj.shouldRemove) {
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Check if wave completed
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      
      // Check for Level Sector Clear condition
      if (this.currentLevel && this.waveNumber >= this.currentLevel.waves) {
        this.levelCleared();
        return;
      }
      
      this.waveRestTimer = 120.0; // 120 seconds of recovery rest time
      
      const reward = 50 + this.waveNumber * 10;
      this.bits += reward;
      this.showNotification(`WAVE REWARD: +${reward}QB`);
      
      this.updateHUD();
      this.updateHotbarUI();
    }

    // 6b. Rest Timer Countdown tick (if not compiling a wave and game has started)
    if (!this.waveActive && this.waveNumber > 0 && this.waveRestTimer > 0) {
      this.waveRestTimer -= dt / 1000;
      if (this.waveRestTimer <= 0) {
        this.waveRestTimer = 0;
        this.startNextWave();
      } else {
        // Update countdown button live
        const btn = document.getElementById('btn-next-wave');
        if (btn) {
          const bonusQB = Math.ceil(this.waveRestTimer);
          btn.innerText = `OVERCLOCK (+${bonusQB}QB)`;
        }
      }
    }

    // Live update open monitor values if a tower is selected
    if (this.selectedTower) {
      if (this.selectedTower.status !== this.lastSelectedTowerStatus) {
        this.lastSelectedTowerStatus = this.selectedTower.status;
        this.updateMonitorUI();
      } else {
        this.updateMonitorTextOnly();
      }
    }
  }
}

// Instantiate orchestrator on page load
window.addEventListener('load', () => {
  window.Game = new GameController();
});
