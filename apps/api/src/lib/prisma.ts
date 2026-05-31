import { PrismaClient } from "@prisma/client";

/** Singleton Prisma client shared across the process. */
export const prisma = new PrismaClient();
