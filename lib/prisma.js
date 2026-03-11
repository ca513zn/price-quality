import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const isNeon = connectionString?.includes("neon.tech");
  const isProduction = process.env.NODE_ENV === "production";

  // Only use SSL for Neon/production — local PostgreSQL doesn't support it
  const ssl = isNeon || isProduction ? { rejectUnauthorized: false } : false;

  const adapter = new PrismaPg({ connectionString, ssl });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
