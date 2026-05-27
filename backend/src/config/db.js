const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 1. Configurar el Pool de conexiones nativo de PostgreSQL
// Usamos la variable de entorno que Docker inyecta de forma interna
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

// 2. Enlazar el Pool con el adaptador oficial de Prisma v7
const adapter = new PrismaPg(pool);

// 3. Instanciar el cliente de Prisma inyectando el adaptador
const prisma = new PrismaClient({ adapter });

console.log(' Adaptador de PostgreSQL inicializado para Prisma.');

module.exports = prisma;