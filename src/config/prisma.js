// require("dotenv").config();

// const { PrismaClient } = require("@prisma/client");

// const prisma = new PrismaClient();

// module.exports = prisma;

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to your .env file.");
}

// Create a pg pool and pass it to Prisma adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Prisma v7 requires adapter (or accelerateUrl)
const prisma = new PrismaClient({ adapter });

// Helpful for tests to close open handles
async function disconnectPrisma() {
  await prisma.$disconnect();
  await pool.end();
}

module.exports = {
  prisma,
  disconnectPrisma,
};
