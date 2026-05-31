import type { FastifyInstance } from "fastify";
import { LoginRequest, RefreshRequest, RegisterRequest } from "@hearth/shared";
import {
  authenticateUser,
  clearRefreshToken,
  registerUser,
  storeRefreshToken,
  verifyStoredRefreshToken,
} from "../services/auth.service.js";
import { unauthorized } from "../lib/errors.js";
import { userId } from "../plugins/auth.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const body = RegisterRequest.parse(req.body);
    const user = await registerUser(body.email, body.password, body.displayName);
    const accessToken = await reply.accessSign({ sub: user.id });
    const refreshToken = await reply.refreshSign({ sub: user.id });
    await storeRefreshToken(user.id, refreshToken);
    return reply.code(201).send({ accessToken, refreshToken });
  });

  app.post("/auth/login", async (req, reply) => {
    const body = LoginRequest.parse(req.body);
    const user = await authenticateUser(body.email, body.password);
    const accessToken = await reply.accessSign({ sub: user.id });
    const refreshToken = await reply.refreshSign({ sub: user.id });
    await storeRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  });

  app.post("/auth/refresh", async (req, reply) => {
    const body = RefreshRequest.parse(req.body);
    let sub: string;
    try {
      // Verify the body token against the refresh namespace instance.
      const payload = (app as any).jwt.refresh.verify(body.refreshToken) as {
        sub: string;
      };
      sub = payload.sub;
    } catch {
      throw unauthorized("Invalid refresh token");
    }
    await verifyStoredRefreshToken(sub, body.refreshToken);
    const accessToken = await reply.accessSign({ sub });
    const refreshToken = await reply.refreshSign({ sub });
    await storeRefreshToken(sub, refreshToken);
    return { accessToken, refreshToken };
  });

  app.post(
    "/auth/logout",
    { preHandler: app.authenticate },
    async (req, reply) => {
      await clearRefreshToken(userId(req));
      return reply.code(204).send();
    },
  );
}
