import type { FastifyInstance } from "fastify";
import { generateDailyMatches } from "../services/matchmaker.service.js";
import {
  getMatchDetail,
  listMatches,
} from "../services/match-read.service.js";
import { getActivitiesForMatch } from "../services/activity.service.js";
import { actOnMatch } from "../services/conversation.service.js";
import { userId } from "../plugins/auth.js";

export async function matchRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/matches/generate", async (req) => {
    const created = await generateDailyMatches(userId(req));
    return { created };
  });

  app.get("/matches", async (req) => listMatches(userId(req)));

  app.get("/matches/:id", async (req) => {
    const { id } = req.params as { id: string };
    return getMatchDetail(userId(req), id);
  });

  app.post("/matches/:id/like", async (req) => {
    const { id } = req.params as { id: string };
    return actOnMatch(userId(req), id, "like");
  });

  app.post("/matches/:id/pass", async (req) => {
    const { id } = req.params as { id: string };
    return actOnMatch(userId(req), id, "pass");
  });

  app.get("/matches/:id/activities", async (req) => {
    const { id } = req.params as { id: string };
    return getActivitiesForMatch(userId(req), id);
  });
}
