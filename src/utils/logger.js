const fs = require('fs');
const path = require('path');

/**
 * Log levels
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * Structured Logger
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || (process.env.DEBUG ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO);
    this.logToFile = options.logToFile || false;
    this.logFile = options.logFile || path.join(process.cwd(), 'timesheet.log');
    this.logRotation = options.logRotation || true;
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB

    if (this.logToFile) {
      this._ensureLogFile();
    }
  }

  /**
   * Ensure log file exists and handle rotation
   */
  _ensureLogFile() {
    if (fs.existsSync(this.logFile)) {
      const stats = fs.statSync(this.logFile);
      if (this.logRotation && stats.size > this.maxLogSize) {
        // Rotate log file
        const rotatedFile = `${this.logFile}.${Date.now()}`;
        fs.renameSync(this.logFile, rotatedFile);
      }
    }
  }

  /**
   * Format log message
   */
  _formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level);
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...metadata,
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Write to log file
   */
  _writeToFile(message) {
    if (this.logToFile) {
      try {
        fs.appendFileSync(this.logFile, message + '\n', 'utf8');
      } catch (error) {
        // Fallback to console if file write fails
        console.error('Failed to write to log file:', error.message);
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message, metadata = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      const formatted = this._formatMessage(LOG_LEVELS.DEBUG, message, metadata);
      if (process.env.DEBUG) {
        console.debug(`[DEBUG] ${message}`, metadata);
      }
      this._writeToFile(formatted);
    }
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      const formatted = this._formatMessage(LOG_LEVELS.INFO, message, metadata);
      console.log(`[INFO] ${message}`);
      this._writeToFile(formatted);
    }
  }

  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      const formatted = this._formatMessage(LOG_LEVELS.WARN, message, metadata);
      console.warn(`[WARN] ${message}`);
      this._writeToFile(formatted);
    }
  }

  /**
   * Log error message
   */
  error(message, error = null, metadata = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      const errorMetadata = {
        ...metadata,
        ...(error && {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        }),
      };
      const formatted = this._formatMessage(LOG_LEVELS.ERROR, message, errorMetadata);
      console.error(`[ERROR] ${message}`, error ? error.stack : '');
      this._writeToFile(formatted);
    }
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    } else {
      this.level = level;
    }
  }

  /**
   * Enable file logging
   */
  enableFileLogging(logFile = null) {
    this.logToFile = true;
    if (logFile) {
      this.logFile = logFile;
    }
    this._ensureLogFile();
  }

  /**
   * Disable file logging
   */
  disableFileLogging() {
    this.logToFile = false;
  }
}

// Global logger instance
let globalLogger = null;

/**
 * Get or create global logger instance
 */
function getLogger(options) {
  if (!globalLogger) {
    globalLogger = new Logger(options);
  }
  return globalLogger;
}

/**
 * Create new logger instance
 */
function createLogger(options) {
  return new Logger(options);
}

module.exports = {
  Logger,
  getLogger,
  createLogger,
  LOG_LEVELS,
};

