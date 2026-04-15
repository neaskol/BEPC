// Function 1 — Extraction structurée d'un sujet BEPC depuis du texte PDF
// Règle docs/ia.md : toute sortie IA est validée par Zod puis persistée (persistAiJson)

import { anthropic, MODEL } from "@/lib/anthropic";
import {
  SujetExtractSchema,
  type SujetExtract,
} from "@/lib/schemas/sujet";

const SYSTEM_PROMPT = `Tu es un assistant expert en examens BEPC malgaches.
Tu analyses des sujets d'examen et extrais des données structurées.
Tu réponds UNIQUEMENT avec du JSON valide, sans markdown, sans explication.`;

const USER_TEMPLATE = (text: string) => `Analyse ce sujet d'examen BEPC et retourne un JSON avec cette structure exacte :

{
  "titre": "Titre descriptif du sujet (ex: Mathématiques BEPC 2023)",
  "matiere_code": "maths|francais|svt|histoire_geo|physique|anglais",
  "annee": 2023,
  "exercices": [
    {
      "ordre": 1,
      "type": "qcm|calcul|redaction|vrai_faux",
      "enonce": "Texte complet de la question",
      "choix_json": ["A) option1", "B) option2"] (null si pas qcm),
      "corrige": "Réponse ou corrigé concis",
      "points": 2
    }
  ]
}

Règles :
- "qcm" : question à choix multiples → remplir choix_json
- "calcul" : problème mathématique ou calcul numérique
- "redaction" : question ouverte, analyse, rédaction
- "vrai_faux" : affirmation à évaluer
- Extraire TOUS les exercices du sujet
- annee : null si non mentionnée
- Le corrigé doit être concis mais correct

---
TEXTE DU SUJET :
${text.slice(0, 28000)}`;

/**
 * persistAiJson — valide la sortie IA avec Zod et appelle la fonction de persistance.
 * Garantit qu'aucune donnée IA non validée n'entre en base (règle docs/ia.md).
 */
export async function persistAiJson<T>(
  raw: unknown,
  schema: { parse: (v: unknown) => T },
  persist: (validated: T) => Promise<void>
): Promise<T> {
  const validated = schema.parse(raw); // ZodError si invalide → lève une exception
  await persist(validated);
  return validated;
}

/**
 * extractSujetFromText — Function 1
 * Envoie le texte extrait du PDF à Claude et retourne un SujetExtract validé.
 */
export async function extractSujetFromText(
  pdfText: string
): Promise<SujetExtract> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: USER_TEMPLATE(pdfText),
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Réponse IA inattendue : pas de bloc texte.");
  }

  // Nettoyer les éventuels délimiteurs markdown
  const jsonText = block.text.replace(/^```json\s*|\s*```$/g, "").trim();

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `La réponse IA n'est pas du JSON valide : ${jsonText.slice(0, 200)}`
    );
  }

  // Validation Zod — lève ZodError si le schéma n'est pas respecté
  return SujetExtractSchema.parse(raw);
}
