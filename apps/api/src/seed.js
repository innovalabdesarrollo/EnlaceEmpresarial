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

async function upsertCliente({
  razonSocial,
  identificadorFiscal,
  emailNotificaciones,
  telefono,
  departamento = '',
  sharePointPath = '',
}) {
  return Cliente.findOneAndUpdate(
    { identificadorFiscal },
    {
      razonSocial,
      identificadorFiscal,
      emailNotificaciones,
      telefono,
      departamento,
      sharePointPath,
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
    departamento: 'PERSONAS FISICAS / ACT EMPRESARIAL',
    sharePointPath: 'PERSONAS FISICAS/ACT EMPRESARIAL/AAA010101AAA_ACME COMERCIAL',
  });

  await upsertCliente({
    razonSocial: 'Beta Logistica SA de CV',
    identificadorFiscal: 'BBB020202BBB',
    emailNotificaciones: 'beta@demo.local',
    telefono: '5551000002',
    departamento: 'PERSONAS FISICAS / ACT EMPRESARIAL',
    sharePointPath: 'PERSONAS FISICAS/ACT EMPRESARIAL/BBB020202BBB_BETA LOGISTICA',
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

  const dept = 'PERSONAS FISICAS / ACT EMPRESARIAL';
  const reglasBase = [
    {
      nombre: 'Facturas por nombre',
      descripcion: 'Detecta archivos con “factura” en el nombre',
      criterio: 'factura',
      carpetaDestino: 'Facturas',
      asuntoPlantilla: '[RFC]_FACTURA',
      departamento: dept,
      periodicidad: 'MENSUAL',
      prioridad: 10,
      peso: 0.05,
    },
    {
      nombre: 'Estados de cuenta / bancos',
      descripcion: 'Detecta estados de cuenta o bancos',
      criterio: 'estado.?cuenta|banco',
      carpetaDestino: '02 BANCOS',
      asuntoPlantilla: '[RFC]_ESTADO DE CUENTA',
      departamento: dept,
      periodicidad: 'MENSUAL',
      prioridad: 20,
      peso: 0.05,
    },
    {
      nombre: 'CSF — Constancias situación fiscal',
      descripcion: 'Palabra clave CSF → 01 GENERALES',
      criterio: 'CSF',
      carpetaDestino: '01 GENERALES',
      asuntoPlantilla: '[RFC]_CSF',
      departamento: dept,
      periodicidad: 'MENSUAL',
      prioridad: 5,
      peso: 0.12,
    },
    {
      nombre: 'Opinión de cumplimiento SAT',
      descripcion: 'Palabra clave POSITIVA',
      criterio: 'POSITIVA',
      carpetaDestino: '01 GENERALES',
      asuntoPlantilla: '[RFC]_OPINION DE CUMPLIMIENTO SAT',
      departamento: dept,
      periodicidad: 'MENSUAL',
      prioridad: 6,
      peso: 0.12,
    },
    {
      nombre: 'Declaración impuestos mensuales',
      descripcion: 'ACUSE ISR SALARIOS o ACUSE + DECLARACION',
      criterio: 'ACUSE\\s*ISR\\s*SALARIOS|ACUSE.*DECLARACION|DECLARACION.*ACUSE',
      carpetaDestino: '03 IMPUESTOS',
      asuntoPlantilla: '[RFC]_DECLARACION IMPUESTOS MENSUALES SAT',
      departamento: dept,
      periodicidad: 'MENSUAL',
      prioridad: 7,
      peso: 0.12,
    },
    {
      nombre: 'Declaración anual',
      descripcion: 'Palabra clave ANUAL',
      criterio: 'ANUAL',
      carpetaDestino: '06 DECLARACION ANUAL',
      asuntoPlantilla: '[RFC]_DECLARACION ANUAL SAT',
      departamento: dept,
      periodicidad: 'ANUAL',
      prioridad: 8,
      peso: 0.12,
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
    {
      nombre: '01 GENERALES',
      ruta: '/PERSONAS FISICAS/ACT EMPRESARIAL/01 GENERALES',
      tipoClasificacion: 'generales',
    },
    {
      nombre: '02 BANCOS',
      ruta: '/PERSONAS FISICAS/ACT EMPRESARIAL/02 BANCOS',
      tipoClasificacion: 'bancos',
    },
    {
      nombre: '03 IMPUESTOS',
      ruta: '/PERSONAS FISICAS/ACT EMPRESARIAL/03 IMPUESTOS',
      tipoClasificacion: 'impuestos',
    },
    {
      nombre: '04 INFORMATIVAS',
      ruta: '/PERSONAS FISICAS/ACT EMPRESARIAL/04 INFORMATIVAS',
      tipoClasificacion: 'informativas',
    },
    {
      nombre: '05 XML',
      ruta: '/PERSONAS FISICAS/ACT EMPRESARIAL/05 XML',
      tipoClasificacion: 'xml',
    },
    {
      nombre: '06 DECLARACION ANUAL',
      ruta: '/PERSONAS FISICAS/ACT EMPRESARIAL/06 DECLARACION ANUAL',
      tipoClasificacion: 'anual',
    },
    {
      nombre: '07 CEDULARES',
      ruta: '/PERSONAS FISICAS/ACT EMPRESARIAL/07 CEDULARES',
      tipoClasificacion: 'cedulares',
    },
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
