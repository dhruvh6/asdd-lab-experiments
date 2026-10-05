const { setup } = require('./helpers');

describe('operations endpoints used by Jenkins, Prometheus and Nagios', () => {
  test('health reports UP when the database and cache respond', async () => {
    const t = await setup();
    const res = await t.api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'UP', database: true, cache: true });
  });

  test('health reports DOWN with 503 when the database fails', async () => {
    const t = await setup();
    t.store.ping = async () => {
      throw new Error('connection refused');
    };
    const res = await t.api.get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('DOWN');
  });

  test('/metrics exposes request and business metrics in Prometheus format', async () => {
    const t = await setup();
    await t.api.post('/api/orders').set(t.student).send({ items: [{ menuItemId: 1, qty: 2 }] });
    const res = await t.api.get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('campuseats_http_requests_total');
    expect(res.text).toContain('campuseats_orders_total');
    expect(res.text).toContain('campuseats_orders_in_queue{status="PLACED"}');
  });

  test('unknown API routes return JSON 404', async () => {
    const t = await setup();
    const res = await t.api.get('/api/nothing-here');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
