import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../env.js";
import { unauthorized } from "../lib/errors.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyReply {
    accessSign(payload: { sub: string }): Promise<string>;
    refreshSign(payload: { sub: string }): Promise<string>;
  }
  interface FastifyRequest {
    accessVerify(): Promise<{ sub: string }>;
    refreshVerify(): Promise<{ sub: string }>;
  }
}

/**
 * Registers two JWT instances — short-lived access tokens and long-lived
 * refresh tokens — and an `authenticate` preHandler that guards routes.
 */
export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    namespace: "access",
    jwtVerify: "accessVerify",
    jwtSign: "accessSign",
    sign: { expiresIn: env.ACCESS_TOKEN_TTL },
  });

  await app.register(jwt, {
    secret: env.JWT_REFRESH_SECRET,
    namespace: "refresh",
    jwtVerify: "refreshVerify",
    jwtSign: "refreshSign",
    sign: { expiresIn: env.REFRESH_TOKEN_TTL },
  });

  app.decorate(
    "authenticate",
    async (req: FastifyRequest, _reply: FastifyReply) => {
      try {
        await req.accessVerify();
      } catch {
        throw unauthorized();
      }
    },
  );
});

/** Read the authenticated user id from a verified request. */
export function userId(req: FastifyRequest): string {
  return req.user.sub;
}
