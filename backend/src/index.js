/**
 * Main Express Application Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import Routes
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import workspacesRoutes from './routes/workspaces.js';
import teamsRoutes from './routes/teams.js';
import permissionsRoutes from './routes/permissions.js';
import productRoutes from './routes/products.js';
import subscriptionRoutes from './routes/subscriptions.js';
import catalogRoutes from './routes/catalog.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import companySettingsRoutes from './routes/companySettings.js';
import clientsRoutes from './routes/clients.js';
import proveedoresRoutes from './features/proveedores/proveedores.routes.js';
import { startCTSyncJob } from './jobs/ctSyncJob.js';
import { startReplenishmentAlertJob } from './jobs/replenishmentAlertJob.js';

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tonebox.mx',
    'https://tonebox.com.mx' // Agregada por seguridad adicional
  ],
  credentials: true,
}));

// Health Check (Requerido para Railway)
app.get('/health', (req, res) => res.status(200).send('OK'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.env !== 'test') {
  app.use(morgan('combined'));
}

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/workspaces', workspacesRoutes);
apiRouter.use('/teams', teamsRoutes);
apiRouter.use('/permissions', permissionsRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/subscriptions', subscriptionRoutes);
apiRouter.use('/catalog', catalogRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/company-settings', companySettingsRoutes);
apiRouter.use('/admin/clients', clientsRoutes);

apiRouter.use('/admin/proveedores', proveedoresRoutes);

app.use(config.apiPrefix, apiRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SaaS API',
    version: '1.0.0',
    docs: `${config.apiPrefix}/docs`,
  });
});

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`
  🚀 Server is running!

  Environment: ${config.env}
  Port: ${process.env.PORT || 3000}
  API: http://localhost:${process.env.PORT || 3000}${config.apiPrefix}
  Health: http://localhost:${process.env.PORT || 3000}/health
  `);

  // Start CT Online automatic sync (every 4 hours)
  startCTSyncJob();
  // Start daily replenishment alerts (09:00 MX)
  startReplenishmentAlertJob();
});

// Graceful Shutdown
const shutdown = () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;

