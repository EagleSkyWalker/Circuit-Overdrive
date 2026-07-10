import CONFIG from './config.js';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Scale tracking
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Aesthetic animations
    this.pulseTimer = 0;
    this.dataPackets = []; // floating dots on circuit tracks
    this.initDataPackets();
  }

  // Pre-populate aesthetic data packets traveling on circuit traces
  initDataPackets() {
    for (let i = 0; i < 20; i++) {
      const pathIdx = Math.floor(Math.random() * CONFIG.PATHS.length);
      const path = CONFIG.PATHS[pathIdx];
      this.dataPackets.push({
        pathIdx: pathIdx,
        waypointIdx: Math.floor(Math.random() * (path.length - 1)),
        progress: Math.random(), // 0 to 1 between waypoints
        speed: 0.3 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        color: Math.random() < 0.5 ? '#00ffcc' : '#a020f0'
      });
    }
  }

  resize(containerWidth, containerHeight) {
    // Locks to 16:9 aspect ratio and determines drawing scale
    const targetRatio = CONFIG.LOGICAL_WIDTH / CONFIG.LOGICAL_HEIGHT;
    let w = containerWidth;
    let h = containerHeight;
    
    if (w / h > targetRatio) {
      w = h * targetRatio;
    } else {
      h = w / targetRatio;
    }
    
    this.canvas.width = w;
    this.canvas.height = h;
    
    this.scale = w / CONFIG.LOGICAL_WIDTH;
    
    // In case we want centering offsets
    this.offsetX = (containerWidth - w) / 2;
    this.offsetY = (containerHeight - h) / 2;
  }

  // Translates viewport pixel coordinates to our game logical coordinate system
  screenToLogical(screenX, screenY) {
    const logicalX = screenX / this.scale;
    const logicalY = screenY / this.scale;
    return {
      x: (logicalX - 128) / 0.8,
      y: (logicalY - 20) / 0.8
    };
  }

  clear() {
    this.ctx.fillStyle = '#050608'; // Pitch black
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(gameState, selectedTower, hoverGrid) {
    this.pulseTimer += 0.015; // Drive glows
    this.clear();
    
    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);
    
    // Scale the map down by 20% and center it horizontally
    this.ctx.translate(128, 20); // shift right and down slightly
    this.ctx.scale(0.8, 0.8);    // scale down logical elements by 20%
    
    // 1. Draw Motherboard PCB background grid & traces
    this.drawPCBGrid();
    this.drawCircuitTraces();
    
    // 2. Draw Kernel Node (Objective)
    this.drawKernelNode(gameState.kernelHp, gameState.kernelMaxHp);
    
    // 3. Draw Range Rings for Hovered/Selected Towers
    if (selectedTower) {
      this.drawRangeRing(selectedTower.x, selectedTower.y, selectedTower.range, '#00ffcc');
    }
    if (hoverGrid) {
      // If there's a tower on the hovered grid cell, draw its range
      const hoveredTower = gameState.towers.find(t => t.gridX === hoverGrid.x && t.gridY === hoverGrid.y);
      if (hoveredTower && hoveredTower !== selectedTower) {
        this.drawRangeRing(hoveredTower.x, hoveredTower.y, hoveredTower.range, 'rgba(255, 255, 255, 0.25)');
      } else if (!hoveredTower) {
        // Draw placement preview
        this.drawGridPreview(hoverGrid.x, hoverGrid.y, gameState.bits >= CONFIG.CASES.basic.cost);
      }
    }
    
    // 3b. Draw Active Build Cell outline
    if (gameState.uiMode === 'BUILD' && gameState.activeBuildCell) {
      this.drawActiveBuildCell(gameState.activeBuildCell.x, gameState.activeBuildCell.y);
    }

    // 3c. Draw Tutorial Target Highlight and Arrow
    if (gameState.tutorial && (gameState.tutorial.step === 2 || gameState.tutorial.step === 3)) {
      this.drawTutorialTarget(9, 5);
    }

    // 4. Draw Towers (Cases)
    gameState.towers.forEach(tower => {
      this.drawTower(tower, selectedTower === tower);
    });

    // 5. Draw Malware (Enemies)
    gameState.enemies.forEach(enemy => {
      this.drawMalware(enemy);
    });

    // 6. Draw Projectiles
    gameState.projectiles.forEach(proj => {
      this.drawProjectile(proj);
    });

    // 7. Draw Floating Texts
    gameState.floatingTexts.forEach(txt => {
      this.drawFloatingText(txt);
    });

    this.ctx.restore();
  }

  drawPCBGrid() {
    this.ctx.strokeStyle = '#0e121a'; // subtle grid lines
    this.ctx.lineWidth = 1;
    
    const cellSize = CONFIG.GRID.CELL_SIZE;
    
    // Vertical lines
    for (let c = 0; c <= CONFIG.GRID.COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * cellSize, 0);
      this.ctx.lineTo(c * cellSize, CONFIG.LOGICAL_HEIGHT);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let r = 0; r <= CONFIG.GRID.ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * cellSize);
      this.ctx.lineTo(CONFIG.LOGICAL_WIDTH, r * cellSize);
      this.ctx.stroke();
    }

    // Draw little PCB screw holes & corner accents
    this.ctx.fillStyle = '#121926';
    const corners = [
      {x: 40, y: 40}, {x: CONFIG.LOGICAL_WIDTH - 40, y: 40},
      {x: 40, y: CONFIG.LOGICAL_HEIGHT - 40}, {x: CONFIG.LOGICAL_WIDTH - 40, y: CONFIG.LOGICAL_HEIGHT - 40}
    ];
    corners.forEach(corner => {
      this.ctx.beginPath();
      this.ctx.arc(corner.x, corner.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#223049';
      this.ctx.beginPath();
      this.ctx.arc(corner.x, corner.y, 12, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  }

  drawCircuitTraces() {
    this.ctx.save();
    
    const cellSize = CONFIG.GRID.CELL_SIZE;
    
    // Unique non-overlapping track segments to prevent transparency stacking at crossovers
    const uniqueTraces = [
      // 1. Common start track
      [
        { x: 0, y: 4 },
        { x: 4, y: 4 }
      ],
      // 2. Upper branch (Path 1)
      [
        { x: 4, y: 4 },
        { x: 4, y: 1 },
        { x: 10, y: 1 },
        { x: 10, y: 7 },
        { x: 14, y: 7 },
        { x: 14, y: 4 }
      ],
      // 3. Lower branch (Path 2)
      [
        { x: 2, y: 4 },
        { x: 2, y: 7 },
        { x: 8, y: 7 },
        { x: 8, y: 4 },
        { x: 12, y: 4 },
        { x: 12, y: 2 },
        { x: 14, y: 2 },
        { x: 14, y: 4 }
      ],
      // 4. Common end track
      [
        { x: 14, y: 4 },
        { x: 15, y: 4 }
      ]
    ];
    
    // 1. Draw base trace tracks (glowing baseline)
    this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)'; // glowing baseline
    this.ctx.lineWidth = 12;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    uniqueTraces.forEach(path => {
      path.forEach((pt, idx) => {
        const px = pt.x * cellSize + cellSize / 2;
        const py = pt.y * cellSize + cellSize / 2;
        if (idx === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      });
    });
    this.ctx.stroke();

    // 2. Draw narrow glowing center track
    this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    uniqueTraces.forEach(path => {
      path.forEach((pt, idx) => {
        const px = pt.x * cellSize + cellSize / 2;
        const py = pt.y * cellSize + cellSize / 2;
        if (idx === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      });
    });
    this.ctx.stroke();

    // Update and draw floating neon data packets
    this.dataPackets.forEach(packet => {
      const path = CONFIG.PATHS[packet.pathIdx];
      packet.progress += packet.speed * 0.05;
      
      if (packet.progress >= 1) {
        packet.progress = 0;
        packet.waypointIdx++;
        if (packet.waypointIdx >= path.length - 1) {
          packet.waypointIdx = 0;
        }
      }

      const p1 = path[packet.waypointIdx];
      const p2 = path[packet.waypointIdx + 1];

      const x1 = p1.x * cellSize + cellSize / 2;
      const y1 = p1.y * cellSize + cellSize / 2;
      const x2 = p2.x * cellSize + cellSize / 2;
      const y2 = p2.y * cellSize + cellSize / 2;

      // Interpolated position
      const px = x1 + (x2 - x1) * packet.progress;
      const py = y1 + (y2 - y1) * packet.progress;

      // Glow effect on drawing context
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = packet.color;
      this.ctx.fillStyle = packet.color;
      this.ctx.beginPath();
      this.ctx.arc(px, py, packet.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  drawKernelNode(hp, maxHp) {
    this.ctx.save();
    
    // Centered at cell (15, 3) & (15, 4) area on the right
    const kx = 15.5 * CONFIG.GRID.CELL_SIZE;
    const ky = 4.5 * CONFIG.GRID.CELL_SIZE;

    // Draw Kernel outer shielding
    const pulseGlow = Math.abs(Math.sin(this.pulseTimer)) * 10 + 5;
    this.ctx.shadowBlur = pulseGlow;
    this.ctx.shadowColor = '#00ffcc';
    
    // Shielding box
    this.ctx.strokeStyle = '#00ffcc';
    this.ctx.lineWidth = 3;
    this.ctx.fillStyle = '#0d1117';
    this.ctx.beginPath();
    this.ctx.rect(kx - 35, ky - 60, 70, 120);
    this.ctx.fill();
    this.ctx.stroke();

    // CPU Socket pins visual
    this.ctx.strokeStyle = '#ffb700';
    this.ctx.lineWidth = 1;
    this.ctx.shadowBlur = 0;
    for (let offset = -50; offset <= 50; offset += 10) {
      // Left side contacts
      this.ctx.beginPath();
      this.ctx.moveTo(kx - 35, ky + offset);
      this.ctx.lineTo(kx - 42, ky + offset);
      this.ctx.stroke();
      // Right side contacts
      this.ctx.beginPath();
      this.ctx.moveTo(kx + 35, ky + offset);
      this.ctx.lineTo(kx + 42, ky + offset);
      this.ctx.stroke();
    }

    // Inner Silicon chip
    const hpPct = hp / maxHp;
    const coreColor = hpPct > 0.6 ? '#00ffcc' : (hpPct > 0.3 ? '#ffb700' : '#ff0055');
    this.ctx.fillStyle = '#161b22';
    this.ctx.fillRect(kx - 20, ky - 40, 40, 80);

    // Glowing core
    this.ctx.shadowBlur = pulseGlow * 1.5;
    this.ctx.shadowColor = coreColor;
    this.ctx.fillStyle = coreColor;
    this.ctx.beginPath();
    this.ctx.arc(kx, ky, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Text indicators
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#8b9bb4';
    this.ctx.font = '9px "Share Tech Mono"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("KERNEL", kx, ky - 45);
    this.ctx.fillText("SYS_V2.0", kx, ky + 52);

    this.ctx.restore();
  }

  drawRangeRing(x, y, range, color) {
    this.ctx.save();
    
    // Always use cyber-cyan color for range rings to make the tint obvious
    const rgbValues = '0, 255, 204';
    
    this.ctx.strokeStyle = `rgba(${rgbValues}, 0.28)`; // increased stroke opacity
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([5, 3]); // longer dash, shorter gap
    this.ctx.beginPath();
    this.ctx.arc(x, y, range, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Glowing cyan fill overlay
    this.ctx.fillStyle = `rgba(${rgbValues}, 0.05)`; // increased fill opacity
    this.ctx.beginPath();
    this.ctx.arc(x, y, range, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawFloatingText(txt) {
    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0, Math.min(1, txt.life));
    this.ctx.fillStyle = txt.color;
    this.ctx.font = 'bold 13px "Share Tech Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = txt.color;
    this.ctx.fillText(txt.text, txt.x, txt.y);
    this.ctx.restore();
  }

  drawGridPreview(gridX, gridY, canAfford) {
    this.ctx.save();
    const size = CONFIG.GRID.CELL_SIZE;
    this.ctx.strokeStyle = canAfford ? '#00ffcc' : '#ff0055';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(gridX * size + 4, gridY * size + 4, size - 8, size - 8);
    this.ctx.restore();
  }

  drawActiveBuildCell(gridX, gridY) {
    this.ctx.save();
    const size = CONFIG.GRID.CELL_SIZE;
    const pulseGlow = Math.abs(Math.sin(this.pulseTimer)) * 6 + 4;
    this.ctx.strokeStyle = '#a020f0';
    this.ctx.shadowBlur = pulseGlow;
    this.ctx.shadowColor = '#a020f0';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 2]);
    this.ctx.strokeRect(gridX * size + 2, gridY * size + 2, size - 4, size - 4);
    this.ctx.restore();
  }

  drawTutorialTarget(gridX, gridY) {
    this.ctx.save();
    const size = CONFIG.GRID.CELL_SIZE;
    const x = gridX * size + size / 2;
    const y = gridY * size + size / 2;
    
    // Glowing neon cyan border around the cell
    const pulse = Math.abs(Math.sin(Date.now() * 0.005)) * 6 + 4;
    this.ctx.strokeStyle = '#00ffcc';
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowBlur = pulse;
    this.ctx.shadowColor = '#00ffcc';
    this.ctx.strokeRect(gridX * size + 4, gridY * size + 4, size - 8, size - 8);
    
    // Drifting down-pointing arrow
    const arrowOffset = Math.sin(Date.now() * 0.005) * 8 - 12;
    const arrowX = x;
    const arrowY = y - size / 2 + arrowOffset;
    
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.beginPath();
    this.ctx.moveTo(arrowX - 8, arrowY - 8);
    this.ctx.lineTo(arrowX + 8, arrowY - 8);
    this.ctx.lineTo(arrowX, arrowY);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.fillRect(arrowX - 3, arrowY - 20, 6, 12);
    
    this.ctx.restore();
  }

  drawTower(tower, isSelected) {
    this.ctx.save();
    
    const tx = tower.x;
    const ty = tower.y;
    const cellSize = CONFIG.GRID.CELL_SIZE;
    
    // Pulse animation factor
    const pulseGlow = Math.abs(Math.sin(this.pulseTimer)) * 6 + 3;

    // --- LEVEL 1: INTERFACE PAD ONLY ---
    if (!tower.hasCase) {
      // Draw a flat metal/copper PCB grounding pad
      this.ctx.fillStyle = '#101520';
      this.ctx.strokeStyle = isSelected ? '#00ffcc' : 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = isSelected ? 2 : 1;
      
      this.ctx.beginPath();
      this.ctx.roundRect(tx - 24, ty - 24, 48, 48, 4);
      this.ctx.fill();
      this.ctx.stroke();

      // Pin grid dots in the socket pad
      this.ctx.fillStyle = '#d4af37'; // gold pins
      for (let ox = -15; ox <= 15; ox += 10) {
        for (let oy = -15; oy <= 15; oy += 10) {
          // Leave center empty for CPU style
          if (Math.abs(ox) < 10 && Math.abs(oy) < 10) continue;
          this.ctx.beginPath();
          this.ctx.arc(tx + ox, ty + oy, 1.2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Small helper text
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(0, 255, 204, 0.8)';
        this.ctx.font = '8px "Share Tech Mono"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("INTERFACE PAD", tx, ty + 35);
      }
      this.ctx.restore();
      return;
    }

    // --- LEVEL 2: PC CASE & TOWER PILLAR ---
    // If it has a case, we draw a tall vertical Server Column rising upward!
    const isBasic = tower.caseType === 'basic';
    const towerW = isBasic ? 36 : 44;
    const towerH = isBasic ? 54 : 68;
    const baseH = 8; // height of bottom feet/base plate

    // 1. Draw base plate footprint
    this.ctx.fillStyle = '#0a0d14';
    this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(tx - towerW/2 - 4, ty + towerH/2 - baseH, towerW + 8, baseH, 2);
    this.ctx.fill();
    this.ctx.stroke();

    // 2. Draw Tower Body shadow & background
    this.ctx.save();
    this.ctx.shadowBlur = isSelected ? 15 : 6;
    this.ctx.shadowColor = tower.stats.glowColor;
    
    // Draw central vertical server column (rising from base)
    // We adjust drawing coordinates upwards (ty - towerH/2 to ty + towerH/2)
    const towerX = tx - towerW / 2;
    const towerY = ty - towerH / 2;
    
    this.ctx.fillStyle = tower.stats.color;
    this.ctx.strokeStyle = isSelected ? '#00ffcc' : 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = isSelected ? 2 : 1;
    this.ctx.beginPath();
    this.ctx.roundRect(towerX, towerY, towerW, towerH - 4, 4);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore(); // remove shadow

    // 3. Side vents / detailing on tower body
    this.ctx.fillStyle = '#080a0f';
    // Dark slot on the side
    this.ctx.fillRect(towerX + 4, towerY + 8, towerW - 8, towerH - 24);

    // Grille ribs inside side slot
    this.ctx.strokeStyle = '#161d29';
    this.ctx.lineWidth = 2;
    for (let gy = towerY + 12; gy < towerY + towerH - 20; gy += 6) {
      this.ctx.beginPath();
      this.ctx.moveTo(towerX + 6, gy);
      this.ctx.lineTo(towerX + towerW - 6, gy);
      this.ctx.stroke();
    }

    // 4. Status Indicator LED
    let ledColor = '#39ff14'; // active green
    if (tower.status === 'throttled') ledColor = '#ffb700'; // warning amber
    if (tower.status === 'broken') ledColor = '#ff0055'; // error red
    
    this.ctx.fillStyle = ledColor;
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = ledColor;
    this.ctx.beginPath();
    this.ctx.arc(tx, towerY + 8, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // 5. Draw Motherboard module highlights if installed
    if (tower.motherboard) {
      const mb = tower.motherboard;

      // Draw glowing motherboard circuit routes on the tower front face
      this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      // vertical trace running down the center
      this.ctx.moveTo(tx, towerY + 15);
      this.ctx.lineTo(tx, towerY + towerH - 18);
      this.ctx.stroke();

      // Branching traces
      this.ctx.beginPath();
      this.ctx.moveTo(tx, towerY + 25);
      this.ctx.lineTo(tx - 6, towerY + 31);
      this.ctx.moveTo(tx, towerY + 35);
      this.ctx.lineTo(tx + 6, towerY + 41);
      this.ctx.stroke();

      // CPU Glow module (Center-top core)
      if (mb.installed.cpu.length > 0) {
        const cpuComp = mb.installed.cpu[0];
        const cpuColor = cpuComp.stats.color || '#ff0055';
        this.ctx.shadowBlur = pulseGlow;
        this.ctx.shadowColor = cpuColor;
        this.ctx.fillStyle = cpuColor;
        this.ctx.fillRect(tx - 4, towerY + 16, 8, 8);
        this.ctx.shadowBlur = 0;
      }

      // RAM Glow modules (Purple dashes on the side)
      if (mb.installed.ram.length > 0) {
        this.ctx.fillStyle = '#a020f0';
        for (let r = 0; r < mb.installed.ram.length; r++) {
          const rx = tx - 12 + r * 3;
          this.ctx.fillRect(rx, towerY + 28, 1.5, 6);
        }
      }

      // GPU Glow modules (Gold plates on lower rack)
      if (mb.installed.gpu.length > 0) {
        this.ctx.fillStyle = '#ffb700';
        for (let g = 0; g < mb.installed.gpu.length; g++) {
          const gy = towerY + 38 + g * 4;
          this.ctx.fillRect(tx - 10, gy, 20, 2);
        }
      }

      // Cooler Glow module (Cyan block + tubes visual)
      if (mb.installed.cooler.length > 0) {
        this.ctx.strokeStyle = '#00ffcc';
        this.ctx.lineWidth = 1.2;
        // Drawing cooling loop tube wrapping server body
        this.ctx.beginPath();
        this.ctx.moveTo(tx - 12, towerY + 15);
        this.ctx.quadraticCurveTo(tx - 18, towerY + 25, tx - 12, towerY + 35);
        this.ctx.stroke();
      }
    }

    // 6. Spinning Exhaust Fan / Turbine at top of the server column
    if (tower.status !== 'broken') {
      this.ctx.save();
      // Translate to top of tower column
      this.ctx.translate(tx, towerY);
      
      // Draw top fan exhaust circle
      this.ctx.fillStyle = '#10141e';
      this.ctx.strokeStyle = isSelected ? '#00ffcc' : 'rgba(255,255,255,0.1)';
      this.ctx.lineWidth = 1;
      
      this.ctx.beginPath();
      // Draw flattened ellipse for 3D perspective top plate
      this.ctx.ellipse(0, 0, towerW / 2 - 2, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Spinning fan blades inside ellipse
      const rotationSpeed = tower.status === 'throttled' ? 0.05 : 0.2;
      const angle = (Date.now() * rotationSpeed) % (Math.PI * 2);
      this.ctx.rotate(angle);
      
      this.ctx.fillStyle = '#4f5b73';
      this.ctx.lineWidth = 1;
      for (let b = 0; b < 3; b++) {
        this.ctx.rotate((Math.PI * 2) / 3);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        // Draw thin blades fitting the ellipse profile
        this.ctx.ellipse(0, -3, 2, 8 * (isBasic ? 0.6 : 0.8), 0, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 7. Draw status overlay gauges (HP / Temperature)
    // HP bar (small under base)
    const barY = ty + towerH / 2 + 5;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(tx - 20, barY, 40, 2.5);
    
    const hpPct = tower.hp / tower.maxHp;
    this.ctx.fillStyle = hpPct > 0.5 ? '#39ff14' : '#ff0055';
    this.ctx.fillRect(tx - 20, barY, 40 * hpPct, 2.5);

    // Temperature bar (red thermometer gauge)
    const tempPct = (tower.heat - 30) / (tower.maxHeat - 30);
    const tempColor = tempPct > 0.7 ? '#ff0055' : (tempPct > 0.4 ? '#ffb700' : '#00ffcc');
    const thermoX = tx - towerW / 2 - 5;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(thermoX, ty - 15, 2.5, 30);
    
    this.ctx.fillStyle = tempColor;
    this.ctx.fillRect(thermoX, ty + 15 - 30 * tempPct, 2.5, 30 * tempPct);

    // Draw CORRUPTED text if broken
    if (tower.status === 'broken') {
      this.ctx.fillStyle = '#ff0055';
      this.ctx.font = '7px "Share Tech Mono"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText("CORRUPTED", tx, ty + towerH / 2 + 13);
    }

    // 8. Warning symbols for non-active states (unless selected/inspected)
    if (tower.status !== 'active' && !isSelected) {
      this.ctx.save();
      const badgeY = towerY - 14; // float 14px above tower top plate
      const badgeRadius = 9;
      
      let badgeColor = '#ffb700'; // Amber/Orange warning
      let symbol = '!';
      
      if (tower.status === 'broken') {
        badgeColor = '#ff0055'; // Red error
        symbol = '✖';
      } else if (tower.status === 'overloaded') {
        badgeColor = '#ffb700'; // Amber for power
        symbol = '⚡';
      } else if (tower.status === 'throttled') {
        badgeColor = '#ff8800'; // Orange for temperature
        symbol = '🔥';
      }
      
      // Draw circular container badge
      this.ctx.fillStyle = '#090b10';
      this.ctx.strokeStyle = badgeColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(tx, badgeY, badgeRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Shadow glow for symbol
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = badgeColor;
      
      // Symbol character
      this.ctx.fillStyle = badgeColor;
      this.ctx.font = 'bold 11px "Share Tech Mono"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(symbol, tx, badgeY);
      
      this.ctx.restore();
    }

    this.ctx.restore();
  }


  drawMalware(enemy) {
    this.ctx.save();
    
    // Apply jittery coordinate offset from internal glitch simulation
    const ex = enemy.x + enemy.glitchX;
    const ey = enemy.y + enemy.glitchY;
    const size = enemy.size;

    this.ctx.shadowColor = enemy.color;
    this.ctx.shadowBlur = 10;
    
    // Draw glitch trail lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(ex, ey);
    this.ctx.lineTo(ex - enemy.glitchX * 3, ey - enemy.glitchY * 3);
    this.ctx.stroke();

    // Geometric structure based on type
    this.ctx.fillStyle = enemy.color;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;

    if (enemy.type === 'glitch') {
      // Hexagonal particle
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = ex + Math.cos(angle) * (size / 2);
        const hy = ey + Math.sin(angle) * (size / 2);
        if (i === 0) this.ctx.moveTo(hx, hy);
        else this.ctx.lineTo(hx, hy);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else if (enemy.type === 'worm') {
      // Dual interlocking diamonds
      this.ctx.beginPath();
      this.ctx.moveTo(ex, ey - size / 2);
      this.ctx.lineTo(ex + size / 3, ey);
      this.ctx.lineTo(ex, ey + size / 2);
      this.ctx.lineTo(ex - size / 3, ey);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(ex, ey, size / 5, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Trojan: Octagram / spiky ring
      this.ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        const rad = i % 2 === 0 ? size / 2 : size / 4;
        const tx = ex + Math.cos(angle) * rad;
        const ty = ey + Math.sin(angle) * rad;
        if (i === 0) this.ctx.moveTo(tx, ty);
        else this.ctx.lineTo(tx, ty);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    // Health Bar (Floating above enemy)
    this.ctx.shadowBlur = 0;
    const barY = ey - size / 2 - 8;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(ex - 15, barY, 30, 3);
    
    const hpPct = enemy.hp / enemy.maxHp;
    this.ctx.fillStyle = enemy.color;
    this.ctx.fillRect(ex - 15, barY, 30 * hpPct, 3);

    this.ctx.restore();
  }

  drawProjectile(proj) {
    this.ctx.save();
    
    // Draw neon glowing data packet bullet
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#00ffcc';
    
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.beginPath();
    this.ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
    this.ctx.fill();

    // Laser trails
    this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(proj.x, proj.y);
    
    // Draw short line backward relative to vector
    if (proj.target) {
      const dx = proj.target.x - proj.x;
      const dy = proj.target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        this.ctx.lineTo(proj.x - (dx / dist) * 15, proj.y - (dy / dist) * 15);
      }
    }
    this.ctx.stroke();

    this.ctx.restore();
  }
}
export default GameRenderer;
