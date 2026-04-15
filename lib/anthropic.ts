import Anthropic from "@anthropic-ai/sdk";

// Modèle principal et fallback selon docs/ia.md
export const MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
export const FALLBACK_MODEL = "claude-sonnet-4-5-20250929";

// Client singleton avec retry×2 et timeout 30s (config docs/ia.md)
// La clé API est validée au moment de l'appel (pas à l'import) pour ne pas bloquer le build
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "missing-key",
  timeout: 30_000,
  maxRetries: 2,
});

if (process.env.NODE_ENV !== "production" && !process.env.ANTHROPIC_API_KEY) {
  console.warn("[BEPC] ANTHROPIC_API_KEY manquante — les appels IA échoueront.");
}
