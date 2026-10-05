const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createApp } = require('../src/app');
const { memoryStore } = require('../src/store/memoryStore');
const { memoryCache } = require('../src/cache');

// Builds a fresh app with an in-memory store and one user of each role.
async function setup() {
  const store = memoryStore();
  const cache = memoryCache();
  const passwordHash = await bcrypt.hash('secret123', 4);
  await store.createUser({ name: 'Admin', email: 'admin@test.local', passwordHash, role: 'admin' });
  await store.createUser({ name: 'Staff', email: 'staff@test.local', passwordHash, role: 'staff' });
  await store.createUser({ name: 'Riya', email: 'riya@test.local', passwordHash, role: 'student' });
  await store.createUser({ name: 'Aman', email: 'aman@test.local', passwordHash, role: 'student' });

  const app = createApp({ store, cache, jwtSecret: 'test-secret' });
  const api = request(app);

  async function login(email) {
    const res = await api.post('/api/auth/login').send({ email, password: 'secret123' });
    return { Authorization: `Bearer ${res.body.token}` };
  }

  return {
    app,
    api,
    store,
    cache,
    admin: await login('admin@test.local'),
    staff: await login('staff@test.local'),
    student: await login('riya@test.local'),
    otherStudent: await login('aman@test.local'),
  };
}

module.exports = { setup };
