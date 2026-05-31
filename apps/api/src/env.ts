import { z } from "zod";

/**
 * Centralized, validated environment configuration. Fails fast at boot if a
 * required variable is missing or malformed.
 */
const EnvSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_ACCESS_SECRET: z.string().min(8).default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(8).default("dev-refresh-secret-change-me"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  AI_PROVIDER: z.enum(["mock", "anthropic"]).default("mock"),
  ANTHROPIC_API_KEY: z.string().default(""),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default("0.0.0.0"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

// If anthropic is selected without a key, fall back to mock so the app still runs.
if (env.AI_PROVIDER === "anthropic" && !env.ANTHROPIC_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[hearth] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is empty — falling back to mock provider.",
  );
  env.AI_PROVIDER = "mock";
}
