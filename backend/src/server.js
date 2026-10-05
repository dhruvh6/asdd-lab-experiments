const bcrypt = require('bcryptjs');
const { createApp } = require('./app');
const { memoryStore } = require('./store/memoryStore');
const { mysqlStore } = require('./store/mysqlStore');
const { memoryCache, redisCache } = require('./cache');
const { DEMO_USERS, MENU } = require('./seed');

const env = process.env;
const PORT = Number(env.PORT || 4000);

async function waitFor(name, check, attempts = 30) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await check();
      return;
    } catch (err) {
      console.log(`Waiting for ${name} (${i}/${attempts}): ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error(`${name} did not become ready`);
}

async function seed(store) {
  for (const u of DEMO_USERS) {
    if (!(await store.findUserByEmail(u.email))) {
      await store.createUser({ ...u, passwordHash: await bcrypt.hash(u.password, 10) });
    }
  }
  if ((await store.listMenu({ includeUnavailable: true })).length === 0) {
    for (const item of MENU) await store.createMenuItem(item);
  }
}

async function main() {
  const useMemory = env.STORE === 'memory';
  const store = useMemory
    ? memoryStore()
    : mysqlStore({
        host: env.DB_HOST || 'localhost',
        port: Number(env.DB_PORT || 3306),
        user: env.DB_USER || 'campuseats',
        password: env.DB_PASSWORD || 'campuseats',
        database: env.DB_NAME || 'campuseats',
      });
  const cache = env.REDIS_URL ? redisCache(env.REDIS_URL) : memoryCache();

  await waitFor('database', () => store.ping());
  await seed(store);

  const app = createApp({ store, cache, jwtSecret: env.JWT_SECRET, version: env.APP_VERSION || 'dev' });
  app.listen(PORT, () => console.log(`CampusEats API (${store.kind} store) listening on ${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
