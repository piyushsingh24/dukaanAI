import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import router from './routes';
import { initializeSocket } from './socket';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', router);

// Error handler
app.use(errorHandler);

// Socket.IO
initializeSocket(httpServer);

// Start server
httpServer.listen(env.port, () => {
  console.log(`\n  🚀 DukaanAI Backend running on http://localhost:${env.port}`);
  console.log(`  📡 Environment: ${env.nodeEnv}\n`);
});
