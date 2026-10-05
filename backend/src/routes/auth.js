const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken, authenticate } = require('../auth');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = function authRoutes({ store, jwtSecret }) {
  const router = express.Router();

  // CE-1: students create their own account; staff and admin are seeded.
  router.post('/register', async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const normalised = email.trim().toLowerCase();
    if (await store.findUserByEmail(normalised)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await store.createUser({ name: name.trim(), email: normalised, passwordHash, role: 'student' });
    res.status(201).json({ token: signToken(user, jwtSecret), user: publicUser(user) });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    const user = email && (await store.findUserByEmail(email.trim().toLowerCase()));
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    res.json({ token: signToken(user, jwtSecret), user: publicUser(user) });
  });

  router.get('/me', authenticate(jwtSecret), async (req, res) => {
    const user = await store.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  });

  return router;
};

function publicUser({ id, name, email, role }) {
  return { id, name, email, role };
}
