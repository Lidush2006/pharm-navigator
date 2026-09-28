// ==================== АВТОРИЗАЦИЯ ====================
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pharm-navigator-secret-key-2026';
const TOKEN_LIFETIME = '30d';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function checkPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function createToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: TOKEN_LIFETIME }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Неверный токен' });
  }

  req.userId = decoded.userId;
  next();
}