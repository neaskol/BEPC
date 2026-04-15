import { z } from "zod";

// Codes matières en accord avec la table matieres (seed.sql)
export const MatiereCodeSchema = z.enum([
  "maths",
  "francais",
  "svt",
  "histoire_geo",
  "physique",
  "anglais",
]);

// Structure d'un exercice extrait par l'IA
export const ExerciceExtractSchema = z.object({
  ordre: z.number().int().min(0),
  type: z.enum(["qcm", "calcul", "redaction", "vrai_faux"]),
  enonce: z.string().min(1, "L'énoncé est requis"),
  choix_json: z
    .array(z.string())
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  corrige: z.string().min(1, "Le corrigé est requis"),
  points: z.number().min(0).default(1),
});

// Structure complète d'un sujet extrait par l'IA
export const SujetExtractSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  matiere_code: MatiereCodeSchema,
  annee: z.number().int().min(1900).max(2100).optional().nullable(),
  exercices: z
    .array(ExerciceExtractSchema)
    .min(1, "Au moins un exercice est attendu"),
});

export type MatiereCode = z.infer<typeof MatiereCodeSchema>;
export type ExerciceExtract = z.infer<typeof ExerciceExtractSchema>;
export type SujetExtract = z.infer<typeof SujetExtractSchema>;

// IDs fixes des matières (définis dans seed.sql)
export const MATIERE_ID_BY_CODE: Record<MatiereCode, string> = {
  maths: "11111111-0001-0001-0001-000000000001",
  francais: "11111111-0001-0001-0001-000000000002",
  svt: "11111111-0001-0001-0001-000000000003",
  histoire_geo: "11111111-0001-0001-0001-000000000004",
  physique: "11111111-0001-0001-0001-000000000005",
  anglais: "11111111-0001-0001-0001-000000000006",
};
