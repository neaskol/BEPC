import Anthropic from "@anthropic-ai/sdk";

// Modèle principal et fallback selon docs/ia.md
export const MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
export const FALLBACK_MODEL = "claude-sonnet-4-5-20250929";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY est manquante. Ajoute-la dans .env.local"
  );
}

// Client singleton avec retry×2 et timeout 30s (config docs/ia.md)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});
