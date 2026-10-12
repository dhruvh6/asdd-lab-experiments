const client = require('prom-client');

// One registry for the whole process, so several app instances (as in tests)
// share the same metric objects instead of registering duplicates.
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'campuseats_' });

const httpRequests = new client.Counter({
  name: 'campuseats_http_requests_total',
  help: 'HTTP requests handled by the API',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpDuration = new client.Histogram({
  name: 'campuseats_http_request_duration_seconds',
  help: 'API response time in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [register],
});

const ordersPlaced = new client.Counter({
  name: 'campuseats_orders_total',
  help: 'Orders placed by students',
  registers: [register],
});

const revenue = new client.Counter({
  name: 'campuseats_revenue_rupees_total',
  help: 'Value of orders placed, in rupees',
  registers: [register],
});

const itemsSold = new client.Counter({
  name: 'campuseats_items_sold_total',
  help: 'Menu items sold, by item name',
  labelNames: ['item'],
  registers: [register],
});

const prepTime = new client.Histogram({
  name: 'campuseats_order_prep_seconds',
  help: 'Time from order placed to order ready, in seconds',
  buckets: [30, 60, 120, 300, 600, 900, 1200, 1800],
  registers: [register],
});

let queueSource = async () => ({});
const ordersInQueue = new client.Gauge({
  name: 'campuseats_orders_in_queue',
  help: 'Active orders in the kitchen queue, by status',
  labelNames: ['status'],
  registers: [register],
  async collect() {
    const counts = await queueSource();
    for (const status of ['PLACED', 'PREPARING', 'READY']) {
      this.set({ status }, counts[status] || 0);
    }
  },
});

function setQueueSource(fn) {
  queueSource = fn;
}

// Express middleware: times every request and labels it by route pattern
// (e.g. /api/orders/:id) so metrics do not explode into one series per id.
function httpMetrics(req, res, next) {
  if (req.path === '/metrics') return next();
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.baseUrl + req.route.path : 'unmatched';
    end({ method: req.method, route });
    httpRequests.inc({ method: req.method, route, status: res.statusCode });
  });
  next();
}

module.exports = {
  register,
  httpMetrics,
  setQueueSource,
  ordersPlaced,
  revenue,
  itemsSold,
  prepTime,
  ordersInQueue,
};
