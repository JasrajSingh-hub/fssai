import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 StreetSanitation & VendorPass API running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`🔗 Health check available at http://localhost:${env.PORT}/api/v1/health`);
  });

  const shutdown = () => {
    console.log('🛑 Shutting down server gracefully...');
    server.close(() => {
      console.log('Server terminated');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();