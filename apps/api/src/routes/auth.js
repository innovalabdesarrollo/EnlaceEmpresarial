import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Cuenta } from '../models/index.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const cuenta = await Cuenta.findOne({ email: String(email).toLowerCase().trim() });
  if (!cuenta || cuenta.estado !== 'activa') {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const ok = await bcrypt.compare(password, cuenta.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  cuenta.ultimoAcceso = new Date();
  await cuenta.save();

  res.json({
    token: signToken(cuenta),
    user: {
      id: cuenta._id,
      email: cuenta.email,
      rol: cuenta.rol,
      clienteId: cuenta.clienteId,
      nombre: cuenta.nombreCompleto,
    },
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
