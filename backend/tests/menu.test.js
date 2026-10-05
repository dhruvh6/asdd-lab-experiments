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
