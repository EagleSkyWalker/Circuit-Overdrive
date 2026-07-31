import CONFIG from './config.js';

export class Camera {
  constructor() {
    this.zoom = 1.0;
    this.x = 0; // camera pan offset X
    this.y = 0; // camera pan offset Y
    
    // Limits
    this.minZoom = 0.5;
    this.maxZoom = 2.5;
    this.limitX = 600; // boundary limit X
    this.limitY = 400; // boundary limit Y
    
    // Zoom scale origin (center of the 1200x720 grid)
    this.originX = (CONFIG.GRID.COLS * CONFIG.GRID.CELL_SIZE) / 2; // 600
    this.originY = (CONFIG.GRID.ROWS * CONFIG.GRID.CELL_SIZE) / 2; // 360
  }

  handleWheel(deltaY) {
    if (deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  zoomIn() {
    this.zoom = Math.min(this.maxZoom, Math.round((this.zoom + 0.15) * 100) / 100);
  }

  zoomOut() {
    this.zoom = Math.max(this.minZoom, Math.round((this.zoom - 0.15) * 100) / 100);
  }

  resetView() {
    this.zoom = 1.0;
    this.x = 0;
    this.y = 0;
  }

  pan(deltaPixelX, deltaPixelY, screenScale = 1) {
    // Converts screen pixel delta into camera pan offset
    const effectiveScale = screenScale * 0.8 * this.zoom;
    if (effectiveScale <= 0) return;
    
    this.x += deltaPixelX / effectiveScale;
    this.y += deltaPixelY / effectiveScale;
    
    this.clamp();
  }

  clamp() {
    this.x = Math.max(-this.limitX, Math.min(this.limitX, this.x));
    this.y = Math.max(-this.limitY, Math.min(this.limitY, this.y));
  }

  update(dt, activeKeys) {
    if (!activeKeys) return;
    const speed = 400 * (dt / 1000); // 400 logical pixels per second
    let dx = 0;
    let dy = 0;
    
    if (activeKeys.w || activeKeys.ArrowUp) dy += speed;
    if (activeKeys.s || activeKeys.ArrowDown) dy -= speed;
    if (activeKeys.a || activeKeys.ArrowLeft) dx += speed;
    if (activeKeys.d || activeKeys.ArrowRight) dx -= speed;
    
    if (dx !== 0 || dy !== 0) {
      this.x += dx;
      this.y += dy;
      this.clamp();
    }
  }

  toLogicalSpace(lx, ly) {
    return {
      x: (lx - this.originX) / this.zoom + this.originX - this.x,
      y: (ly - this.originY) / this.zoom + this.originY - this.y
    };
  }

  applyTransform(ctx) {
    ctx.save();
    ctx.translate(this.originX, this.originY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.originX + this.x, -this.originY + this.y);
  }

  restoreTransform(ctx) {
    ctx.restore();
  }
}
export default Camera;
