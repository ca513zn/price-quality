import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Neon requires SSL in production
  const ssl =
    process.env.NODE_ENV === "production" || connectionString?.includes("neon")
      ? { rejectUnauthorized: false }
      : undefined;

  const adapter = new PrismaPg({ connectionString, ssl });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
