import type { FastifyInstance } from "fastify";
import { UpdateProfileRequest } from "@hearth/shared";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { toProfileDTO } from "../lib/dto.js";
import { stringifyJson } from "../lib/json.js";
import { userId } from "../plugins/auth.js";

export async function profileRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.authenticate }, async (req) => {
    const id = userId(req);
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user?.profile) throw notFound("Profile not found");
    return {
      id: user.id,
      email: user.email,
      profile: toProfileDTO(user.profile),
    };
  });

  app.put("/me/profile", { preHandler: app.authenticate }, async (req) => {
    const id = userId(req);
    const body = UpdateProfileRequest.parse(req.body);
    const profile = await prisma.profile.update({
      where: { userId: id },
      data: {
        ...(body.displayName !== undefined && { displayName: body.displayName }),
        ...(body.age !== undefined && { age: body.age }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.seekingGenders !== undefined && {
          seekingGenders: stringifyJson(body.seekingGenders),
        }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.photoUrls !== undefined && {
          photoUrls: stringifyJson(body.photoUrls),
        }),
      },
    });
    return toProfileDTO(profile);
  });
}
