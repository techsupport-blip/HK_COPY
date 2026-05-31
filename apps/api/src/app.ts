import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { env } from "./env.js";
import { HttpError } from "./lib/errors.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { interviewRoutes } from "./routes/interview.js";
import { matchRoutes } from "./routes/matches.js";
import { conversationRoutes } from "./routes/conversations.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: "info" } });

  await app.register(cors, {
    origin: env.WEB_ORIGIN === "*" ? true : env.WEB_ORIGIN.split(","),
    credentials: true,
  });
  await app.register(authPlugin);

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "validation_error",
        message: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
    }
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.code, message: error.message });
    }
    app.log.error(error);
    return reply.code(500).send({ error: "internal_error", message: "Something went wrong" });
  });

  app.get("/health", async () => ({ status: "ok", service: "hearth-api" }));

  await app.register(authRoutes);
  await app.register(profileRoutes);
  await app.register(interviewRoutes);
  await app.register(matchRoutes);
  await app.register(conversationRoutes);

  return app;
}
