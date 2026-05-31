import type { FastifyInstance } from "fastify";
import { InterviewTurnRequest } from "@hearth/shared";
import {
  completeInterview,
  getInterviewState,
  startInterview,
  submitTurn,
} from "../services/interview.service.js";
import { userId } from "../plugins/auth.js";

export async function interviewRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/interview/start", async (req) => startInterview(userId(req)));

  app.get("/interview", async (req) => getInterviewState(userId(req)));

  app.post("/interview/turn", async (req) => {
    const body = InterviewTurnRequest.parse(req.body);
    return submitTurn(userId(req), body.content);
  });

  app.post("/interview/complete", async (req) => {
    const summary = await completeInterview(userId(req));
    return { status: "complete", question: null, done: true, tasteProfileSummary: summary };
  });
}
