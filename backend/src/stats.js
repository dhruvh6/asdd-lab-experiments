// CE-11: figures for the admin sales dashboard. Kept free of I/O so it can be
// unit tested directly.

const { istDate, istHour } = require('./time');

function salesStats(orders, now = new Date(), days = 7) {
  const counted = orders.filter((o) => o.status !== 'CANCELLED');
  const today = istDate(now);
  const todays = counted.filter((o) => istDate(new Date(o.createdAt)) === today);

  const prepMinutes = todays
    .filter((o) => o.readyAt)
    .map((o) => (new Date(o.readyAt) - new Date(o.createdAt)) / 60000);

  const revenueByDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = istDate(new Date(now.getTime() - i * 86400000));
    const dayOrders = counted.filter((o) => istDate(new Date(o.createdAt)) === day);
    revenueByDay.push({ date: day, orders: dayOrders.length, revenue: round(sum(dayOrders.map((o) => o.total))) });
  }

  const ordersByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }));
  for (const o of todays) ordersByHour[istHour(new Date(o.createdAt))].orders++;

  const itemTotals = new Map();
  for (const o of counted) {
    for (const i of o.items) {
      const entry = itemTotals.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
      entry.qty += i.qty;
      entry.revenue += i.qty * i.price;
      itemTotals.set(i.name, entry);
    }
  }
  const topItems = [...itemTotals.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return {
    today: {
      orders: todays.length,
      revenue: round(sum(todays.map((o) => o.total))),
      avgPrepMinutes: prepMinutes.length ? round(sum(prepMinutes) / prepMinutes.length) : null,
      active: todays.filter((o) => ['PLACED', 'PREPARING', 'READY'].includes(o.status)).length,
    },
    revenueByDay,
    ordersByHour,
    topItems,
  };
}

const sum = (values) => values.reduce((a, b) => a + b, 0);
const round = (value) => Math.round(value * 100) / 100;

module.exports = { salesStats };
