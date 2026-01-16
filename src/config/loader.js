const fs = require("fs");
const path = require("path");
const { getDefaults } = require("./defaults");

/**
 * Config Loader - loads config from file and merges with defaults
 */
class ConfigLoader {
  constructor() {
    this.configPaths = [
      path.join(process.cwd(), ".timesheetrc"),
      path.join(process.cwd(), ".timesheetrc.json"),
      path.join(require("os").homedir(), ".timesheetrc"),
      path.join(require("os").homedir(), ".timesheetrc.json"),
    ];
  }

  /**
   * Load config from file or return defaults
   */
  load() {
    const defaults = getDefaults();
    let fileConfig = null;

    // Try to find config file
    for (const configPath of this.configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, "utf8");
          fileConfig = JSON.parse(content);
          break;
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    }

    // Merge defaults with file config
    return this._deepMerge(defaults, fileConfig || {});
  }

  /**
   * Deep merge two objects
   */
  _deepMerge(target, source) {
    const output = { ...target };

    if (this._isObject(target) && this._isObject(source)) {
      for (const key in source) {
        if (this._isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      }
    }

    return output;
  }

  /**
   * Check if value is an object
   */
  _isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }
}

module.exports = ConfigLoader;

