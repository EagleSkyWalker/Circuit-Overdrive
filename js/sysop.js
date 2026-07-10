export class SYSOPHandler {
  constructor() {
    this.panel = document.getElementById('sysop-panel');
    this.textEl = document.getElementById('sysop-text');
    this.titleEl = document.getElementById('sysop-title');
    this.avatar = document.getElementById('sysop-avatar-wrapper');
    this.errorTimeout = null;
  }

  showMessage(text) {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
    
    if (this.panel) {
      this.panel.classList.remove('error-glitch');
      this.panel.classList.remove('hidden');
    }
    if (this.avatar) {
      this.avatar.classList.remove('angry');
      this.avatar.classList.add('active-talk');
    }
    if (this.titleEl) {
      this.titleEl.innerText = "SYS-OP // SEC-BIOS";
      this.titleEl.className = "sysop-title neon-purple";
    }
    if (this.textEl) {
      this.textEl.innerText = text;
    }
  }

  showError(text) {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    if (this.panel) {
      this.panel.classList.add('error-glitch');
      this.panel.classList.remove('hidden');
    }
    if (this.avatar) {
      this.avatar.classList.add('angry');
      this.avatar.classList.remove('active-talk');
    }
    if (this.titleEl) {
      this.titleEl.innerText = "[FATAL ERROR]";
      this.titleEl.className = "sysop-title neon-red";
    }
    if (this.textEl) {
      this.textEl.innerText = text;
    }

    // Retain error animation for 5.5 seconds, then return to normal tutorial step context
    this.errorTimeout = setTimeout(() => {
      if (this.panel) this.panel.classList.remove('error-glitch');
      if (this.avatar) this.avatar.classList.remove('angry');
      if (this.titleEl) {
        this.titleEl.innerText = "SYS-OP // SEC-BIOS";
        this.titleEl.className = "sysop-title neon-purple";
      }
      this.errorTimeout = null;
      if (window.Game && window.Game.tutorial) {
        window.Game.tutorial.refreshActiveInstruction();
      }
    }, 5500);
  }

  hide() {
    if (this.panel) {
      this.panel.classList.add('hidden');
    }
  }
}
export default SYSOPHandler;
