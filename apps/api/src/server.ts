import { buildApp } from "./app.js";
import { env } from "./env.js";

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`Hearth API listening on http://${env.API_HOST}:${env.API_PORT}`);
    app.log.info(`AI provider: ${env.AI_PROVIDER}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
