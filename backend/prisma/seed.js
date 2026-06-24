const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs'); 

const connectionString = process.env.DATABASE_URL || "postgresql://dev_user:dev_password_2026@db:5432/facadmin_inventario?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando el poblado de la base de datos...');

  // 1. Limpiar datos existentes
  await prisma.movimiento.deleteMany({});
  await prisma.embalaje.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.usuario.deleteMany({});

  //  GENERAR CONTRASEÑA ENCRIPTADA PARA EL ADMIN
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Buap2026*', salt);

  // 2. Crear Usuarios
  const encargado = await prisma.usuario.create({
    data: {
      id_interno: 'EMP-2026-0001',
      nombre: 'Alejandro Cholula Olvera',
      correo: 'alejandro.cholula@buap.mx',
      departamento: 'Cómputo y Mantenimiento',
      rol: 'ADMIN',
      password: adminPasswordHash, //  SE INYECTA LA CONTRASEÑA
    },
  });

  const solicitanteLimpieza = await prisma.usuario.create({
    data: {
      id_interno: 'EMP-2026-0002',
      nombre: 'Don Roque Pérez',
      correo: null,
      departamento: 'Intendencia y Limpieza',
      rol: 'SOLICITANTE',
    },
  });

  const solicitanteDocente = await prisma.usuario.create({
    data: {
      id_interno: 'EMP-2026-0003',
      nombre: 'Mtra. María Elena Rosas',
      correo: 'maria.elena@buap.mx',
      departamento: 'Licenciatura en Administración',
      rol: 'SOLICITANTE',
    },
  });

  console.log(' Usuarios de prueba creados.');

  // 3. Crear Productos (Insumos)
  const cloro = await prisma.producto.create({
    data: {
      nombre: 'Cloro Líquido Concentrado',
      categoria: 'Limpieza',
      unidad_medida: 'Litros',
      stock_actual: 40.00,
      stock_minimo: 10.00,
      embalajes: { create: { nombre_embalaje: 'Porrón de 20L', factor_conversion: 20.00 } },
    },
  });

  const jabon = await prisma.producto.create({
    data: {
      nombre: 'Jabón Multiusos en Polvo',
      categoria: 'Limpieza',
      unidad_medida: 'Kg',
      stock_actual: 15.50,
      stock_minimo: 5.00,
      embalajes: { create: { nombre_embalaje: 'Bolsa Industrial 5Kg', factor_conversion: 5.00 } },
    },
  });

  const papel = await prisma.producto.create({
    data: {
      nombre: 'Papel Higiénico Institucional',
      categoria: 'Higiene',
      unidad_medida: 'Piezas',
      stock_actual: 120.00,
      stock_minimo: 30.00,
      embalajes: { create: { nombre_embalaje: 'Caja con 48 piezas', factor_conversion: 48.00 } },
    },
  });

  const marcadores = await prisma.producto.create({
    data: {
      nombre: 'Marcador para Pizarrón Blanco Negro',
      categoria: 'Papelería',
      unidad_medida: 'Piezas',
      stock_actual: 50.00,
      stock_minimo: 15.00,
    },
  });

  console.log(' Catálogo de productos creados.');

  // 4. Crear Movimientos Históricos
  const haceDosDias = new Date(); haceDosDias.setDate(haceDosDias.getDate() - 2);
  const hoy = new Date();

  await prisma.movimiento.createMany({
    data: [
      { producto_id: cloro.id, tipo: 'SALIDA', cantidad: 2.50, solicitante_id: solicitanteLimpieza.id, encargado_id: encargado.id, fecha: haceDosDias, observaciones: 'Limpieza baños' },
      { producto_id: jabon.id, tipo: 'SALIDA', cantidad: 1.20, solicitante_id: solicitanteLimpieza.id, encargado_id: encargado.id, fecha: haceDosDias, observaciones: 'Explanada' },
      { producto_id: papel.id, tipo: 'SALIDA', cantidad: 12.00, solicitante_id: solicitanteLimpieza.id, encargado_id: encargado.id, fecha: haceDosDias, observaciones: 'Cubículos' },
      { producto_id: marcadores.id, tipo: 'SALIDA', cantidad: 3.00, solicitante_id: solicitanteDocente.id, encargado_id: encargado.id, fecha: hoy, observaciones: 'Bloque clases' },
    ],
  });

  console.log(' ¡Base de datos poblada con éxito!');
}

main()
  .catch((e) => {
    console.error(' Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });