// In-memory implementation of the store interface. Used by the test suite
// (so CI needs no database) and by `npm run dev`.
const { MENU } = require('../seed');

const STATUS_TIMESTAMP = {
  PREPARING: 'preparingAt',
  READY: 'readyAt',
  COLLECTED: 'collectedAt',
  CANCELLED: 'cancelledAt',
};

function memoryStore({ seedMenu = true } = {}) {
  const users = [];
  let menu = [];
  const orders = [];
  let nextUserId = 1;
  let nextMenuId = 1;
  let nextOrderId = 1;

  if (seedMenu) {
    menu = MENU.map((item) => ({ id: nextMenuId++, isAvailable: true, ...item }));
  }

  const clone = (value) => (value ? structuredClone(value) : value);
  const withStudent = (order) => {
    const user = users.find((u) => u.id === order.userId);
    return { ...clone(order), studentName: user ? user.name : 'Unknown' };
  };

  return {
    kind: 'memory',
    async ping() {
      return true;
    },

    async findUserByEmail(email) {
      return clone(users.find((u) => u.email === email));
    },
    async findUserById(id) {
      return clone(users.find((u) => u.id === id));
    },
    async createUser({ name, email, passwordHash, role }) {
      const user = { id: nextUserId++, name, email, passwordHash, role };
      users.push(user);
      return clone(user);
    },

    async listMenu({ includeUnavailable = false } = {}) {
      return clone(menu.filter((m) => includeUnavailable || m.isAvailable));
    },
    async getMenuItem(id) {
      return clone(menu.find((m) => m.id === id));
    },
    async createMenuItem(data) {
      const item = { id: nextMenuId++, isAvailable: true, ...data };
      menu.push(item);
      return clone(item);
    },
    async updateMenuItem(id, data) {
      const item = menu.find((m) => m.id === id);
      if (!item) return null;
      Object.assign(item, data);
      return clone(item);
    },
    async deleteMenuItem(id) {
      const before = menu.length;
      menu = menu.filter((m) => m.id !== id);
      return menu.length < before;
    },

    async createOrder({ userId, token, total, items }) {
      const order = {
        id: nextOrderId++,
        userId,
        token,
        status: 'PLACED',
        total,
        items,
        createdAt: new Date().toISOString(),
        preparingAt: null,
        readyAt: null,
        collectedAt: null,
        cancelledAt: null,
      };
      orders.push(order);
      return withStudent(order);
    },
    async getOrder(id) {
      const order = orders.find((o) => o.id === id);
      return order ? withStudent(order) : null;
    },
    async listOrdersByUser(userId) {
      return orders
        .filter((o) => o.userId === userId)
        .sort((a, b) => b.id - a.id)
        .map(withStudent);
    },
    async listActiveOrders() {
      return orders
        .filter((o) => ['PLACED', 'PREPARING', 'READY'].includes(o.status))
        .sort((a, b) => a.id - b.id)
        .map(withStudent);
    },
    async updateOrderStatus(id, status) {
      const order = orders.find((o) => o.id === id);
      if (!order) return null;
      order.status = status;
      if (STATUS_TIMESTAMP[status]) order[STATUS_TIMESTAMP[status]] = new Date().toISOString();
      return withStudent(order);
    },
    async listOrdersSince(since) {
      return orders.filter((o) => new Date(o.createdAt) >= since).map(withStudent);
    },
    async countActiveByStatus() {
      const counts = {};
      for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
      return counts;
    },
  };
}

module.exports = { memoryStore, STATUS_TIMESTAMP };
