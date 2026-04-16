// Constantes XP/Niveaux — fichier séparé pour éviter les exports non-fonction
// dans les "use server" files (contrainte Next.js)

export const NIVEAUX = [
  { niveau: 1, nom: "Lycéen", xp_requis: 0 },
  { niveau: 2, nom: "Étudiant", xp_requis: 200 },
  { niveau: 3, nom: "Apprenti", xp_requis: 500 },
  { niveau: 4, nom: "Chercheur", xp_requis: 1000 },
  { niveau: 5, nom: "Expert", xp_requis: 2000 },
  { niveau: 6, nom: "Lauréat", xp_requis: 4000 },
  { niveau: 7, nom: "Champion BEPC", xp_requis: 7000 },
] as const;

export const NIVEAU_BADGE_CODES: Record<number, string> = {
  2: "niveau_2",
  3: "niveau_3",
  4: "niveau_4",
  5: "niveau_5",
  6: "niveau_6",
  7: "niveau_7",
};
