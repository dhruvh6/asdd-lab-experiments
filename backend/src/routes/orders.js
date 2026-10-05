const express = require('express');
const { authenticate, requireRole } = require('../auth');
const metrics = require('../metrics');
const { istDate } = require('../time');

const MAX_QTY_PER_ITEM = 10;

// Allowed kitchen workflow (CE-4). Anything else is rejected.
const NEXT_STATUS = {
  PLACED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COLLECTED'],
  COLLECTED: [],
  CANCELLED: [],
};

module.exports = function orderRoutes({ store, cache, jwtSecret }) {
  const router = express.Router();
  router.use(authenticate(jwtSecret));
  const kitchen = requireRole('staff', 'admin');

  // CE-3: place an order and receive a token number for the day.
  router.post('/', requireRole('student'), async (req, res) => {
    const lines = req.body?.items;
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    const merged = new Map();
    for (const line of lines) {
      const id = Number(line.menuItemId);
      const qty = Number(line.qty);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ error: 'Each item needs a valid menuItemId and quantity' });
      }
      merged.set(id, (merged.get(id) || 0) + qty);
    }

    const items = [];
    for (const [id, qty] of merged) {
      if (qty > MAX_QTY_PER_ITEM) {
        return res.status(400).json({ error: `You can order at most ${MAX_QTY_PER_ITEM} of one item` });
      }
      const menuItem = await store.getMenuItem(id);
      if (!menuItem) return res.status(400).json({ error: `Menu item ${id} does not exist` });
      if (!menuItem.isAvailable) return res.status(409).json({ error: `${menuItem.name} is sold out` });
      items.push({ menuItemId: id, name: menuItem.name, price: menuItem.price, qty });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const token = await cache.incr(`token:${istDate(new Date())}`);
    const order = await store.createOrder({ userId: req.user.id, token, total, items });

    metrics.ordersPlaced.inc();
    metrics.revenue.inc(total);
    for (const i of items) metrics.itemsSold.inc({ item: i.name }, i.qty);

    res.status(201).json(order);
  });

  // CE-4: the live kitchen queue.
  router.get('/queue', kitchen, async (req, res) => {
    res.json(await store.listActiveOrders());
  });

  // CE-8: live tracking of a single order.
  router.get('/:id', async (req, res) => {
    const order = await store.getOrder(Number(req.params.id));
    if (!order || (req.user.role === 'student' && order.userId !== req.user.id)) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  router.patch('/:id/status', kitchen, async (req, res) => {
    const status = req.body?.status;
    const order = await store.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!NEXT_STATUS[order.status].includes(status)) {
      return res.status(409).json({ error: `Cannot move an order from ${order.status} to ${status}` });
    }
    const updated = await store.updateOrderStatus(order.id, status);
    if (status === 'READY') {
      metrics.prepTime.observe((new Date(updated.readyAt) - new Date(updated.createdAt)) / 1000);
    }
    res.json(updated);
  });

  // Students may cancel only before the kitchen starts on the order.
  router.patch('/:id/cancel', requireRole('student'), async (req, res) => {
    const order = await store.getOrder(Number(req.params.id));
    if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'PLACED') {
      return res.status(409).json({ error: 'The kitchen has already started this order' });
    }
    res.json(await store.updateOrderStatus(order.id, 'CANCELLED'));
  });

  return router;
};

module.exports.NEXT_STATUS = NEXT_STATUS;
