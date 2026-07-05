import CONFIG from './config.js';

export class InputHandler {
  constructor(canvas, renderer, onCellClicked, onHoverCellChanged) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.onCellClicked = onCellClicked;
    this.onHoverCellChanged = onHoverCellChanged;
    
    this.hoveredCell = null;
    
    this.setupListeners();
  }

  setupListeners() {
    // Mouse movement (Hover preview)
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    
    // Mouse clicks
    this.canvas.addEventListener('click', (e) => this.handleInput(e.clientX, e.clientY));
    
    // Touch inputs for mobile devices in landscape
    this.canvas.addEventListener('touchstart', (e) => {
      // Prevent default double-tap zoom / scrolling while tapping cells
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        this.handleInput(touch.clientX, touch.clientY);
      }
    });
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

  handleMouseMove(e) {
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

  handleMouseLeave() {
    if (this.hoveredCell !== null) {
      this.hoveredCell = null;
      this.onHoverCellChanged(null);
    }
  }
}
export default InputHandler;
