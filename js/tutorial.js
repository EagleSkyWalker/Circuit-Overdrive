export class TutorialController {
  constructor(game) {
    this.game = game;
    this.step = 0;
    
    // Track if each required item was bought in Step 0
    this.buys = {
      socket: 0,
      'case-basic': 0,
      'mb-mini': 0,
      cpu: 0
    };
  }

  // Refreshes dialogue text to match current step context
  refreshActiveInstruction() {
    const sysop = this.game.sysop;
    if (!sysop) return;

    switch(this.step) {
      case 0:
        sysop.showMessage("SYS-OP: PROTOCOL Diagnostics sweep initialized. We need defense towers! First, BUY the required parts from the hotbar: 1x SOCKET (Interface Pad), 1x CASE(ITX), 1x MB(ITX), and 1x CPU(I5).");
        break;
      case 1:
        sysop.showMessage("SYS-OP: Parts obtained. Now click the 'MODE' toggle button on the left of the hotbar to switch to BUILD mode.");
        break;
      case 2:
        sysop.showMessage("SYS-OP: Select the highlighted grid cell [9, 5] on the motherboard to commence assembly.");
        break;
      case 3:
        sysop.showMessage("SYS-OP: Place down the SOCKET (Interface Pad) on cell [9, 5]. Click the Socket button on the hotbar.");
        break;
      case 4:
        sysop.showMessage("SYS-OP: Pad is down. Now slot the CASE(ITX) chassis onto the Interface Pad.");
        break;
      case 5:
        sysop.showMessage("SYS-OP: Chassis locked. Now install the Mini-ITX motherboard (MB(ITX)) to trace connections.");
        break;
      case 6:
        sysop.showMessage("SYS-OP: Motherboard secured. Slot in the Core i5 CPU (CPU(I5)) to arm the defensive lasers.");
        break;
      case 7:
        sysop.showMessage("SYS-OP: Tower fully armed! Power load is safe (20W / 40W capacity). Now click INITIALIZE PROTOCOL on the top-right to run the diagnostic wave.");
        break;
      case 8:
        sysop.showMessage("SYS-OP: Glitches detected! Target systems active. Keep the Kernel safe from corruption!");
        break;
    }
  }

  // Intercept BUY commands to enforce sequence
  canBuyItem(slotName) {
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
    if (this.step === 0) {
      // Check if they bought everything first
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
    if (this.step < 2) {
      this.game.sysop.showError("SEQUENCE VIOLATION. COMPLETE CURRENT OBJECTIVE BEFORE GRID INTERACTION.");
      return false;
    }

    // Intercept path placements and yell
    if (this.game.isCellOnPath(col, row)) {
      this.game.sysop.showError("[FATAL ERROR] HEY! ALIEN BRAIN! Look at the path! You just tried to select the malware trace line! Do you think worms knock politely? Deselect and click a clean cell!");
      return false;
    }

    // Intercept grid border check (Kernel center col 15)
    if (col >= 15) {
      this.game.sysop.showError("[FATAL ERROR] OUT OF BOUNDS. Do not place hardware on top of the central BIOS Kernel Node!");
      return false;
    }

    // Force Level 1 placement strictly to the highlighted motherboard grid cell [9, 5]
    if (col !== 9 || row !== 5) {
      this.game.sysop.showError("[FATAL ERROR] INACCURATE ASSEMBLY GRID! You must deploy the Interface Pad at coordinate [9, 5] for optimal system coverage! Click coordinate [9, 5]!");
      return false;
    }

    return true;
  }

  // Intercept BUILD item installations
  canBuildItem(item, col, row) {
    const tower = this.game.towers.find(t => t.gridX === col && t.gridY === row);

    // Foundation pad check
    if (item !== 'socket' && (!tower || !tower.hasCase && item !== 'case-basic')) {
      if (item === 'case-basic' && !tower) {
        this.game.sysop.showError("[FATAL ERROR] WHAT ARE YOU DOING?! You just tried to solder a chassis directly into raw motherboard fiberglass! Start with the Interface Pad!");
        return false;
      }
      if (item === 'mb-mini' && tower && !tower.hasCase) {
        this.game.sysop.showError("[FATAL ERROR] NO FOUNDATION. Install the Mini Case on the Interface Pad first!");
        return false;
      }
      if (item === 'cpu' && (!tower || !tower.motherboard)) {
        this.game.sysop.showError("[FATAL ERROR] BOARD MISSING. Sockets need motherboards to house processor cores!");
        return false;
      }
    }

    // Ensure they follow the tutorial structure step-by-step
    if (this.step === 3 && item !== 'socket') {
      this.game.sysop.showError("SEQUENCE FAULT. PLACE THE SOCKET (INTERFACE PAD) FIRST.");
      return false;
    }
    if (this.step === 4 && item !== 'case-basic') {
      this.game.sysop.showError("SEQUENCE FAULT. PLACE THE MINI TOWER CASE ON THE INTERFACE PAD.");
      return false;
    }
    if (this.step === 5 && item !== 'mb-mini') {
      this.game.sysop.showError("SEQUENCE FAULT. INSTALL THE MINI-ITX MOTHERBOARD ON THE CASE.");
      return false;
    }
    if (this.step === 6 && item !== 'cpu') {
      this.game.sysop.showError("SEQUENCE FAULT. INSTALL THE CORE I5 PROCESSOR TO ARM THE LASERS.");
      return false;
    }

    return true;
  }

  // Handle action callbacks to advance tutorial steps
  onActionTriggered(actionType, data) {
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
