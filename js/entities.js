import CONFIG from './config.js';

// Individual slotted hardware components
export class HardwareComponent {
  constructor(type) {
    this.type = type; // 'cpu', 'ram', 'gpu', 'psu', 'cooler'
    this.stats = { ...CONFIG.COMPONENTS[type] };
    this.name = this.stats.name;
    this.id = type + "_" + Math.floor(Math.random() * 100000);
  }
}

// Motherboard that sits inside a Case and houses slots
export class Motherboard {
  constructor(type) {
    this.type = type; // 'mini-itx' or 'atx'
    this.stats = { ...CONFIG.MOTHERBOARDS[type] };
    this.name = this.stats.name;
    
    // Create empty arrays to match the capacity of each component type
    this.installed = {
      cpu: [],
      ram: [],
      gpu: [], // houses GPUs or pcie-m2 adapters
      psu: [],
      cooler: [],
      ssd: []  // houses SSDs
    };
    
    this.ethernetLinked = false;
    this.wifiAntenna = false;
  }

  getMaxM2Slots() {
    let slots = this.stats.slots.m2 || 0;
    this.installed.gpu.forEach(comp => {
      if (comp.type === 'pcie-m2') {
        slots += comp.stats.m2Extra || 0;
      }
    });
    return slots;
  }

  hasSlotAvailable(type) {
    if (type === 'ssd') {
      return this.installed.ssd.length < this.getMaxM2Slots();
    }
    const category = (type.startsWith('cpu')) ? 'cpu' : (type === 'pcie-m2' ? 'gpu' : type);
    const maxSlots = this.stats.slots[category] || 0;
    return this.installed[category].length < maxSlots;
  }

  install(component) {
    if (this.hasSlotAvailable(component.type)) {
      const category = (component.type.startsWith('cpu')) ? 'cpu' : (component.type === 'pcie-m2' ? 'gpu' : component.type);
      this.installed[category].push(component);
      return true;
    }
    return false;
  }

  remove(type, id) {
    const category = (type.startsWith('cpu')) ? 'cpu' : (type === 'pcie-m2' ? 'gpu' : type);
    const list = this.installed[category];
    const index = list.findIndex(c => c.id === id);
    if (index !== -1) {
      const component = list[index];
      // Safety lock: if removing a PCIE adapter, verify we don't violate current SSD count limits
      if (component.type === 'pcie-m2') {
        const newMax = this.getMaxM2Slots() - (component.stats.m2Extra || 0);
        if (this.installed.ssd.length > newMax) {
          return null; // block removal
        }
      }
      const removed = list.splice(index, 1)[0];
      return removed;
    }
    return null;
  }
}

// The physical PC Case placed on the grid (acts as the Tower)
export class PcTower {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    
    // Pixel coordinates for rendering (centered in cell)
    this.x = gridX * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2;
    this.y = gridY * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2;
    
    this.hasCase = false;
    this.caseType = null;
    this.motherboard = null; // Needs to be installed next
    
    this.hp = CONFIG.SOCKET.cost; // Grid Anchor HP starts at 20
    this.maxHp = 30;
    this.name = CONFIG.SOCKET.name;
    
    this.status = 'active'; // 'active', 'throttled', 'broken'
    this.heat = 30; // base ambient temp 30°C
    this.maxHeat = 100; // thermal limit 100°C
    
    this.cooldownTimer = 0; // CPU shooting timer
    this.invulnTimer = 0; // Post-repair invulnerability timer in seconds
    
    // Cumulative calculated stats
    this.wattageProvided = 0;
    this.wattageDrawn = 0;
    this.coolingRate = 0;
    this.damage = 0;
    this.range = 0;
    this.fireCooldown = 1500; // base shoot speed 1500ms
  }

  installCase(caseType) {
    if (this.hasCase || this.status === 'broken') return false;
    this.hasCase = true;
    this.caseType = caseType;
    this.stats = { ...CONFIG.CASES[caseType] };
    this.name = this.stats.name;
    this.maxHp = this.stats.maxHp;
    this.hp = this.stats.maxHp;
    this.recalculateStats();
    return true;
  }

  installMotherboard(mbType) {
    if (!this.hasCase || this.motherboard || this.status === 'broken') return false;
    if ((mbType === 'atx' || mbType === 'ee-atx') && this.caseType === 'basic') return false;
    this.motherboard = new Motherboard(mbType);
    this.recalculateStats();
    return true;
  }

  installComponent(partType) {
    if (!this.motherboard || this.status === 'broken') return false;
    if (!this.motherboard.hasSlotAvailable(partType)) return false;
    
    const component = new HardwareComponent(partType);
    this.motherboard.install(component);
    this.recalculateStats();
    return true;
  }

  removeComponent(partType, id) {
    if (!this.motherboard || this.status === 'broken') return null;
    const category = partType.startsWith('cpu') ? 'cpu' : partType;
    const removed = this.motherboard.remove(category, id);
    if (removed) {
      this.recalculateStats();
    }
    return removed;
  }

  recalculateStats() {
    if (!this.hasCase) {
      this.wattageProvided = 0;
      this.wattageDrawn = 0;
      this.coolingRate = 0;
      this.damage = 0;
      this.range = 0;
      this.fireCooldown = 1500;
      return;
    }

    if (!this.motherboard) {
      this.wattageProvided = 0;
      this.wattageDrawn = 0;
      this.coolingRate = this.stats.airflow;
      this.damage = 0;
      this.range = 0;
      this.fireCooldown = 1500;
      return;
    }

    const mb = this.motherboard;

    // Power Supply (PSU) limits
    const psuList = mb.installed.psu;
    if (psuList.length > 0) {
      this.wattageProvided = psuList.reduce((acc, p) => acc + p.stats.maxPower, 0);
    } else {
      this.wattageProvided = 40; // increased from 30W to 40W base power
    }

    // Cooling
    const coolingList = mb.installed.cooler;
    const activeCooling = coolingList.reduce((acc, c) => acc + c.stats.coolingRate, 0);
    this.coolingRate = this.stats.airflow + activeCooling;

    // CPU (Damage, Target count, Mix & Match)
    const cpuList = mb.installed.cpu;
    this.damage = cpuList.reduce((acc, c) => acc + c.stats.damage, 0);
    this.isMixedCpu = false;

    if (cpuList.length > 0) {
      this.maxTargets = Math.max(...cpuList.map(c => c.stats.maxTargets || 1));
      const hasRyzen = cpuList.some(c => c.type === 'cpu-ryzen5' || c.type === 'cpu-ryzen9');
      this.showTrail = hasRyzen;
      this.cpuColor = hasRyzen ? '#ff6600' : cpuList[0].stats.color;

      if (cpuList.length >= 2) {
        const is0Intel = (cpuList[0].type === 'cpu' || cpuList[0].type === 'cpu-extreme');
        const is1Intel = (cpuList[1].type === 'cpu' || cpuList[1].type === 'cpu-extreme');
        if (is0Intel !== is1Intel) {
          this.isMixedCpu = true;
        }
      }
    } else {
      this.maxTargets = 1;
      this.cpuColor = '#00ffcc';
      this.showTrail = false;
    }

    // RAM (Fire speed)
    const ramList = mb.installed.ram;
    const ramBonus = ramList.reduce((acc, r) => acc + r.stats.speedFactor, 0);
    this.fireCooldown = 1200 / (1 + ramBonus);
    if (this.isMixedCpu) {
      this.fireCooldown *= 1.20; // 20% fire rate penalty for mixed Intel/AMD
    }

    // Range (motherboards determine base, wifi increases it)
    if (mb.type === 'ee-atx') {
      this.range = 380; // 4.75 Tiles
    } else if (mb.type === 'atx') {
      this.range = 300; // 3.75 Tiles
    } else {
      this.range = 220; // 2.75 Tiles
    }
    if (mb.wifiAntenna) this.range += 50;

    // Calculate total wattage draw of all components + EE-ATX 40W baseline
    let totalDraw = (mb.stats.basePowerDraw || 0);
    Object.keys(mb.installed).forEach(type => {
      if (type === 'psu') return;
      mb.installed[type].forEach(comp => {
        totalDraw += comp.stats.wattage || 0;
      });
    });
    this.wattageDrawn = totalDraw;

    // Check overload state transition immediately on hardware changes
    if (this.status !== 'broken' && this.status !== 'throttled') {
      if (this.wattageDrawn > this.wattageProvided) {
        this.status = 'overloaded';
      } else if (this.status === 'overloaded') {
        this.status = 'active';
      }
    }
  }

  takeDamage(amount) {
    if (this.status === 'broken' || this.invulnTimer > 0) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.breakTower();
    }
  }

  breakTower() {
    this.status = 'broken';
    // Lose one random component if motherboards/parts exist
    if (this.motherboard) {
      const mb = this.motherboard;
      const allTypes = Object.keys(mb.installed).filter(t => mb.installed[t].length > 0);
      if (allTypes.length > 0) {
        const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
        const componentList = mb.installed[randomType];
        const randomComp = componentList[Math.floor(Math.random() * componentList.length)];
        
        // Remove it!
        mb.remove(randomType, randomComp.id);
        this.recalculateStats();
        console.log(`Tower at [${this.gridX}, ${this.gridY}] broke! Lost component: ${randomComp.name}`);
      }
    }
  }

  repair() {
    if (this.status !== 'broken') return false;
    this.hp = this.maxHp;
    this.heat = 30; // cooled down
    this.status = 'active';
    this.invulnTimer = 10.0; // 10 seconds of invulnerability post-repair
    this.recalculateStats();
    return true;
  }

  update(dt, enemies, spawnProjectileCallback) {
    if (this.status === 'broken') return;

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt / 1000;
      if (this.invulnTimer < 0) this.invulnTimer = 0;
    }

    // 1. Power Limit System Throttling check
    const isOverloaded = this.wattageDrawn > this.wattageProvided;
    if (isOverloaded) {
      if (this.status !== 'throttled') {
        this.status = 'overloaded';
      }
    } else if (this.status === 'overloaded') {
      this.status = 'active';
    }
    
    // 2. Thermal Management
    let heatGeneration = 0;
    const mb = this.motherboard;
    const hasActiveComponents = mb && (mb.installed.cpu.length > 0 || mb.installed.gpu.length > 0);

    // Disable heating in Sector 1 & Sector 2
    const isLvl1Or2 = window.Game && window.Game.currentLevel && (window.Game.currentLevel.id === 1 || window.Game.currentLevel.id === 2);
    if (isLvl1Or2) {
      this.heat = 30;
    } else if (hasActiveComponents) {
      // Heat is generated constant unless broken
      heatGeneration = 0.5 * (dt / 1000); // ambient motherboard running heat per second
      
      // GPUs run warm constantly while mining
      mb.installed.gpu.forEach(g => {
        heatGeneration += g.stats.heat * (dt / 1000);
      });
      
      // Apply PSU Heat Efficiency rating
      if (mb.installed.psu.length > 0) {
        const psu = mb.installed.psu[0];
        heatGeneration *= (1 - psu.stats.heatReduction);
      }

      // Heat change = generation - cooling
      const coolAmount = this.coolingRate * (dt / 1000);
      this.heat += heatGeneration - coolAmount;

      // Floors at ambient temperature
      if (this.heat < 30) this.heat = 30;

      // Check thermal state transitions
      if (this.heat >= this.maxHeat) {
        this.heat = this.maxHeat;
        this.status = 'throttled';
        // Take thermal damage over time
        this.takeDamage(10 * (dt / 1000));
      } else if (this.heat < 75 && this.status === 'throttled') {
        this.status = this.wattageDrawn > this.wattageProvided ? 'overloaded' : 'active';
      }
    } else {
      // No active components: Cool down to ambient temperature
      if (this.heat > 30) {
        const coolAmount = (this.coolingRate || 10) * (dt / 1000);
        this.heat -= coolAmount;
        if (this.heat < 30) this.heat = 30;
      }
      // Recover if throttled without active components
      if (this.status === 'throttled' && this.heat < 75) {
        this.status = this.wattageDrawn > this.wattageProvided ? 'overloaded' : 'active';
      }
    }

    // If throttled or overloaded or no CPU, we cannot fire
    if (this.status !== 'active' || this.damage <= 0) {
      return;
    }

    // 3. Combat Shooting loop
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }

    if (this.cooldownTimer <= 0) {
      // Find up to maxTargets in range
      const maxCount = this.maxTargets || 1;
      const targets = this.findTargets(enemies, maxCount);
      if (targets.length > 0) {
        // Shoot all targeted enemies simultaneously!
        targets.forEach(target => {
          spawnProjectileCallback(this.x, this.y, target, this.damage, this.cpuColor, this.showTrail, this.showTrail);
        });
        this.cooldownTimer = this.fireCooldown;
        
        // Firing CPU generates immediate heat spike (disabled in Sector 1 & 2)
        const isLvl1Or2 = window.Game && window.Game.currentLevel && (window.Game.currentLevel.id === 1 || window.Game.currentLevel.id === 2);
        if (!isLvl1Or2) {
          let fireHeat = 0;
          const isEEATX = (this.motherboard && this.motherboard.type === 'ee-atx');
          let heatMult = isEEATX ? 1.25 : 1.0; // Thermal Fusion (+25%)
          if (this.isMixedCpu) heatMult += 0.10; // +10% mix & match heat penalty

          this.motherboard.installed.cpu.forEach(c => { fireHeat += c.stats.heat * heatMult; });
          this.motherboard.installed.ram.forEach(r => { fireHeat += r.stats.heat; });
          this.heat += fireHeat;
        }
      }
    }
  }

  findTarget(enemies) {
    const targets = this.findTargets(enemies, 1);
    return targets.length > 0 ? targets[0] : null;
  }

  findTargets(enemies, maxCount = 1) {
    const valid = enemies.filter(enemy => {
      if (enemy.hp <= 0 || enemy.finished) return false;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      return (dx * dx + dy * dy) <= (this.range * this.range);
    });

    valid.sort((a, b) => b.distTraveled - a.distTraveled);
    return valid.slice(0, maxCount);
  }
}


// Malware/Virus Enemy entity
export class MalwareEnemy {
  constructor(type, path, pathIndex = 0) {
    this.type = type;
    this.stats = { ...CONFIG.MALWARE[type] };
    this.name = this.stats.name;
    
    // In Sector 1 Boot tutorial, malware is weakened to be 1-shot (20 HP vs i5 40 DMG)
    const isLvl1 = window.Game && window.Game.currentLevel && window.Game.currentLevel.id === 1;
    this.hp = isLvl1 ? 20 : this.stats.hp;
    this.maxHp = this.hp;
    this.lastShedHp = this.maxHp;
    this.speed = this.stats.speed;
    this.reward = this.stats.reward;
    this.color = this.stats.color;
    this.size = this.stats.size;
    this.attackPower = this.stats.attackPower;
    
    this.path = path;
    this.pathIndex = pathIndex;
    this.currentWaypointIndex = 0;
    
    // Position starting at first path point
    const startPt = this.path[0];
    this.x = startPt.x * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2;
    this.y = startPt.y * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2;
    
    this.finished = false;
    this.distTraveled = 0;
    
    // Glitch animation offset
    this.glitchOffsetTimer = 0;
    this.glitchX = 0;
    this.glitchY = 0;
  }

  takeDamage(amount) {
    const prevHp = this.hp;
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;

    // Boss Swarm Mitosis shedding
    if (this.type === 'boss' && this.hp > 0) {
      const shedThreshold = this.stats.shedThreshold || 50;
      const hpLost = this.lastShedHp - this.hp;
      if (hpLost >= shedThreshold) {
        const count = Math.floor(hpLost / shedThreshold);
        this.lastShedHp -= count * shedThreshold;
        if (window.Game && window.Game.spawnShedEnemy) {
          for (let i = 0; i < count; i++) {
            window.Game.spawnShedEnemy('swarm', this.x, this.y, this.path, this.currentWaypointIndex, this.distTraveled);
          }
        }
      }
    }
  }

  update(dt) {
    if (this.hp <= 0 || this.finished) return;

    // Visual glitch effect jitter
    this.glitchOffsetTimer += dt;
    if (this.glitchOffsetTimer > 80) { // change offset every 80ms
      this.glitchOffsetTimer = 0;
      if (Math.random() < 0.25) { // 25% chance to glitch frame
        this.glitchX = (Math.random() - 0.5) * 8;
        this.glitchY = (Math.random() - 0.5) * 8;
      } else {
        this.glitchX = 0;
        this.glitchY = 0;
      }
    }

    // Movement calculation
    const targetWaypoint = this.path[this.currentWaypointIndex + 1];
    if (!targetWaypoint) {
      this.finished = true; // Kernel reached!
      return;
    }

    const targetX = targetWaypoint.x * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2;
    const targetY = targetWaypoint.y * CONFIG.GRID.CELL_SIZE + CONFIG.GRID.CELL_SIZE / 2;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const moveDist = this.speed * 60 * (dt / 1000); // normalized speed at 60fps

    if (dist <= moveDist) {
      // Snap to waypoint and move to next
      this.x = targetX;
      this.y = targetY;
      this.currentWaypointIndex++;
      this.distTraveled += dist;
    } else {
      // Interpolate towards waypoint
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
      this.distTraveled += moveDist;
    }
  }
}

// Projectile entity (glowing laser or packet bullet)
export class LaserProjectile {
  constructor(startX, startY, target, damage, color, showTrail = false, isRyzen = false) {
    this.x = startX;
    this.y = startY;
    this.target = target;
    this.damage = damage;
    this.color = color || '#00ffcc';
    this.showTrail = showTrail;
    this.isRyzen = isRyzen || showTrail;
    
    this.speed = 450; // pixels per second
    this.size = 5;
    this.shouldRemove = false;
  }

  update(dt) {
    if (this.shouldRemove) return;

    if (!this.target || this.target.hp <= 0) {
      // target disappeared/died, self destruct
      this.shouldRemove = true;
      return;
    }

    // Move toward target center
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const step = this.speed * (dt / 1000);
    if (dist <= step) {
      // Hit! Apply damage reduction rules
      let finalDamage = this.damage;
      const targetType = this.target.type;

      // Heavy armor (Worm & Trojan) takes 25% reduced damage from AMD Ryzen CPUs
      if ((targetType === 'worm' || targetType === 'trojan') && this.isRyzen) {
        finalDamage *= 0.75;
      }

      // DDoS Swarms take reduced damage from Intel CPUs (requiring 2 shots to kill from i5)
      if (targetType === 'swarm' && !this.isRyzen) {
        finalDamage = Math.min(finalDamage, 8.0); // 8 HP per shot against 15 HP Swarm = 2 shots!
      }

      this.target.takeDamage(finalDamage);
      this.shouldRemove = true;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }
}
