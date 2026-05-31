import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { conflict, unauthorized } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict("An account with that email already exists");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: { create: { displayName } },
      interviewSession: { create: {} },
    },
  });
  return user;
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized("Invalid email or password");
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw unauthorized("Invalid email or password");
  return user;
}

/** Persist a hash of the issued refresh token so it can be rotated/revoked. */
export async function storeRefreshToken(userId: string, token: string) {
  const refreshTokenHash = await argon2.hash(token);
  await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } });
}

export async function verifyStoredRefreshToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.refreshTokenHash) throw unauthorized("Session expired");
  const ok = await argon2.verify(user.refreshTokenHash, token).catch(() => false);
  if (!ok) throw unauthorized("Session expired");
  return user;
}

export async function clearRefreshToken(userId: string) {
  await prisma.user
    .update({ where: { id: userId }, data: { refreshTokenHash: null } })
    .catch(() => undefined);
}
