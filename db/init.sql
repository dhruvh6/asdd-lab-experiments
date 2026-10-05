-- CampusEats schema. Run automatically by the MySQL container on first start.
-- Demo users and the menu are seeded by the backend (backend/src/seed.js).

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('student', 'staff', 'admin') NOT NULL DEFAULT 'student',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  category     VARCHAR(50)  NOT NULL,
  price        DECIMAL(8,2) NOT NULL,
  is_veg       BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  token        INT NOT NULL,
  status       ENUM('PLACED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED') NOT NULL DEFAULT 'PLACED',
  total        DECIMAL(10,2) NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  preparing_at DATETIME NULL,
  ready_at     DATETIME NULL,
  collected_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
);

-- Name and price are copied into each line so that editing or deleting a
-- menu item later never changes what an old order says.
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  menu_item_id INT NULL,
  name         VARCHAR(100) NOT NULL,
  price        DECIMAL(8,2) NOT NULL,
  qty          INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);
