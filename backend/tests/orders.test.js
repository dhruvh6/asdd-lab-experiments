const { setup } = require('./helpers');

const placeOrder = (t, items, who = t.student) => t.api.post('/api/orders').set(who).send({ items });

describe('CE-3 place order and get a token', () => {
  let t;
  beforeEach(async () => {
    t = await setup();
  });

  test('order total is calculated by the server and a token is issued', async () => {
    const menu = (await t.api.get('/api/menu')).body;
    const [a, b] = menu;
    const res = await placeOrder(t, [
      { menuItemId: a.id, qty: 2 },
      { menuItemId: b.id, qty: 1 },
    ]);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PLACED');
    expect(res.body.token).toBe(1);
    expect(res.body.total).toBe(a.price * 2 + b.price);
  });

  test('tokens go up by one for each order', async () => {
    const first = await placeOrder(t, [{ menuItemId: 1, qty: 1 }]);
    const second = await placeOrder(t, [{ menuItemId: 2, qty: 1 }], t.otherStudent);
    expect(second.body.token).toBe(first.body.token + 1);
  });

  test('the same item listed twice is merged into one line', async () => {
    const res = await placeOrder(t, [
      { menuItemId: 1, qty: 1 },
      { menuItemId: 1, qty: 2 },
    ]);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].qty).toBe(3);
  });

  test.each([
    [[], 400],
    [[{ menuItemId: 999, qty: 1 }], 400],
    [[{ menuItemId: 1, qty: 0 }], 400],
    [[{ menuItemId: 1, qty: 11 }], 400],
  ])('bad carts are rejected (%#)', async (items, status) => {
    expect((await placeOrder(t, items)).status).toBe(status);
  });

  test('a sold-out item cannot be ordered', async () => {
    await t.api.patch('/api/menu/1/availability').set(t.staff).send({ isAvailable: false });
    const res = await placeOrder(t, [{ menuItemId: 1, qty: 1 }]);
    expect(res.status).toBe(409);
  });

  test('only students place orders', async () => {
    expect((await placeOrder(t, [{ menuItemId: 1, qty: 1 }], t.staff)).status).toBe(403);
  });
});

describe('CE-4 kitchen queue and CE-8 order tracking', () => {
  let t;
  let order;
  beforeEach(async () => {
    t = await setup();
    order = (await placeOrder(t, [{ menuItemId: 1, qty: 1 }])).body;
  });

  test('staff see new orders in the queue', async () => {
    const res = await t.api.get('/api/orders/queue').set(t.staff);
    expect(res.status).toBe(200);
    expect(res.body.map((o) => o.id)).toContain(order.id);
    expect(res.body[0].studentName).toBe('Riya');
  });

  test('students cannot see the kitchen queue', async () => {
    expect((await t.api.get('/api/orders/queue').set(t.student)).status).toBe(403);
  });

  test('an order moves PLACED -> PREPARING -> READY -> COLLECTED and the student sees each step', async () => {
    for (const status of ['PREPARING', 'READY', 'COLLECTED']) {
      const update = await t.api.patch(`/api/orders/${order.id}/status`).set(t.staff).send({ status });
      expect(update.status).toBe(200);
      const tracked = await t.api.get(`/api/orders/${order.id}`).set(t.student);
      expect(tracked.body.status).toBe(status);
    }
    const queue = await t.api.get('/api/orders/queue').set(t.staff);
    expect(queue.body.map((o) => o.id)).not.toContain(order.id);
  });

  test('skipping a step is not allowed', async () => {
    const res = await t.api.patch(`/api/orders/${order.id}/status`).set(t.staff).send({ status: 'READY' });
    expect(res.status).toBe(409);
  });

  test("a student cannot see another student's order", async () => {
    expect((await t.api.get(`/api/orders/${order.id}`).set(t.otherStudent)).status).toBe(404);
  });

  test('a student can cancel only before the kitchen starts', async () => {
    const second = (await placeOrder(t, [{ menuItemId: 2, qty: 1 }])).body;
    expect((await t.api.patch(`/api/orders/${second.id}/cancel`).set(t.student)).body.status).toBe('CANCELLED');

    await t.api.patch(`/api/orders/${order.id}/status`).set(t.staff).send({ status: 'PREPARING' });
    expect((await t.api.patch(`/api/orders/${order.id}/cancel`).set(t.student)).status).toBe(409);
  });
});

describe('CE-9 order history', () => {
  test('a student sees only their own orders, newest first', async () => {
    const t = await setup();
    await placeOrder(t, [{ menuItemId: 1, qty: 1 }]);
    await placeOrder(t, [{ menuItemId: 2, qty: 1 }]);
    await placeOrder(t, [{ menuItemId: 3, qty: 1 }], t.otherStudent);

    const res = await t.api.get('/api/orders/mine').set(t.student);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBeGreaterThan(res.body[1].id);
  });
});
