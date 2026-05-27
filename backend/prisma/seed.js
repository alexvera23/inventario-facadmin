const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// En Prisma v7+ es obligatorio inyectar el adaptador de conexión
const connectionString = process.env.DATABASE_URL || "postgresql://dev_user:dev_password_2026@db:5432/facadmin_inventario?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(' Iniciando el poblado de la base de datos...');

  // 1. Limpiar datos existentes para evitar duplicados si se corre dos veces
  await prisma.movimiento.deleteMany({});
  await prisma.embalaje.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.usuario.deleteMany({});

  // 2. Crear Usuarios (Personal de la Facultad)
  const encargado = await prisma.usuario.create({
    data: {
      id_interno: 'EMP-2026-0001',
      nombre: 'Alejandro Cholula Olvera',
      correo: 'alejandro.cholula@buap.mx',
      departamento: 'Cómputo y Mantenimiento',
      rol: 'ADMIN',
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

  // 3. Crear Productos (Insumos) con sus Embalajes si aplica
  // Producto 1: Cloro (Líquido / Granel)
  const cloro = await prisma.producto.create({
    data: {
      nombre: 'Cloro Líquido Concentrado',
      categoria: 'Limpieza',
      unidad_medida: 'Litros',
      stock_actual: 40.00, // 40 Litros actuales
      stock_minimo: 10.00,
      embalajes: {
        create: {
          nombre_embalaje: 'Porrón de 20L',
          factor_conversion: 20.00,
        },
      },
    },
  });

  // Producto 2: Jabón en Polvo (Granel / Kg)
  const jabon = await prisma.producto.create({
    data: {
      nombre: 'Jabón Multiusos en Polvo',
      categoria: 'Limpieza',
      unidad_medida: 'Kg',
      stock_actual: 15.50, // 15.5 Kilos actuales
      stock_minimo: 5.00,
      embalajes: {
        create: {
          nombre_embalaje: 'Bolsa Industrial 5Kg',
          factor_conversion: 5.00,
        },
      },
    },
  });

  // Producto 3: Papel Higiénico (Unitario / Piezas)
  const papel = await prisma.producto.create({
    data: {
      nombre: 'Papel Higiénico Institucional',
      categoria: 'Higiene',
      unidad_medida: 'Piezas',
      stock_actual: 120.00, // 120 rollos individuales
      stock_minimo: 30.00,
      embalajes: {
        create: {
          nombre_embalaje: 'Caja con 48 piezas',
          factor_conversion: 48.00,
        },
      },
    },
  });

  // Producto 4: Marcadores (Unitario / Piezas)
  const marcadores = await prisma.producto.create({
    data: {
      nombre: 'Marcador para Pizarrón Blanco Negro',
      categoria: 'Papelería',
      unidad_medida: 'Piezas',
      stock_actual: 50.00,
      stock_minimo: 15.00,
    },
  });

  console.log(' Catálogo de productos y reglas de embalaje creados.');

  // 4. Crear Movimientos Históricos (Simular consumos de la semana)
  // Simulamos que Don Roque pidió 2.5 Litros de cloro hace 2 días
  const haceDosDias = new Date();
  haceDosDias.setDate(haceDosDias.getDate() - 2);

  // Simulamos que la Mtra. María Elena pidió 3 marcadores hoy
  const hoy = new Date();

  await prisma.movimiento.createMany({
    data: [
      {
        producto_id: cloro.id,
        tipo: 'SALIDA',
        cantidad: 2.50,
        solicitante_id: solicitanteLimpieza.id,
        encargado_id: encargado.id,
        fecha: haceDosDias,
        observaciones: 'Para limpieza de los baños del edificio A',
      },
      {
        producto_id: jabon.id,
        tipo: 'SALIDA',
        cantidad: 1.20,
        solicitante_id: solicitanteLimpieza.id,
        encargado_id: encargado.id,
        fecha: haceDosDias,
        observaciones: 'Lavado de explanada central',
      },
      {
        producto_id: papel.id,
        tipo: 'SALIDA',
        cantidad: 12.00,
        solicitante_id: solicitanteLimpieza.id,
        encargado_id: encargado.id,
        fecha: haceDosDias,
        observaciones: 'Abastecimiento semanal de cubículos',
      },
      {
        producto_id: marcadores.id,
        tipo: 'SALIDA',
        cantidad: 3.00,
        solicitante_id: solicitanteDocente.id,
        encargado_id: encargado.id,
        fecha: hoy,
        observaciones: 'Insumos para inicio de bloque de clases',
      },
    ],
  });

  console.log(' Historial de movimientos simulados inyectado.');
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