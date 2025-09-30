const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};

// Colors for console output
const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  HTTP: '\x1b[32m',  // Green
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor() {
    this.logLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Format timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Format log message
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  // Write to file
  writeToFile(level, message, meta = {}) {
    const logMessage = this.formatMessage(level, message, meta);
    const fileName = level === 'ERROR' ? 'error.log' : 'combined.log';
    const filePath = path.join(logsDir, fileName);
    
    fs.appendFileSync(filePath, logMessage + '\n');
  }

  // Console output with colors
  consoleOutput(level, message, meta = {}) {
    if (this.isDevelopment) {
      const color = colors[level] || colors.RESET;
      const formattedMessage = this.formatMessage(level, message, meta);
      console.log(`${color}${formattedMessage}${colors.RESET}`);
    }
  }

  // Generic log method
  log(level, message, meta = {}) {
    const levelNum = LOG_LEVELS[level];
    
    if (levelNum <= this.logLevel) {
      this.consoleOutput(level, message, meta);
      this.writeToFile(level, message, meta);
    }
  }

  // Error logging
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  // Warning logging
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  // Info logging
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  // HTTP logging
  http(message, meta = {}) {
    this.log('HTTP', message, meta);
  }

  // Debug logging
  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Log API requests
  logRequest(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
      
      const meta = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      if (res.statusCode >= 400) {
        this.error(message, meta);
      } else {
        this.http(message, meta);
      }
    });

    next();
  }

  // Log database operations
  logDatabase(operation, collection, query = {}, result = {}) {
    const message = `Database ${operation} on ${collection}`;
    const meta = {
      operation,
      collection,
      query: JSON.stringify(query),
      result: typeof result === 'object' ? JSON.stringify(result) : result
    };
    
    this.debug(message, meta);
  }

  // Log authentication events
  logAuth(event, userId, email, success = true, additionalInfo = {}) {
    const message = `Auth ${event}: ${email} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const meta = {
      event,
      userId,
      email,
      success,
      timestamp: this.getTimestamp(),
      ...additionalInfo
    };

    if (success) {
      this.info(message, meta);
    } else {
      this.warn(message, meta);
    }
  }

  // Log security events
  logSecurity(event, details = {}) {
    const message = `Security Event: ${event}`;
    const meta = {
      event,
      timestamp: this.getTimestamp(),
      ...details
    };
    
    this.warn(message, meta);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;