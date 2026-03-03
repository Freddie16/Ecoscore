/**
 * Lightweight structured logger.
 * In production you could swap this for Winston or Pino.
 */

const isDev = process.env.NODE_ENV !== 'production';

const colours = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
};

const timestamp = () => new Date().toISOString();

const logger = {
  info: (msg, meta = '') =>
    console.log(`${colours.cyan}[INFO]${colours.reset} ${timestamp()} ${msg}`, meta || ''),

  warn: (msg, meta = '') =>
    console.warn(`${colours.yellow}[WARN]${colours.reset} ${timestamp()} ${msg}`, meta || ''),

  error: (msg, err = '') => {
    console.error(`${colours.red}[ERROR]${colours.reset} ${timestamp()} ${msg}`);
    if (err && isDev) console.error(err);
  },

  success: (msg, meta = '') =>
    console.log(`${colours.green}[OK]${colours.reset} ${timestamp()} ${msg}`, meta || ''),

  debug: (msg, meta = '') => {
    if (isDev) console.log(`${colours.grey}[DEBUG]${colours.reset} ${timestamp()} ${msg}`, meta || '');
  },
};

export default logger;