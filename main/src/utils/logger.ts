import type { ConfigManager } from '../services/configManager';
import * as fs from 'fs';
import * as path from 'path';
import { getCrystalSubdirectory } from './crystalDirectory';
import { formatForDatabase } from './timestampUtils';

// Capture the ORIGINAL console methods immediately when this module loads
// This must happen before any other code can override them
const ORIGINAL_CONSOLE = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

export class Logger {
  private logDir: string;
  private currentLogFile: string;
  private logStream: fs.WriteStream | null = null;
  private currentLogSize = 0;
  private readonly MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_LOG_FILES = 5;
  private originalConsole = ORIGINAL_CONSOLE;

  constructor(private configManager: ConfigManager) {
    // Use the centralized Crystal directory
    this.logDir = getCrystalSubdirectory('logs');
    
    this.currentLogFile = this.getCurrentLogFileName();
    this.initializeLogger();
  }

  private initializeLogger() {
    try {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }

      // Check if current log file exists and get its size
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        this.currentLogSize = stats.size;
      }

      // Open write stream in append mode
      this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
      
      // Clean up old log files
      this.cleanupOldLogs();
    } catch (error) {
      this.originalConsole.error('[Logger] Failed to initialize file logging:', error);
    }
  }

  private getCurrentLogFileName(): string {
    const date = formatForDatabase().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `crystal-${date}.log`);
  }

  private rotateLogIfNeeded() {
    if (this.currentLogSize >= this.MAX_LOG_SIZE) {
      try {
        // Close current stream
        if (this.logStream) {
          this.logStream.end();
        }

        // Generate new filename with timestamp
        const timestamp = formatForDatabase().replace(/[:.]/g, '-');
        const rotatedFileName = path.join(this.logDir, `crystal-${timestamp}.log`);
        
        // Rename current file
        fs.renameSync(this.currentLogFile, rotatedFileName);

        // Reset and create new log file
        this.currentLogSize = 0;
        this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
        
        // Clean up old logs
        this.cleanupOldLogs();
      } catch (error) {
        this.originalConsole.error('[Logger] Failed to rotate log:', error);
      }
    }
  }

  private cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('crystal-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the most recent MAX_LOG_FILES
      if (files.length > this.MAX_LOG_FILES) {
        const filesToDelete = files.slice(this.MAX_LOG_FILES);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            this.originalConsole.error(`[Logger] Failed to delete old log ${file.name}:`, error);
          }
        });
      }
    } catch (error) {
      this.originalConsole.error('[Logger] Failed to cleanup old logs:', error);
    }
  }

  private writeToFile(logMessage: string) {
    if (!this.logStream) return;

    try {
      const messageWithNewline = logMessage + '\n';
      const messageSize = Buffer.byteLength(messageWithNewline);
      
      // Check if we need to rotate before writing
      if (this.currentLogSize + messageSize >= this.MAX_LOG_SIZE) {
        this.rotateLogIfNeeded();
      }

      this.logStream.write(messageWithNewline);
      this.currentLogSize += messageSize;
    } catch (error) {
      this.originalConsole.error('[Logger] Failed to write to log file:', error);
    }
  }

  private logInternal(level: string, message: string, error?: Error) {
    const timestamp = formatForDatabase();
    const errorInfo = error ? ` Error: ${error.message}\nStack: ${error.stack}` : '';
    const fullMessage = `[${timestamp}] ${level}: ${message}${errorInfo}`;
    
    // Always log to console using the original console method to avoid recursion
    this.originalConsole.log(fullMessage);
    
    // Also write to file
    this.writeToFile(fullMessage);
  }

  // Public log method for console.log override
  log(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    this.logInternal('LOG', message);
  }

  verbose(message: string) {
    if (this.configManager.isVerbose()) {
      this.logInternal('VERBOSE', message);
    }
  }

  info(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    this.logInternal('INFO', message);
  }

  warn(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    this.logInternal('WARN', message);
  }

  error(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    this.logInternal('ERROR', message);
  }

  // Close the log stream when shutting down
  close() {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }
}