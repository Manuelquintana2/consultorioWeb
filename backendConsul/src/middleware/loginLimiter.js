const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // máximo 5 intentos fallidos por IP
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next, options) => {
    const now = Date.now();
    const resetTime = req.rateLimit?.resetTime?.getTime?.() || now;
    const retrySecs = Math.ceil((resetTime - now) / 1000);

    res.status(options.statusCode).json({
      success: false,
      message: `Demasiados intentos de login. Intenta de nuevo en ${Math.ceil(retrySecs / 60)} minutos.`,
      retryAfter: retrySecs,
    });
  },
});

module.exports = loginLimiter;

