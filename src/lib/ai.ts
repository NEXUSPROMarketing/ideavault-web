import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client. Lazily constructed so builds pass without
 * the key; routes return a friendly 503 when it's missing. Model IDs are
 * env-overridable so upgrades never need a code change.
 */
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured — add it to Vercel → Project → Environment Variables.",
    );
  }
  return new Anthropic({ apiKey });
}

export const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-5";
export const PACK_MODEL = process.env.ANTHROPIC_PACK_MODEL ?? "claude-sonnet-4-5";

/** Hard output caps — cost guardrails. */
export const CHAT_MAX_TOKENS = 1500;
export const PACK_MAX_TOKENS = 6000;
/** Max tool-use round-trips per chat request. */
export const CHAT_MAX_TOOL_TURNS = 4;
