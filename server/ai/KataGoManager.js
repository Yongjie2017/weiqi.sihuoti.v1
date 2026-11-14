const path = require('path');
const fs = require('fs');
const GtpEngine = require('./GtpEngine');

class KataGoManager {
  constructor() {
    this.engine = null;
    this.available = false;
    this._loadConfig();
  }

  _loadConfig() {
    const configPath = path.join(__dirname, '../config/engine.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      this.executablePath = config.executablePath || 'katago';
      this.args = config.args || [];
      this.available = config.enabled !== false;
    } else {
      this.available = false;
    }
  }

  isAvailable() { return this.available; }

  getEngine() {
    if (!this.available) return null;
    if (!this.engine) {
      this.engine = new GtpEngine(this.executablePath, this.args);
      this.engine.start();
    }
    return this.engine;
  }

  async shutdown() {
    if (this.engine) { await this.engine.quit(); this.engine = null; }
  }
}

module.exports = new KataGoManager();
