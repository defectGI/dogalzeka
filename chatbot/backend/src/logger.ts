const isProd = process.env.NODE_ENV === 'production';

function timestamp() {
  return new Date().toISOString();
}

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: object) {
  if (isProd) {
    console.log(JSON.stringify({ ts: timestamp(), level, message, ...meta }));
  } else {
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    console.log(`[${timestamp()}] ${level} ${message}${metaStr}`);
  }
}

export const logger = {
  info: (message: string, meta?: object) => log('INFO', message, meta),
  warn: (message: string, meta?: object) => log('WARN', message, meta),
  error: (message: string, meta?: object) => log('ERROR', message, meta),
};
