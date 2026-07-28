export class TutorialController {
  constructor(game) {
    this.game = game;
    this.levelId = game.currentLevel ? game.currentLevel.id : 1;
    this.step = 0;
    
    if (this.levelId === 2) {
      this.buys = {
        socket: 0,
        'case-basic': 0,
        'mb-mini': 0,
        gpu: 0,
        ssd: 0,
        'pcie-m2': 0
      };
    } else if (this.levelId === 3) {
      this.buys = {
        repair: 0,
        cooler: 0,
        socket: 0,
        'case-basic': 0,
        'mb-mini': 0,
        cpu: 0,
        ram: 0,
        psu: 0
      };
    } else if (this.levelId === 4) {
      this.buys = {
        psu: 0,
        repair: 0,
        socket: 0,
        'case-basic': 0,
        'mb-mini': 0,
        'cpu-extreme': 0,
        cooler: 0,
        ram: 0
      };
    } else {
      this.buys = {
        socket: 0,
        'case-basic': 0,
        'mb-mini': 0,
        cpu: 0
      };
    }

    // Add one-time click listener to sysop-panel to close step 0 and step 2 dialogs
    const sysopPanel = document.getElementById('sysop-panel');
    if (sysopPanel) {
      const advanceFn = () => {
        if ((this.levelId === 3 || this.levelId === 4) && (this.step === 0 || this.step === 2)) {
          this.step++;
          this.refreshActiveInstruction();
        } else if (this.levelId === 2 && this.step === 0) {
          this.step = 1;
          this.refreshActiveInstruction();
        }
      };
      sysopPanel.removeEventListener('click', advanceFn);
      sysopPanel.addEventListener('click', advanceFn);
    }
  }

  // Refreshes dialogue text to match current step context
  refreshActiveInstruction() {
    const sysop = this.game.sysop;
    if (!sysop) return;

    if (this.levelId === 2) {
      switch(this.step) {
        case 0:
          sysop.showMessage("SEC-BIOS Sector 02 diagnostics complete. It is a peaceful mining partition with zero malware threads! We will construct two mining rigs: one equipped with a GPU to mine <span class='sysop-highlight-hash'>Hashes</span>, and a second equipped with SSDs to mine <span class='sysop-highlight-chia'>Chia</span>. But remember, the Mini-ITX motherboard only has 1 native M.2 slot! To fit a second SSD, we must use a PCIE M.2 Adapter card in the PCIE (GPU) lane. Click this dialogue panel to close it and review the plan.");
          break;
        case 1:
          sysop.showMessage("We have 350 QB. First, BUY the required parts from the hotbar: 2x <span class='sysop-highlight-anchor'>GRID ANCHOR</span>, 2x <span class='sysop-highlight-case'>CASE(ITX)</span>, 2x <span class='sysop-highlight-mb'>MB(ITX)</span>, 1x <span class='sysop-highlight-mb'>GPU</span>, 2x <span class='sysop-highlight-anchor'>SSD</span>, and 1x <span class='sysop-highlight-cpu'>M.2 ADAPTER</span>.");
          break;
        case 2:
          sysop.showMessage("Parts acquired! Click the 'MODE' toggle button on the left of the hotbar to switch to BUILD mode.");
          break;
        case 3:
          sysop.showMessage("First, assemble your GPU miner machine! Place an Anchor, Case, Motherboard, and slot in the GPU. This rig will draw exactly 40W (matching the Motherboard's native 40W capacity, so no PSU is needed in this sector!).");
          break;
        case 4:
          sysop.showMessage("First machine mining <span class='sysop-highlight-hash'>Hashes</span>! Now place the second Anchor, Case, and Motherboard. First, install one SSD directly into the motherboard's native M.2 slot. Then install the M.2 ADAPTER card into the PCIE slot (GPU slot) to add 4 extra M.2 slots, and finally slot the second SSD in!");
          break;
        case 5:
          sysop.showMessage("Excellent! Both rigs are mining. Trade your accumulated <span class='sysop-highlight-hash'>Hashes</span> and <span class='sysop-highlight-chia'>Chia</span> on the left-side MARKET EXCHANGE to reach the new target quota of 450 QB! All shop limits are now lifted: you can buy more parts to build more machines to mine even faster!");
          break;
      }
    } else if (this.levelId === 3) {
      switch(this.step) {
        case 0:
          sysop.showMessage("SYS-OP URGENT ALERT! Sector 03: Liquid Core has a pre-existing corrupted server stack at coordinate [8, 3]! It completely melted because it has a CPU and RAM, but NO cooling! We need to repair it, and then deploy active cooling loops immediately. Click this dialogue panel to close it and review the plan.");
          break;
        case 1:
          sysop.showMessage("First, we must prepare for rescue operations. Switch to BUY mode and BUY 1x <span class='sysop-highlight-repair'>REPAIR</span> kit and 1x <span class='sysop-highlight-cooler'>COOLER</span> (Liquid AIO Cooler) from the hotbar!");
          break;
        case 2:
          sysop.showMessage("SEC-LOG: Applying a REPAIR kit grants the server stack a temporary 10-second invulnerability shield! It will take zero damage from thermal overload or malware attacks for 10 seconds, giving you a buffer to install cooling. Click this panel to acknowledge!");
          break;
        case 3:
          sysop.showMessage("Now click the MODE toggle to switch to BUILD mode. Select coordinate cell [8, 3], apply the REPAIR kit, and immediately slot the Liquid AIO Cooler onto it before the 10-second shield expires!");
          break;
        case 4:
          sysop.showMessage("The Liquid Cooler is online, actively dissipating heat! The temperature is dropping to safe levels. Now, let's see if you remember how to construct a server rig from scratch. Go ahead and buy the parts to build a second, fully-cooled machine to cover this winding pathway!");
          break;
        case 5:
          sysop.showMessage("Excellent! Both machines are armed, active, and fully cooled. Click INITIALIZE PROTOCOL to compile the first wave of Trojan worms and glitches!");
          break;
        case 6:
          sysop.showMessage("Glitches and Trojan payloads detected! Stay vigilant—heavy malware loads generate massive heat spikes when fired. Keep them cool!");
          break;
      }
    } else if (this.levelId === 4) {
      switch(this.step) {
        case 0:
          sysop.showMessage("SYS-OP CRITICAL ALERT! Sector 04: Power Distribution. The pre-existing rig at cell [7, 4] is completely crashed because it is OVERLOADED on power! It runs a Core i9 Extreme CPU, 2x RAM, and Cooler drawing 60W, but the basic motherboard capacity is only 40W! We must install a PSU first to solve this, and then repair it. Click this panel to close it and review the plan.");
          break;
        case 1:
          sysop.showMessage("First, we must prepare to bring the server back online. Switch to BUY mode and BUY 1x <span class='sysop-highlight-anchor'>PSU</span> (80+ Platinum PSU) and 1x <span class='sysop-highlight-repair'>REPAIR</span> kit from the hotbar!");
          break;
        case 2:
          sysop.showMessage("SEC-LOG: Installing a PSU supplies +110W of electricity to the motherboard and reduces ambient heat generation by 35%. Click this dialogue panel to acknowledge!");
          break;
        case 3:
          sysop.showMessage("Now click the MODE toggle to switch to BUILD mode. Select coordinate cell [7, 4], slot in the PSU first to resolve the motherboard overload, then apply the REPAIR kit to reboot the machine!");
          break;
        case 4:
          sysop.showMessage("Server at [7, 4] restored and stable! Excellent work. Now you are on your own—buy and build whatever components you need to defend this dual-lane grid. Build powerful Core i9 rigs with RAM for massive DPS, and survive all 3 waves!");
          break;
        case 5:
          sysop.showMessage("Malware threads compiling! Keep an eye on system wattage, heat levels, and Kernel integrity across all 3 waves!");
          break;
      }
    } else {
      switch(this.step) {
        case 0:
          sysop.showMessage("SEC-BIOS diagnostics initialized. We need firewall servers to filter malware! A functional server requires a stack: a <span class='sysop-highlight-anchor'>GRID ANCHOR</span> (creating an interface to place a case), a <span class='sysop-highlight-case'>CASE</span> (for airflow & structure), a <span class='sysop-highlight-mb'>MOTHERBOARD</span> (to route power/signals), and a <span class='sysop-highlight-cpu'>CPU</span> (your laser firewall core). First, BUY 1x of each required component from the hotbar to prepare for assembly.");
          break;
        case 1:
          sysop.showMessage("Parts obtained. Now click the 'MODE' toggle button on the left of the hotbar to switch to BUILD mode.");
          break;
        case 2:
          sysop.showMessage("Select the highlighted grid cell [9, 5] on the motherboard to commence assembly.");
          break;
        case 3:
          sysop.showMessage("Place down the <span class='sysop-highlight-anchor'>GRID ANCHOR</span> on cell [9, 5]. Click the <span class='sysop-highlight-anchor'>GRID ANCHOR</span> button on the hotbar.");
          break;
        case 4:
          sysop.showMessage("Anchor is down. Now slot the <span class='sysop-highlight-case'>CASE(ITX)</span> chassis onto the <span class='sysop-highlight-anchor'>Grid Anchor</span>.");
          break;
        case 5:
          sysop.showMessage("Chassis locked. Now install the Mini-ITX motherboard (<span class='sysop-highlight-mb'>MB(ITX)</span>) to trace connections.");
          break;
        case 6:
          sysop.showMessage("Motherboard secured. Slot in the Core i5 CPU (<span class='sysop-highlight-cpu'>CPU(I5)</span>) to arm the defensive lasers.");
          break;
        case 7:
          sysop.showMessage("Tower fully armed! Power load is safe (20W / 40W capacity). Now click INITIALIZE PROTOCOL on the top-right to run the diagnostic wave.");
          break;
        case 8:
          sysop.showMessage("Glitches detected! Target systems active. Keep the Kernel safe from corruption!");
          break;
      }
    }
  }

  // Intercept BUY commands to enforce sequence
  canBuyItem(slotName) {
    if (this.levelId === 2) {
      if (this.step === 5) {
        return true; // Let them buy whatever they want in the exchange sandbox phase!
      }
      if (this.step === 0) {
        this.step = 1;
        this.refreshActiveInstruction();
      }
      if (this.step !== 1) {
        this.game.sysop.showError("UNAUTHORIZED ACTION. ALL REQUIRED COMPONENTS ALREADY ACQUIRED. PROCEED WITH ASSEMBLY.");
        return false;
      }
      const limits = { socket: 2, 'case-basic': 2, 'mb-mini': 2, gpu: 1, ssd: 2, 'pcie-m2': 1 };
      if (!(slotName in limits)) {
        this.game.sysop.showError("ITEM RESTRICTED. THIS COMPONENT IS LOCKED UNTIL THIS TUTORIAL IS COMPLETED.");
        return false;
      }
      if (this.buys[slotName] >= limits[slotName]) {
        this.game.sysop.showError(`ALREADY ACQUIRED. YOU ONLY NEED ${limits[slotName]}x ${slotName.toUpperCase()} FOR THIS TUTORIAL.`);
        return false;
      }
      return true;
    } else if (this.levelId === 3) {
      if (this.step === 5 || this.step === 6) {
        return true; // Let them buy freely in combat sandbox phase
      }
      if (this.step === 0) {
        this.step = 1;
        this.refreshActiveInstruction();
      }
      if (this.step === 1) {
        const limits = { repair: 1, cooler: 1 };
        if (!(slotName in limits)) {
          this.game.sysop.showError("SEQUENCE VIOLATION. BUY A REPAIR KIT AND A LIQUID COOLER FIRST!");
          return false;
        }
        if (this.buys[slotName] >= limits[slotName]) {
          this.game.sysop.showError(`ALREADY ACQUIRED. YOU ONLY NEED 1x ${slotName.toUpperCase()} FOR THIS PHASE.`);
          return false;
        }
        return true;
      }
      if (this.step === 2 || this.step === 3) {
        this.game.sysop.showError("SEQUENCE VIOLATION. REPAIR AND COOL THE DAMAGED MACHINE AT [8, 3] BEFORE BUYING ANYTHING ELSE.");
        return false;
      }
      if (this.step === 4) {
        const limits = { socket: 1, 'case-basic': 1, 'mb-mini': 1, cpu: 1, cooler: 2, ram: 2, repair: 2 };
        if (!(slotName in limits)) {
          this.game.sysop.showError("ITEM RESTRICTED. CHOOSE A BASIC COMPONENT SUITABLE FOR ASSEMBLING THE TOWER RIG.");
          return false;
        }
        if (this.buys[slotName] >= limits[slotName]) {
          if (slotName === 'ram') {
            this.game.sysop.showError("[FATAL ERROR] MEMORY DENSITY EXCESS. Two RAM blocks are more than enough memory buffers for this system. Do not buy a third!");
          } else if (slotName === 'repair') {
            this.game.sysop.showError("[FATAL ERROR] SPARE PARTS LIMIT. You already have one spare repair kit in reserve. Do not buy another!");
          } else {
            this.game.sysop.showError(`[FATAL ERROR] DUPLICATE ACQUISITION REJECTED. HEY! YOU ALREADY HAVE ${limits[slotName]}x ${slotName.toUpperCase()}! You only need one of these components to assemble this new computer. Don't waste Qubits!`);
          }
          return false;
        }
        return true;
      }
      return false;
    } else if (this.levelId === 4) {
      if (this.step >= 4) {
        return true; // Complete sandbox freedom after fixing the pre-placed rig!
      }
      if (this.step === 0) {
        this.step = 1;
        this.refreshActiveInstruction();
      }
      if (this.step === 1) {
        const limits = { psu: 1, repair: 1 };
        if (!(slotName in limits)) {
          this.game.sysop.showError("SEQUENCE VIOLATION. BUY A PSU AND A REPAIR KIT FIRST!");
          return false;
        }
        if (this.buys[slotName] >= limits[slotName]) {
          this.game.sysop.showError(`ALREADY ACQUIRED. YOU ONLY NEED 1x ${slotName.toUpperCase()} FOR THIS INITIAL PHASE.`);
          return false;
        }
        return true;
      }
      if (this.step === 2 || this.step === 3) {
        this.game.sysop.showError("SEQUENCE VIOLATION. RESOLVE THE POWER OVERLOAD AND REBOOT TOWER [7, 4] FIRST.");
        return false;
      }
      return false;
    }

    if (this.step !== 0) {
      this.game.sysop.showError("UNAUTHORIZED ACTION. ALL REQUIRED COMPONENTS ALREADY ACQUIRED. PROCEED WITH ASSEMBLY.");
      return false;
    }

    const limits = { socket: 1, 'case-basic': 1, 'mb-mini': 1, cpu: 1 };
    if (!(slotName in limits)) {
      this.game.sysop.showError("ITEM RESTRICTED. THIS COMPONENT IS LOCKED UNTIL DIAGNOSTICS LEVEL IS COMPLETED.");
      return false;
    }

    if (this.buys[slotName] >= limits[slotName]) {
      this.game.sysop.showError(`ALREADY ACQUIRED. YOU ONLY NEED 1x ${slotName.toUpperCase()} FOR THIS TEST.`);
      return false;
    }

    return true;
  }

  // Intercept mode toggling
  canToggleMode() {
    const goingToBuild = (this.game.uiMode === 'BUY');

    if (this.levelId === 2) {
      if (this.step === 5) {
        return true;
      }
      if (goingToBuild) {
        if (this.step === 0) {
          this.step = 1;
          this.refreshActiveInstruction();
          this.game.sysop.showError("CRITICAL EXCEPTION. BUY THE ENTIRE COMPONENT SUITE BEFORE CHANGING MODES.");
          return false;
        }
        if (this.step === 1) {
          const hasAll = this.buys.socket >= 2 && this.buys['case-basic'] >= 2 && this.buys['mb-mini'] >= 2 &&
                         this.buys.gpu >= 1 && this.buys.ssd >= 2 && this.buys['pcie-m2'] >= 1;
          if (!hasAll) {
            this.game.sysop.showError("CRITICAL EXCEPTION. BUY THE ENTIRE COMPONENT SUITE BEFORE CHANGING MODES.");
            return false;
          }
        }
      }
      return true;
    } else if (this.levelId === 3) {
      if (this.step === 5 || this.step === 6) {
        return true;
      }
      if (goingToBuild) {
        if (this.step === 0 || this.step === 1) {
          this.game.sysop.showError("CRITICAL EXCEPTION. BUY BOTH THE REPAIR KIT AND LIQUID COOLER FIRST.");
          return false;
        }
      }
      return true;
    } else if (this.levelId === 4) {
      if (this.step >= 4) {
        return true;
      }
      if (goingToBuild) {
        if (this.step === 0 || this.step === 1) {
          this.game.sysop.showError("CRITICAL EXCEPTION. BUY BOTH THE PSU AND REPAIR KIT FIRST.");
          return false;
        }
      }
      return true;
    }

    if (goingToBuild && this.step === 0) {
      const hasAll = this.buys.socket >= 1 && this.buys['case-basic'] >= 1 && this.buys['mb-mini'] >= 1 && this.buys.cpu >= 1;
      if (!hasAll) {
        this.game.sysop.showError("CRITICAL EXCEPTION. BUY THE ENTIRE COMPONENT SUITE BEFORE CHANGING MODES.");
        return false;
      }
    }
    return true;
  }

  // Intercept cell clicks
  canClickCell(col, row) {
    // Intercept path placements and yell
    if (this.game.isCellOnPath(col, row)) {
      this.game.sysop.showError("[FATAL ERROR] PATHWAY SELECTION DETECTED. RETRYING... NOPE, I CAN'T DO THIS. HEY, ALIEN BRAIN! LOOK AT THE PATH! YOU JUST TRIED TO BOLT HARDWARE DIRECTLY ONTO THE MALWARE TRACK! DO YOU THINK WORMS KNOCK POLITELY?! CHOOSE A CLEAN CELL!");
      return false;
    }

    // Intercept grid border check (Kernel center col 15)
    if (col >= 15) {
      this.game.sysop.showError("[FATAL ERROR] COMPONENT ROUTING REFUSED. SEC-LOG: UNAUTHORIZED INTRUSION OVER KERNEL ADDRESS SPACE. HEY! STOP TAP-TAP-TAPPING MY HEAD! YOU CANNOT BUILD HARDWARE DIRECTLY ON TOP OF THE KERNEL NODE!");
      return false;
    }

    if (this.levelId === 2) {
      if (this.step < 3) {
        this.game.sysop.showError("SEQUENCE VIOLATION. COMPLETE CURRENT OBJECTIVE BEFORE GRID INTERACTION.");
        return false;
      }
      return true; // Let them build anywhere in the sandbox!
    } else if (this.levelId === 3) {
      if (this.step < 3) {
        this.game.sysop.showError("SEQUENCE VIOLATION. COMPLETE CURRENT OBJECTIVE BEFORE GRID INTERACTION.");
        return false;
      }
      if (this.step === 3 && (col !== 8 || row !== 3)) {
        this.game.sysop.showError("GRID DEPLOYMENT REJECTED. INTERRUPTED ADDRESS ACCESS. APPLY REPAIR AND LIQUID COOLING TO [8, 3] FIRST!");
        return false;
      }
      return true;
    } else if (this.levelId === 4) {
      if (this.step < 3) {
        this.game.sysop.showError("SEQUENCE VIOLATION. COMPLETE CURRENT OBJECTIVE BEFORE GRID INTERACTION.");
        return false;
      }
      if (this.step === 3 && (col !== 7 || row !== 4)) {
        this.game.sysop.showError("GRID DEPLOYMENT REJECTED. INTERRUPTED ADDRESS ACCESS. DEPLOY THE PSU AND REPAIR KIT TO CELL [7, 4] FIRST!");
        return false;
      }
      return true;
    }

    if (this.step < 2) {
      this.game.sysop.showError("SEQUENCE VIOLATION. COMPLETE CURRENT OBJECTIVE BEFORE GRID INTERACTION.");
      return false;
    }

    // Force Level 1 placement strictly to the highlighted motherboard grid cell [9, 5]
    if (col !== 9 || row !== 5) {
      this.game.sysop.showError("[FATAL ERROR] INACCURATE GRID INDEX. ASSEMBLY LOGS DECLARE TARGET COORDINATE INVALID. SERIOUSLY, IT'S NOT THAT HARD! I LITERALLY DREW A GLOWING ARROW DRIFTING OVER GRID INDEX [9, 5] FOR YOU! CLICK COORDINATE [9, 5]!");
      return false;
    }

    return true;
  }

  // Intercept BUILD item installations
  canBuildItem(item, col, row) {
    if (this.levelId === 2 && this.step === 5) {
      return true; // Lifting all constraints in the sandbox phase
    }
    if ((this.levelId === 3 && (this.step === 5 || this.step === 6)) || (this.levelId === 4 && this.step >= 4)) {
      return true; // Lifting all constraints in the sandbox/combat phase
    }

    const tower = this.game.towers.find(t => t.gridX === col && t.gridY === row);

    // Foundation pad check
    if (item !== 'socket' && (!tower || !tower.hasCase && item !== 'case-basic')) {
      if (item === 'case-basic' && !tower) {
        this.game.sysop.showError("[FATAL ERROR] STRUCTURAL ANOMALY. CHASSIS GROUNDING FAILURE. UGH, WHAT ARE YOU DOING?! YOU JUST TRIED TO SOLDER A METAL <span class='sysop-highlight-case'>CHASSIS</span> DIRECTLY INTO RAW FIBERGLASS! THERE IS NO FOUNDATION! START WITH THE <span class='sysop-highlight-anchor'>GRID ANCHOR</span>!");
        return false;
      }
      if (item === 'mb-mini' && tower && !tower.hasCase) {
        this.game.sysop.showError("[FATAL ERROR] CIRCUIT SIGNAL SCATTER. MOTHERBOARD PIN CONFIGURATION EXPOSED. ALRIGHT, WHO TAUGHT YOU ENGINEERING?! YOU JUST PLACED A <span class='sysop-highlight-mb'>MOTHERBOARD</span> ON A BARE ANCHOR WITH NO <span class='sysop-highlight-case'>CASE</span>! THERE IS NO CHASSIS! NO AIRFLOW! INSTALL A <span class='sysop-highlight-case'>CASE</span> FIRST!");
        return false;
      }
      if ((item === 'cpu' || item === 'cpu-extreme') && (!tower || !tower.motherboard)) {
        this.game.sysop.showError("[FATAL ERROR] SILICON PIN ALIGNMENT FAILED. CORE INTEGRITY COMPROMISED. SERIOUSLY?! WHERE DO YOU THINK THE CPU PLUGS INTO?! THIN AIR?! MOTHERBOARDS HOUSE THE PROCESSOR CORES! DEPLOY A MOTHERBOARD FIRST!");
        return false;
      }
    }

    if (this.levelId === 2) {
      if (item === 'ssd') {
        if (!tower || !tower.motherboard) {
          this.game.sysop.showError("[FATAL ERROR] STORAGE MOUNT FAILURE. SERIOUSLY?! SSDs PLUG INTO M.2 SLOTS ON A MOTHERBOARD! DEPLOY A MOTHERBOARD FIRST!");
          return false;
        }
        if (!tower.motherboard.hasSlotAvailable('ssd')) {
          this.game.sysop.showError("[FATAL ERROR] OUT OF M.2 SLOTS. Mini-ITX motherboard only has 1 native M.2 slot! Install a PCIE M.2 Adapter card into the PCIE (GPU) lane first to expand capacity by +4 M.2 slots!");
          return false;
        }
      }
      if (item === 'pcie-m2') {
        if (!tower || !tower.motherboard) {
          this.game.sysop.showError("[FATAL ERROR] ADAPTER INTERFACE MISALIGNMENT. PCIE CARDS PLUG INTO A MOTHERBOARD! DEPLOY A MOTHERBOARD FIRST!");
          return false;
        }
        if (!tower.motherboard.hasSlotAvailable('pcie-m2')) {
          this.game.sysop.showError("[FATAL ERROR] NO PCIE SLOTS AVAILABLE. THE PCIE EXPANSION LANE IS ALREADY OCCUPIED! CHOOSE AN EMPTY MOTHERBOARD!");
          return false;
        }
      }
      return true;
    } else if (this.levelId === 3) {
      if (this.step === 3 && item !== 'repair' && item !== 'cooler') {
        this.game.sysop.showError("SEQUENCE VIOLATION. APPLY THE REPAIR KIT AND LIQUID COOLER ON CELL [8, 3]!");
        return false;
      }
      return true;
    } else if (this.levelId === 4) {
      if (this.step === 3 && item !== 'psu' && item !== 'repair') {
        this.game.sysop.showError("SEQUENCE VIOLATION. INSTALL THE PSU AND APPLY THE REPAIR KIT ON CELL [7, 4] FIRST!");
        return false;
      }
      return true;
    }

    // Ensure they follow the tutorial structure step-by-step for Level 1
    if (this.step === 3 && item !== 'socket') {
      this.game.sysop.showError("SEQUENCE FAULT. PLACE THE <span class='sysop-highlight-anchor'>GRID ANCHOR</span> FIRST.");
      return false;
    }
    if (this.step === 4 && item !== 'case-basic') {
      this.game.sysop.showError("SEQUENCE FAULT. PLACE THE <span class='sysop-highlight-case'>MINI TOWER CASE</span> ON THE <span class='sysop-highlight-anchor'>GRID ANCHOR</span>.");
      return false;
    }
    if (this.step === 5 && item !== 'mb-mini') {
      this.game.sysop.showError("SEQUENCE FAULT. INSTALL THE <span class='sysop-highlight-mb'>MINI-ITX MOTHERBOARD</span> ON THE <span class='sysop-highlight-case'>CASE</span>.");
      return false;
    }
    if (this.step === 6 && item !== 'cpu') {
      this.game.sysop.showError("SEQUENCE FAULT. INSTALL THE <span class='sysop-highlight-cpu'>CORE I5 PROCESSOR</span> TO ARM THE LASERS.");
      return false;
    }

    return true;
  }

  // Handle action callbacks to advance tutorial steps
  onActionTriggered(actionType, data) {
    if (this.levelId === 2) {
      if (actionType === 'buy') {
        this.buys[data]++;
        const hasAll = this.buys.socket >= 2 && this.buys['case-basic'] >= 2 && this.buys['mb-mini'] >= 2 &&
                       this.buys.gpu >= 1 && this.buys.ssd >= 2 && this.buys['pcie-m2'] >= 1;
        if (hasAll && (this.step === 0 || this.step === 1)) {
          this.step = 2;
          this.refreshActiveInstruction();
        }
      } 
      else if (actionType === 'toggleMode') {
        if (this.game.uiMode === 'BUILD' && this.step === 2) {
          this.step = 3;
          this.refreshActiveInstruction();
        }
      } 
      else if (actionType === 'buildItem') {
        if (data === 'gpu' && this.step === 3) {
          this.step = 4;
          this.refreshActiveInstruction();
        } 
        else if (data === 'ssd' && this.step === 4) {
          // Count active SSDs on board to advance when both are installed
          let ssdCount = 0;
          this.game.towers.forEach(t => {
            if (t.motherboard) {
              ssdCount += t.motherboard.installed.ssd.length;
            }
          });
          if (ssdCount >= 2) {
            this.step = 5;
            this.refreshActiveInstruction();
          }
        }
      }
      return;
    } else if (this.levelId === 3) {
      if (actionType === 'buy') {
        this.buys[data]++;
        if (this.step === 1 && this.buys.repair >= 1 && this.buys.cooler >= 1) {
          this.step = 2;
          this.refreshActiveInstruction();
        }
      }
      else if (actionType === 'toggleMode') {
        if (this.game.uiMode === 'BUILD' && this.step === 2) {
          this.step = 3;
          this.refreshActiveInstruction();
        }
      }
      else if (actionType === 'buildItem') {
        if (this.step === 3) {
          // Check if both repair and cooler are built on [8, 3]!
          const tower = this.game.towers.find(t => t.gridX === 8 && t.gridY === 3);
          if (tower && tower.status !== 'broken' && tower.motherboard && tower.motherboard.installed.cooler.length > 0) {
            this.step = 4;
            this.refreshActiveInstruction();
            this.game.updateHUD(); // ensures HUD updates next wave button visibility
          }
        }
        else if (this.step === 4) {
          // Count active cooled machines to advance
          let cooledMachines = 0;
          this.game.towers.forEach(t => {
            if (t.motherboard) {
              const hasCpu = t.motherboard.installed.cpu.length > 0;
              const hasCooler = t.motherboard.installed.cooler.length > 0;
              if (hasCpu && hasCooler) {
                cooledMachines++;
              }
            }
          });
          if (cooledMachines >= 2) {
            this.step = 5;
            this.refreshActiveInstruction();
            this.game.updateHUD(); // shows initialize wave button!
          }
        }
      }
      else if (actionType === 'startWave') {
        if (this.step === 5) {
          this.step = 6;
          this.refreshActiveInstruction();
        }
      }
      return;
    } else if (this.levelId === 4) {
      if (actionType === 'buy') {
        this.buys[data]++;
        if (this.step === 1 && this.buys.psu >= 1 && this.buys.repair >= 1) {
          this.step = 2;
          this.refreshActiveInstruction();
        }
      }
      else if (actionType === 'toggleMode') {
        if (this.game.uiMode === 'BUILD' && this.step === 2) {
          this.step = 3;
          this.refreshActiveInstruction();
        }
      }
      else if (actionType === 'buildItem') {
        if (this.step === 3) {
          // Check if overloaded tower at [7, 4] is restored (has psu installed, not broken, active)
          const tower = this.game.towers.find(t => t.gridX === 7 && t.gridY === 4);
          if (tower && tower.status === 'active' && tower.motherboard && tower.motherboard.installed.psu.length > 0) {
            this.step = 4;
            this.refreshActiveInstruction();
            this.game.updateHUD(); // reveals initialize protocol wave button immediately!
          }
        }
      }
      else if (actionType === 'startWave') {
        if (this.step === 4) {
          this.step = 5;
          this.refreshActiveInstruction();
        }
      }
      else if (actionType === 'waveComplete') {
        if (data === 2) {
          this.game.sysop.showMessage("SYS-OP WARNING! CRITICAL INTRUSION IMMINENT! Wave 3 contains a massive Trojan payload assault! Ensure you have built high-powered rigs to hold the dual lanes!");
        }
      }
      return;
    }

    if (actionType === 'buy') {
      this.buys[data]++;
      
      // If all parts are bought, move to Step 1
      const hasAll = this.buys.socket >= 1 && this.buys['case-basic'] >= 1 && this.buys['mb-mini'] >= 1 && this.buys.cpu >= 1;
      if (hasAll && this.step === 0) {
        this.step = 1;
        this.refreshActiveInstruction();
      }
    } 
    else if (actionType === 'toggleMode') {
      if (this.game.uiMode === 'BUILD' && this.step === 1) {
        this.step = 2;
        this.refreshActiveInstruction();
      }
    } 
    else if (actionType === 'selectCell') {
      if (this.step === 2) {
        this.step = 3;
        this.refreshActiveInstruction();
      }
    } 
    else if (actionType === 'buildItem') {
      if (data === 'socket' && this.step === 3) {
        this.step = 4;
        this.refreshActiveInstruction();
      } 
      else if (data === 'case-basic' && this.step === 4) {
        this.step = 5;
        this.refreshActiveInstruction();
      } 
      else if (data === 'mb-mini' && this.step === 5) {
        this.step = 6;
        this.refreshActiveInstruction();
      } 
      else if (data === 'cpu' && this.step === 6) {
        this.step = 7;
        this.refreshActiveInstruction();
      }
    } 
    else if (actionType === 'startWave') {
      if (this.step === 7) {
        this.step = 8;
        this.refreshActiveInstruction();
      }
    }
  }
}
export default TutorialController;
