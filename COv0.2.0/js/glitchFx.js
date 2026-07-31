// Canvas Glitch & Particle Effect Renderer for Main Menu Left Panel
export class GlitchParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.particles = [];
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scanlineY = 0;
    this.charSet = '01010101XYZQBITSERRRAMCPU01';

    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : window.innerWidth * 0.45;
    this.height = parent ? parent.clientHeight : window.innerHeight;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      this.mouse.targetX = (e.clientX - halfW) / halfW;
      this.mouse.targetY = (e.clientY - halfH) / halfH;
    });
  }

  initParticles() {
    this.particles = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        char: this.charSet[Math.floor(Math.random() * this.charSet.length)],
        size: 10 + Math.random() * 14,
        speedY: -15 - Math.random() * 35,
        opacity: 0.15 + Math.random() * 0.5,
        color: Math.random() < 0.6 ? '#00ffcc' : (Math.random() < 0.8 ? '#00ff66' : '#ff00aa')
      });
    }
  }

  animate() {
    if (!this.canvas || !this.ctx) return;
    if (!this.width || !this.height || this.width <= 0 || this.height <= 0) {
      this.resize();
      requestAnimationFrame(() => this.animate());
      return;
    }

    // Smooth mouse parallax interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw subtle grid lines
    this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.04)';
    this.ctx.lineWidth = 1;
    const step = 40;
    const offsetX = this.mouse.x * 12;
    const offsetY = this.mouse.y * 12;

    for (let x = offsetX % step; x < this.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = offsetY % step; y < this.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Draw floating matrix characters
    const dt = 0.016;
    this.ctx.font = '12px "Share Tech Mono", monospace';

    this.particles.forEach(p => {
      p.y += p.speedY * dt;
      if (p.y < -20) {
        p.y = this.height + 20;
        p.x = Math.random() * this.width;
        p.char = this.charSet[Math.floor(Math.random() * this.charSet.length)];
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      const px = p.x + this.mouse.x * 15;
      const py = p.y + this.mouse.y * 15;
      this.ctx.fillText(p.char, px, py);
    });

    this.ctx.globalAlpha = 1.0;

    // Draw CRT Scanline beam pulse
    this.scanlineY += 120 * dt;
    if (this.scanlineY > this.height) this.scanlineY = 0;

    const grad = this.ctx.createLinearGradient(0, Math.max(0, this.scanlineY - 20), 0, this.scanlineY + 20);
    grad.addColorStop(0, 'rgba(0, 255, 204, 0)');
    grad.addColorStop(0.5, 'rgba(0, 255, 204, 0.08)');
    grad.addColorStop(1, 'rgba(0, 255, 204, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, Math.max(0, this.scanlineY - 20), this.width, 40);

    // Draw bouncing cyan laser beam along the exact slanted edge vector: (W, 0) -> (0.85 * W, H)
    const timeSec = performance.now() * 0.0012;
    const progress = (Math.sin(timeSec) + 1) / 2; // Smooth sine bounce 0 -> 1 -> 0

    const x1 = this.width - 2;
    const y1 = 0;
    const x2 = this.width * 0.85 - 2;
    const y2 = this.height;

    // Interpolate laser center along the vector
    const lx = x1 + (x2 - x1) * progress;
    const ly = y1 + (y2 - y1) * progress;

    // Unit direction vector along the slant
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 0 && isFinite(len)) {
      const ux = dx / len;
      const uy = dy / len;

      const segLen = 110; // 110px laser pulse length
      const p1x = lx - ux * (segLen / 2);
      const p1y = ly - uy * (segLen / 2);
      const p2x = lx + ux * (segLen / 2);
      const p2y = ly + uy * (segLen / 2);

      if (isFinite(p1x) && isFinite(p1y) && isFinite(p2x) && isFinite(p2y)) {
        this.ctx.save();
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00ffcc';
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 5;

        const laserGrad = this.ctx.createLinearGradient(p1x, p1y, p2x, p2y);
        laserGrad.addColorStop(0, 'rgba(0, 255, 204, 0)');
        laserGrad.addColorStop(0.3, 'rgba(0, 255, 204, 0.9)');
        laserGrad.addColorStop(0.5, '#ffffff');
        laserGrad.addColorStop(0.7, 'rgba(0, 255, 204, 0.9)');
        laserGrad.addColorStop(1, 'rgba(0, 255, 204, 0)');

        this.ctx.strokeStyle = laserGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(p1x, p1y);
        this.ctx.lineTo(p2x, p2y);
        this.ctx.stroke();
        this.ctx.restore();
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}
