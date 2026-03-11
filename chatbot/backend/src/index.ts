import app from './app';
import { initDatabase } from './config/database';
import { logger } from './logger';

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      logger.info('Server started', { port: PORT, env: process.env.NODE_ENV });
    });
  } catch (err: any) {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  }
}

main();
