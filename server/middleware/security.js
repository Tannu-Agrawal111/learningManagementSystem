const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for development
  message: { message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Comfortable limit for dev
  message: { message: 'Too many login attempts. Please try again after 10 minutes.' }
});

// ─── Express 5 Safe: NoSQL Injection Sanitizer ───────────────────────────────
// express-mongo-sanitize crashes on Express 5 (req.query is read-only getter).
// This custom middleware sanitizes req.body only, which is where injection payloads arrive.
const sanitizeNoSQL = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key in obj) {
    if (key.startsWith('$')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeNoSQL(obj[key]);
    }
  }
  return obj;
};

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeNoSQL(req.body);
  next();
};

// ─── Express 5 Safe: XSS Sanitizer ──────────────────────────────────────────
// xss-clean is Express 4 only. This custom middleware cleans HTML from user input.
const sanitizeXSS = (obj) => {
  if (typeof obj === 'string') {
    return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/javascript:/gi, '');
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      obj[key] = sanitizeXSS(obj[key]);
    }
  }
  return obj;
};

const xssCleanMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeXSS(req.body);
  next();
};

// Role-Based Access Control (RBAC) middleware
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No session found' });
    }
    
    // Normalize role strings (handling case variations)
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    
    if (normalizedAllowed.length && !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  globalLimiter,
  authLimiter,
  mongoSanitize: mongoSanitizeMiddleware,
  xssClean: xssCleanMiddleware,
  helmet: helmet(),
  authorize
};

