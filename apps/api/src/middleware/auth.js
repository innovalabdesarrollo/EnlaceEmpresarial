import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { Cuenta } from '../models/index.js';

export function signToken(cuenta) {
  return jwt.sign(
    {
      sub: cuenta._id,
      email: cuenta.email,
      rol: cuenta.rol,
      clienteId: cuenta.clienteId || null,
      nombre: cuenta.nombreCompleto,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const payload = jwt.verify(token, config.jwtSecret);
    const cuenta = await Cuenta.findById(payload.sub).lean();
    if (!cuenta || cuenta.estado !== 'activa') {
      return res.status(401).json({ error: 'Cuenta inválida' });
    }

    req.user = {
      id: cuenta._id,
      email: cuenta.email,
      rol: cuenta.rol,
      clienteId: cuenta.clienteId,
      nombre: cuenta.nombreCompleto,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }
    next();
  };
}
