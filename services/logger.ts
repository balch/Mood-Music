
export enum LogLevel {
  VERBOSE,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  NONE,
}

// Set the current log level for the application.
// e.g., LogLevel.INFO will show INFO, WARN, and ERROR messages.
const CURRENT_LOG_LEVEL = LogLevel.INFO;

const log = (level: LogLevel, ...args: unknown[]) => {
  if (level >= CURRENT_LOG_LEVEL) {
    const prefix = `[${LogLevel[level]}]`;
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, ...args);
        break;
      case LogLevel.DEBUG:
        console.log(prefix, ...args);
        break;
      case LogLevel.VERBOSE:
        console.log(prefix, ...args);
        break;
    }
  }
};

export const logger = {
  verbose: (...args: unknown[]) => log(LogLevel.VERBOSE, ...args),
  debug: (...args: unknown[]) => log(LogLevel.DEBUG, ...args),
  info: (...args: unknown[]) => log(LogLevel.INFO, ...args),
  warn: (...args: unknown[]) => log(LogLevel.WARN, ...args),
  error: (...args: unknown[]) => log(LogLevel.ERROR, ...args),
};
