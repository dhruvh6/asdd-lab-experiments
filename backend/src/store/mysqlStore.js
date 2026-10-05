// MySQL implementation of the store interface used in the deployed stack.
const mysql = require('mysql2/promise');

const STATUS_COLUMN = {
  PREPARING: 'preparing_at',
  READY: 'ready_at',
  COLLECTED: 'collected_at',
  CANCELLED: 'cancelled_at',
};

const iso = (value) => (value ? new Date(value).toISOString() : null);

const toUser = (row) =>
  row && { id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash, role: row.role };

const toMenuItem = (row) =>
  row && {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    isVeg: Boolean(row.is_veg),
    isAvailable: Boolean(row.is_available),
  };

function mysqlStore(config) {
  const pool = mysql.createPool({ ...config, timezone: 'Z', connectionLimit: 10 });

  async function attachItems(rows) {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [items] = await pool.query(
      'SELECT order_id, menu_item_id, name, price, qty FROM order_items WHERE order_id IN (?)',
      [ids],
    );
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      studentName: row.student_name,
      token: row.token,
      status: row.status,
      total: Number(row.total),
      createdAt: iso(row.created_at),
      preparingAt: iso(row.preparing_at),
      readyAt: iso(row.ready_at),
      collectedAt: iso(row.collected_at),
      cancelledAt: iso(row.cancelled_at),
      items: items
        .filter((i) => i.order_id === row.id)
        .map((i) => ({ menuItemId: i.menu_item_id, name: i.name, price: Number(i.price), qty: i.qty })),
    }));
  }

  const ORDER_SELECT = 'SELECT o.*, u.name AS student_name FROM orders o JOIN users u ON u.id = o.user_id';

  return {
    kind: 'mysql',
    pool,
    async ping() {
      await pool.query('SELECT 1');
      return true;
    },

    async findUserByEmail(email) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return toUser(rows[0]);
    },
    async findUserById(id) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return toUser(rows[0]);
    },
    async createUser({ name, email, passwordHash, role }) {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role],
      );
      return { id: result.insertId, name, email, passwordHash, role };
    },

    async listMenu({ includeUnavailable = false } = {}) {
      const where = includeUnavailable ? '' : 'WHERE is_available = TRUE';
      const [rows] = await pool.query(`SELECT * FROM menu_items ${where} ORDER BY category, name`);
      return rows.map(toMenuItem);
    },
    async getMenuItem(id) {
      const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
      return toMenuItem(rows[0]);
    },
    async createMenuItem({ name, category, price, isVeg = true }) {
      const [result] = await pool.query(
        'INSERT INTO menu_items (name, category, price, is_veg) VALUES (?, ?, ?, ?)',
        [name, category, price, isVeg],
      );
      return this.getMenuItem(result.insertId);
    },
    async updateMenuItem(id, data) {
      const columns = { name: 'name', category: 'category', price: 'price', isVeg: 'is_veg', isAvailable: 'is_available' };
      const sets = [];
      const values = [];
      for (const [key, column] of Object.entries(columns)) {
        if (data[key] !== undefined) {
          sets.push(`${column} = ?`);
          values.push(data[key]);
        }
      }
      if (sets.length) await pool.query(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
      return this.getMenuItem(id);
    },
    async deleteMenuItem(id) {
      const [result] = await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },

    async createOrder({ userId, token, total, items }) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.query('INSERT INTO orders (user_id, token, total) VALUES (?, ?, ?)', [
          userId,
          token,
          total,
        ]);
        const lines = items.map((i) => [result.insertId, i.menuItemId, i.name, i.price, i.qty]);
        await conn.query('INSERT INTO order_items (order_id, menu_item_id, name, price, qty) VALUES ?', [lines]);
        await conn.commit();
        return this.getOrder(result.insertId);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
    async getOrder(id) {
      const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.id = ?`, [id]);
      return (await attachItems(rows))[0] || null;
    },
    async listOrdersByUser(userId) {
      const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.id DESC LIMIT 50`, [userId]);
      return attachItems(rows);
    },
    async listActiveOrders() {
      const [rows] = await pool.query(
        `${ORDER_SELECT} WHERE o.status IN ('PLACED', 'PREPARING', 'READY') ORDER BY o.id`,
      );
      return attachItems(rows);
    },
    async updateOrderStatus(id, status) {
      const column = STATUS_COLUMN[status];
      const extra = column ? `, ${column} = UTC_TIMESTAMP()` : '';
      await pool.query(`UPDATE orders SET status = ?${extra} WHERE id = ?`, [status, id]);
      return this.getOrder(id);
    },
    async listOrdersSince(since) {
      const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.created_at >= ?`, [since]);
      return attachItems(rows);
    },
    async countActiveByStatus() {
      const [rows] = await pool.query('SELECT status, COUNT(*) AS n FROM orders GROUP BY status');
      return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
    },
  };
}

module.exports = { mysqlStore };
