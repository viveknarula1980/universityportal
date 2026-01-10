import jwt from 'jsonwebtoken';
import db from '../database/db.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify user still exists
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student_id
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
}
