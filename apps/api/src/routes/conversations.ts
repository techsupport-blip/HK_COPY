import type { FastifyInstance } from "fastify";
import { SendMessageRequest } from "@hearth/shared";
import {
  listConversations,
  listMessages,
  sendMessage,
} from "../services/conversation.service.js";
import { wingmanAssist, wingmanOpeners } from "../services/wingman.service.js";
import { userId } from "../plugins/auth.js";

export async function conversationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/conversations", async (req) => listConversations(userId(req)));

  app.get("/conversations/:id/messages", async (req) => {
    const { id } = req.params as { id: string };
    return listMessages(userId(req), id);
  });

  app.post("/conversations/:id/messages", async (req) => {
    const { id } = req.params as { id: string };
    const body = SendMessageRequest.parse(req.body);
    return sendMessage(userId(req), id, body.content);
  });

  app.post("/conversations/:id/wingman/openers", async (req) => {
    const { id } = req.params as { id: string };
    return wingmanOpeners(userId(req), id);
  });

  app.post("/conversations/:id/wingman/assist", async (req) => {
    const { id } = req.params as { id: string };
    return wingmanAssist(userId(req), id);
  });
}
