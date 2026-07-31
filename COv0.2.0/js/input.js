import CONFIG from './config.js';

export class InputHandler {
  constructor(canvas, renderer, onCellClicked, onHoverCellChanged) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.onCellClicked = onCellClicked;
    this.onHoverCellChanged = onHoverCellChanged;
    
    this.hoveredCell = null;
    
    // Drag tracking for mouse panning
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hasMovedSignificantly = false;
    this.activeMouseButton = -1;

    // Touch tracking for mobile/tablet pinch & drag
    this.touchPinchStartDist = 0;
    this.lastTouchX = 0;
    this.lastTouchY = 0;

    // Key states for camera panning
    this.keys = {
      w: false, a: false, s: false, d: false,
      ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
    };
    
    this.setupListeners();
  }

  setupListeners() {
    // 1. Mouse Drag Panning & Hover
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    
    // Prevent context menu on right click so right-drag panning is seamless
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // 2. Mouse Wheel Zoom (Canvas & Container)
    const handleWheelZoom = (e) => {
      e.preventDefault();
      if (this.renderer && this.renderer.camera) {
        this.renderer.camera.handleWheel(e.deltaY);
      }
    };

    this.canvas.addEventListener('wheel', handleWheelZoom, { passive: false });
    
    const container = document.getElementById('game-container');
    if (container) {
      container.addEventListener('wheel', handleWheelZoom, { passive: false });
    }

    // 3. Keyboard Pan listeners
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('blur', () => this.clearKeys());

    // 4. Touch inputs (1-finger pan/tap, 2-finger pinch zoom)
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.hasMovedSignificantly = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.activeMouseButton = e.button;
  }

  handleMouseMove(e) {
    if (this.isDragging) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      
      // If moved > 5px, flag as camera drag panning
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.hasMovedSignificantly = true;
      }

      if (this.hasMovedSignificantly && this.renderer && this.renderer.camera) {
        this.renderer.camera.pan(dx, dy, this.renderer.scale);
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
      }
    } else {
      // Normal hover tracking
      const gridPos = this.getGridCoordinates(e.clientX, e.clientY);
      if (gridPos) {
        if (!this.hoveredCell || this.hoveredCell.x !== gridPos.x || this.hoveredCell.y !== gridPos.y) {
          this.hoveredCell = gridPos;
          this.onHoverCellChanged(gridPos);
        }
      } else {
        this.handleMouseLeave();
      }
    }
  }

  handleMouseUp(e) {
    if (this.isDragging) {
      // If we didn't drag the camera around, process as a cell click!
      if (!this.hasMovedSignificantly && (this.activeMouseButton === 0 || this.activeMouseButton === -1)) {
        this.handleInput(e.clientX, e.clientY);
      }
      this.isDragging = false;
      this.hasMovedSignificantly = false;
      this.activeMouseButton = -1;
    }
  }

  handleMouseLeave() {
    if (this.hoveredCell !== null) {
      this.hoveredCell = null;
      this.onHoverCellChanged(null);
    }
  }

  // ----------------------------------------------------
  // Touch Handlers for Mobile / Tablet Devices
  // ----------------------------------------------------
  handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.isDragging = true;
      this.hasMovedSignificantly = false;
      this.dragStartX = touch.clientX;
      this.dragStartY = touch.clientY;
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchPinchStartDist = Math.hypot(dx, dy);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - this.lastTouchX;
      const dy = touch.clientY - this.lastTouchY;

      if (Math.abs(touch.clientX - this.dragStartX) > 8 || Math.abs(touch.clientY - this.dragStartY) > 8) {
        this.hasMovedSignificantly = true;
      }

      if (this.hasMovedSignificantly && this.renderer && this.renderer.camera) {
        this.renderer.camera.pan(dx, dy, this.renderer.scale);
      }

      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    } else if (e.touches.length === 2 && this.renderer && this.renderer.camera) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);

      if (this.touchPinchStartDist > 0) {
        const delta = this.touchPinchStartDist - dist;
        if (Math.abs(delta) > 10) {
          this.renderer.camera.handleWheel(delta);
          this.touchPinchStartDist = dist;
        }
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    if (this.isDragging && !this.hasMovedSignificantly && e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      this.handleInput(touch.clientX, touch.clientY);
    }
    this.isDragging = false;
    this.hasMovedSignificantly = false;
    this.touchPinchStartDist = 0;
  }

  // Translates viewport cursor position to grid coordinates (Col, Row)
  getGridCoordinates(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Position relative to canvas element
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    // Translate relative pixels to logical coordinates through renderer scale
    const logical = this.renderer.screenToLogical(relativeX, relativeY);
    
    // Divide by grid size to find index
    const col = Math.floor(logical.x / CONFIG.GRID.CELL_SIZE);
    const row = Math.floor(logical.y / CONFIG.GRID.CELL_SIZE);
    
    // Check bounds
    if (col >= 0 && col < CONFIG.GRID.COLS && row >= 0 && row < CONFIG.GRID.ROWS) {
      return { x: col, y: row };
    }
    return null;
  }

  handleInput(clientX, clientY) {
    const gridPos = this.getGridCoordinates(clientX, clientY);
    if (gridPos) {
      this.onCellClicked(gridPos.x, gridPos.y);
    }
  }

  handleKeyDown(e) {
    const key = e.key;
    if (key in this.keys) {
      this.keys[key] = true;
    } else if (key.toLowerCase() in this.keys) {
      this.keys[key.toLowerCase()] = true;
    }
  }

  handleKeyUp(e) {
    const key = e.key;
    if (key in this.keys) {
      this.keys[key] = false;
    } else if (key.toLowerCase() in this.keys) {
      this.keys[key.toLowerCase()] = false;
    }
  }

  clearKeys() {
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }
}
export default InputHandler;
