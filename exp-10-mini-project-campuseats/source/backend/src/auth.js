const jwt = require('jsonwebtoken');

function signToken(user, secret) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, secret, { expiresIn: '8h' });
}

function authenticate(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login required' });
    try {
      req.user = jwt.verify(token, secret);
      next();
    } catch {
      res.status(401).json({ error: 'Session expired, please log in again' });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this' });
    }
    next();
  };
}

module.exports = { signToken, authenticate, requireRole };
