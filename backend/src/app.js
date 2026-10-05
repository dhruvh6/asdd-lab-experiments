const express = require('express');
const cors = require('cors');
const metrics = require('./metrics');
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');

function createApp({ store, cache, jwtSecret = 'dev-only-secret', version = 'dev' }) {
  const app = express();
  const deps = { store, cache, jwtSecret };

  metrics.setQueueSource(() => store.countActiveByStatus());

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(metrics.httpMetrics);

  // Used by the Jenkins deploy stage, Docker healthcheck and Nagios.
  app.get('/api/health', async (req, res) => {
    const checks = { database: false, cache: false };
    try {
      checks.database = await store.ping();
    } catch {}
    try {
      checks.cache = await cache.ping();
    } catch {}
    const healthy = checks.database && checks.cache;
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'UP' : 'DOWN', version, ...checks });
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', metrics.register.contentType);
    res.send(await metrics.register.metrics());
  });

  app.use('/api/auth', authRoutes(deps));
  app.use('/api/menu', menuRoutes(deps));
  app.use('/api/orders', orderRoutes(deps));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}

module.exports = { createApp };
