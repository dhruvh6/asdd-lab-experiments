const { setup } = require('./helpers');

describe('CE-2 browse menu', () => {
  let t;
  beforeEach(async () => {
    t = await setup();
  });

  test('anyone can read the menu, and the second read comes from cache', async () => {
    const first = await t.api.get('/api/menu');
    expect(first.status).toBe(200);
    expect(first.body.length).toBeGreaterThan(5);
    expect(first.headers['x-cache']).toBe('MISS');

    const second = await t.api.get('/api/menu');
    expect(second.headers['x-cache']).toBe('HIT');
  });

  test('every item has a category and a price', async () => {
    const res = await t.api.get('/api/menu');
    for (const item of res.body) {
      expect(item.category).toEqual(expect.any(String));
      expect(item.price).toBeGreaterThan(0);
    }
  });
});

describe('CE-10 admin menu management', () => {
  let t;
  beforeEach(async () => {
    t = await setup();
  });

  test('admin can add an item and it appears on the menu straight away', async () => {
    await t.api.get('/api/menu'); // warm the cache
    const created = await t.api
      .post('/api/menu')
      .set(t.admin)
      .send({ name: 'Pav Bhaji', category: 'Meals', price: 85 });
    expect(created.status).toBe(201);

    const menu = await t.api.get('/api/menu');
    expect(menu.headers['x-cache']).toBe('MISS');
    expect(menu.body.map((i) => i.name)).toContain('Pav Bhaji');
  });

  test('admin can edit the price of an item', async () => {
    const res = await t.api.put('/api/menu/1').set(t.admin).send({ price: 70 });
    expect(res.status).toBe(200);
    expect(res.body.price).toBe(70);
  });

  test('invalid prices are rejected', async () => {
    for (const price of [0, -5, 'abc', 20000]) {
      const res = await t.api.post('/api/menu').set(t.admin).send({ name: 'X', category: 'Y', price });
      expect(res.status).toBe(400);
    }
  });

  test('staff can mark an item sold out, which hides it from students', async () => {
    const res = await t.api.patch('/api/menu/1/availability').set(t.staff).send({ isAvailable: false });
    expect(res.status).toBe(200);
    const menu = await t.api.get('/api/menu');
    expect(menu.body.find((i) => i.id === 1)).toBeUndefined();

    const all = await t.api.get('/api/menu/all').set(t.admin);
    expect(all.body.find((i) => i.id === 1).isAvailable).toBe(false);
  });

  test('students cannot change the menu', async () => {
    const res = await t.api.post('/api/menu').set(t.student).send({ name: 'X', category: 'Y', price: 10 });
    expect(res.status).toBe(403);
  });

  test('staff cannot delete items, admin can', async () => {
    expect((await t.api.delete('/api/menu/2').set(t.staff)).status).toBe(403);
    expect((await t.api.delete('/api/menu/2').set(t.admin)).status).toBe(204);
    expect((await t.api.delete('/api/menu/2').set(t.admin)).status).toBe(404);
  });
});
