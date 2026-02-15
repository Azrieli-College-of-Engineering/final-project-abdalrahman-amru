// Ensure .env is loaded
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create and export Prisma client instance
const prisma = new PrismaClient({ adapter });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

module.exports = { prisma, pool };
