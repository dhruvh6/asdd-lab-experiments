const { salesStats } = require('../src/stats');
const { istDate } = require('../src/time');
const { setup } = require('./helpers');

describe('CE-11 sales dashboard figures', () => {
  const now = new Date('2026-10-06T07:30:00Z'); // 13:00 IST
  const order = (createdAt, total, items, extra = {}) => ({ createdAt, total, items, status: 'COLLECTED', ...extra });

  const orders = [
    order('2026-10-06T06:30:00Z', 120, [{ name: 'Vada Pav', qty: 6, price: 20 }], { readyAt: '2026-10-06T06:40:00Z' }),
    order('2026-10-06T07:00:00Z', 60, [{ name: 'Masala Dosa', qty: 1, price: 60 }], { readyAt: '2026-10-06T07:20:00Z' }),
    order('2026-10-05T07:00:00Z', 150, [{ name: 'Chicken Biryani', qty: 1, price: 150 }]),
    order('2026-10-06T07:10:00Z', 999, [{ name: 'Veg Thali', qty: 9, price: 111 }], { status: 'CANCELLED' }),
  ];

  test('today totals ignore cancelled orders and yesterday', () => {
    const stats = salesStats(orders, now);
    expect(stats.today.orders).toBe(2);
    expect(stats.today.revenue).toBe(180);
    expect(stats.today.avgPrepMinutes).toBe(15);
  });

  test('revenue is bucketed by IST day for the last 7 days', () => {
    const stats = salesStats(orders, now);
    expect(stats.revenueByDay).toHaveLength(7);
    expect(stats.revenueByDay.at(-1)).toEqual({ date: '2026-10-06', orders: 2, revenue: 180 });
    expect(stats.revenueByDay.at(-2)).toEqual({ date: '2026-10-05', orders: 1, revenue: 150 });
  });

  test('orders are counted by IST hour', () => {
    const stats = salesStats(orders, now);
    expect(stats.ordersByHour[12].orders).toBe(2); // 06:30Z and 07:00Z are 12:00 and 12:30 IST
  });

  test('top items are ranked by quantity sold', () => {
    const stats = salesStats(orders, now);
    expect(stats.topItems[0]).toEqual({ name: 'Vada Pav', qty: 6, revenue: 120 });
    expect(stats.topItems.map((i) => i.name)).not.toContain('Veg Thali');
  });

  test('IST date rolls over at midnight India time, not UTC', () => {
    expect(istDate(new Date('2026-10-05T18:29:00Z'))).toBe('2026-10-05');
    expect(istDate(new Date('2026-10-05T18:31:00Z'))).toBe('2026-10-06');
  });

  test('the stats endpoint is admin only', async () => {
    const t = await setup();
    expect((await t.api.get('/api/admin/stats').set(t.staff)).status).toBe(403);
    const res = await t.api.get('/api/admin/stats').set(t.admin);
    expect(res.status).toBe(200);
    expect(res.body.today).toBeDefined();
  });
});
