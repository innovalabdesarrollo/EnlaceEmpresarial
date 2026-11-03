import bcrypt from 'bcryptjs';
import { connectDb } from './db.js';
import { Cliente, Cuenta, ReglaClasificacion, Carpeta } from './models/index.js';

const DEMO = {
  cliente: {
    email: 'cliente@demo.local',
    password: 'cliente123',
    nombre: 'Usuario Cliente Demo',
  },
  contable: {
    email: 'contable@demo.local',
    password: 'contable123',
    nombre: 'Personal Contable Demo',
  },
};

async function upsertCliente({ razonSocial, identificadorFiscal, emailNotificaciones, telefono }) {
  return Cliente.findOneAndUpdate(
    { identificadorFiscal },
    {
      razonSocial,
      identificadorFiscal,
      emailNotificaciones,
      telefono,
      estado: 'activo',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertCuenta({ email, password, nombreCompleto, rol, clienteId }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return Cuenta.findOneAndUpdate(
    { email },
    {
      email,
      nombreCompleto,
      passwordHash,
      rol,
      clienteId: clienteId || null,
      estado: 'activa',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seed() {
  await connectDb();

  const clienteA = await upsertCliente({
    razonSocial: 'Acme Comercial SA de CV',
    identificadorFiscal: 'AAA010101AAA',
    emailNotificaciones: DEMO.cliente.email,
    telefono: '5551000001',
  });

  await upsertCliente({
    razonSocial: 'Beta Logistica SA de CV',
    identificadorFiscal: 'BBB020202BBB',
    emailNotificaciones: 'beta@demo.local',
    telefono: '5551000002',
  });

  await upsertCuenta({
    email: DEMO.cliente.email,
    password: DEMO.cliente.password,
    nombreCompleto: DEMO.cliente.nombre,
    rol: 'cliente',
    clienteId: clienteA._id,
  });

  await upsertCuenta({
    email: DEMO.contable.email,
    password: DEMO.contable.password,
    nombreCompleto: DEMO.contable.nombre,
    rol: 'contable',
    clienteId: null,
  });

  const reglasBase = [
    {
      nombre: 'Facturas por nombre',
      descripcion: 'Detecta archivos con “factura” en el nombre',
      criterio: 'factura',
      carpetaDestino: 'Facturas',
      prioridad: 10,
      peso: 0.05,
    },
    {
      nombre: 'Estados de cuenta / bancos',
      descripcion: 'Detecta estados de cuenta o bancos',
      criterio: 'estado.?cuenta|banco',
      carpetaDestino: 'Bancos',
      prioridad: 20,
      peso: 0.05,
    },
  ];

  for (const r of reglasBase) {
    await ReglaClasificacion.findOneAndUpdate(
      { nombre: r.nombre },
      { ...r, activa: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const carpetasBase = [
    { nombre: 'General', ruta: '/General', tipoClasificacion: 'general' },
    { nombre: 'Facturas', ruta: '/Facturas', tipoClasificacion: 'facturas' },
    { nombre: 'Bancos', ruta: '/Bancos', tipoClasificacion: 'bancos' },
    { nombre: 'Sin clasificar', ruta: '/Sin clasificar', tipoClasificacion: 'pendiente' },
  ];
  for (const c of carpetasBase) {
    await Carpeta.findOneAndUpdate(
      { nombre: c.nombre, clienteId: null },
      { ...c, clienteId: null, activa: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const clientes = await Cliente.countDocuments();
  const cuentas = await Cuenta.countDocuments();
  const reglas = await ReglaClasificacion.countDocuments();
  const carpetas = await Carpeta.countDocuments();

  console.log('Seed OK');
  console.log(
    `  clientes: ${clientes} · cuentas: ${cuentas} · reglas: ${reglas} · carpetas: ${carpetas}`
  );
  console.log(`  ${DEMO.cliente.email} / ${DEMO.cliente.password}`);
  console.log(`  ${DEMO.contable.email} / ${DEMO.contable.password}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed FAIL:', err.message);
  process.exit(1);
});
