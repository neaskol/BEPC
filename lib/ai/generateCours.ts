// Function 4 — Génération d'un cours complet pour un chapitre BEPC
// Règle docs/ia.md : sortie IA validée par Zod, persistance faite dans app/cours/actions.ts

import { z } from "zod";
import { anthropic, MODEL } from "@/lib/anthropic";

// ============================================================
// Schéma Zod du contenu_json (docs/contenu.md)
// ============================================================
export const CoursContentSchema = z.object({
  objectifs: z.array(z.string()),
  sections: z.array(
    z.object({
      titre: z.string(),
      contenu: z.string(),
      exemples: z.array(
        z.object({
          enonce: z.string(),
          solution: z.string(),
        })
      ),
      quiz_section: z.object({
        question: z.string(),
        type: z.literal("qcm"),
        choix: z.array(z.string()),
        bonne_reponse: z.number(),
        explication: z.string(),
      }),
    })
  ),
  resume: z.string(),
  quiz_final: z.array(
    z.object({
      question: z.string(),
      type: z.literal("qcm"),
      choix: z.array(z.string()),
      bonne_reponse: z.number(),
      explication: z.string(),
    })
  ),
  mots_cles: z.array(
    z.object({
      terme: z.string(),
      definition: z.string(),
      exemple: z.string(),
    })
  ),
});

export type CoursContent = z.infer<typeof CoursContentSchema>;

// ============================================================
// Prompts
// ============================================================
const SYSTEM_PROMPT = `Tu es un professeur pédagogue qui enseigne aux élèves malgaches préparant le BEPC.
Tu crées des cours clairs, progressifs, avec des exemples du quotidien malgache.
Niveau de langage : accessible, jamais de jargon sans explication.
Réponds UNIQUEMENT avec du JSON valide correspondant au schéma fourni.`;

const SCHEMA_JSON = JSON.stringify(
  {
    objectifs: ["string — objectif pédagogique"],
    sections: [
      {
        titre: "string",
        contenu: "string — explication claire et accessible",
        exemples: [
          {
            enonce: "string — exemple concret malgache",
            solution: "string",
          },
        ],
        quiz_section: {
          question: "string",
          type: "qcm",
          choix: ["string", "string", "string", "string"],
          bonne_reponse: 0,
          explication: "string",
        },
      },
    ],
    resume: "string — 3 phrases maximum",
    quiz_final: [
      {
        question: "string",
        type: "qcm",
        choix: ["string", "string", "string", "string"],
        bonne_reponse: 0,
        explication: "string",
      },
    ],
    mots_cles: [
      {
        terme: "string",
        definition: "string — explication simple",
        exemple: "string — exemple malgache",
      },
    ],
  },
  null,
  2
);

const buildUserPrompt = (titresChapitre: string, nomMatiere: string) =>
  `Crée un cours complet sur "${titresChapitre}" pour des élèves de 3ème préparant le BEPC.
Matière : ${nomMatiere}

Schéma JSON attendu:
${SCHEMA_JSON}

Contraintes:
- 3 à 5 sections maximum
- Chaque section avec un exemple concret malgache (riz, zébu, Ariary, villes)
- Un mini-quiz par section (1 question QCM)
- Un quiz final de 3 à 5 questions QCM
- Un résumé en 3 phrases maximum
- Des mots-clés avec définitions simples`;

// ============================================================
// Fonction principale
// ============================================================

/**
 * generateCours — Function 4
 * Appelle l'API Anthropic et retourne un CoursContent validé par Zod.
 * La persistance en base est faite dans app/cours/actions.ts.
 */
export async function generateCours(params: {
  titresChapitre: string;
  nomMatiere: string;
}): Promise<CoursContent> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(params.titresChapitre, params.nomMatiere),
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
      `La réponse IA n'est pas du JSON valide : ${jsonText.slice(0, 300)}`
    );
  }

  // Validation Zod — lève ZodError si le schéma n'est pas respecté
  return CoursContentSchema.parse(raw);
}
