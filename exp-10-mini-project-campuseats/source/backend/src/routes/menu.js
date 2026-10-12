const express = require('express');
const { authenticate, requireRole } = require('../auth');

const MENU_CACHE_KEY = 'menu:available';
const MENU_CACHE_TTL = 60;

module.exports = function menuRoutes({ store, cache, jwtSecret }) {
  const router = express.Router();
  const auth = authenticate(jwtSecret);

  // CE-2: the menu is read on every page load, so it is served from Redis
  // and the cache is cleared whenever an admin or staff member changes it.
  router.get('/', async (req, res) => {
    const cached = await cache.get(MENU_CACHE_KEY);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
    const items = await store.listMenu();
    await cache.set(MENU_CACHE_KEY, JSON.stringify(items), MENU_CACHE_TTL);
    res.set('X-Cache', 'MISS');
    res.json(items);
  });

  // Staff and admin also see items that are switched off.
  router.get('/all', auth, requireRole('admin', 'staff'), async (req, res) => {
    res.json(await store.listMenu({ includeUnavailable: true }));
  });

  router.post('/', auth, requireRole('admin'), async (req, res) => {
    const error = validateItem(req.body, { partial: false });
    if (error) return res.status(400).json({ error });
    const { name, category, price, isVeg } = req.body;
    const item = await store.createMenuItem({ name: name.trim(), category: category.trim(), price: Number(price), isVeg: isVeg !== false });
    await cache.del(MENU_CACHE_KEY);
    res.status(201).json(item);
  });

  router.put('/:id', auth, requireRole('admin'), async (req, res) => {
    const error = validateItem(req.body, { partial: true });
    if (error) return res.status(400).json({ error });
    const changes = pick(req.body, ['name', 'category', 'price', 'isVeg', 'isAvailable']);
    if (changes.price !== undefined) changes.price = Number(changes.price);
    const item = await store.updateMenuItem(Number(req.params.id), changes);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    await cache.del(MENU_CACHE_KEY);
    res.json(item);
  });

  // Staff can mark an item sold out during service without full admin rights.
  router.patch('/:id/availability', auth, requireRole('admin', 'staff'), async (req, res) => {
    if (typeof req.body?.isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable must be true or false' });
    }
    const item = await store.updateMenuItem(Number(req.params.id), { isAvailable: req.body.isAvailable });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    await cache.del(MENU_CACHE_KEY);
    res.json(item);
  });

  router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
    const deleted = await store.deleteMenuItem(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Menu item not found' });
    await cache.del(MENU_CACHE_KEY);
    res.status(204).end();
  });

  return router;
};

function validateItem(body = {}, { partial }) {
  const { name, category, price } = body;
  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) return 'Item name is required';
  }
  if (!partial || category !== undefined) {
    if (!category || !String(category).trim()) return 'Category is required';
  }
  if (!partial || price !== undefined) {
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0 || value > 10000) return 'Price must be between 1 and 10000';
  }
  return null;
}

function pick(source, keys) {
  return Object.fromEntries(keys.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));
}
