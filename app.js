const express = require('express');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { app: appConfig } = require('./config/env');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const masterRoutes = require('./routes/master.routes');
const transactionRoutes = require('./routes/transactions.routes');

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(
  cors({
    origin: appConfig.corsOrigin === '*' ? true : appConfig.corsOrigin.split(',').map((v) => v.trim()),
    credentials: true
  })
);
app.use(logger('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'inventory-audit-api',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/transactions', transactionRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[api-error]', error);

  const statusCode = error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({ message });
});

module.exports = app;
