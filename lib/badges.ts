// Catalogue complet des badges — référence côté client

export interface BadgeMeta {
  code: string;
  nom: string;
  description: string;
  categorie: "demarrage" | "regularite" | "maitrise" | "performance" | "special" | "niveau";
  estSecret: boolean;
  emoji: string;
}

export const BADGES_CATALOGUE: BadgeMeta[] = [
  // Démarrage
  { code: "premier_pas", nom: "Voninkazo", description: "Terminer ton premier cours complet", categorie: "demarrage", estSecret: false, emoji: "🌸" },
  { code: "premier_exercice", nom: "Karatasy voalohany", description: "Faire ton premier exercice", categorie: "demarrage", estSecret: false, emoji: "✏️" },
  { code: "diagnostic", nom: "Mpitsabo", description: "Compléter le diagnostic initial", categorie: "demarrage", estSecret: false, emoji: "🩺" },

  // Régularité
  { code: "streak_3", nom: "Voatobia", description: "3 jours de révision d'affilée", categorie: "regularite", estSecret: false, emoji: "🔥" },
  { code: "streak_7", nom: "Hafanam-po", description: "7 jours de suite — une semaine entière !", categorie: "regularite", estSecret: false, emoji: "🔥" },
  { code: "streak_30", nom: "Maharitra", description: "30 jours de suite — tu es incroyable !", categorie: "regularite", estSecret: false, emoji: "⚡" },
  { code: "streak_100", nom: "Tsy mety kivy", description: "100 jours de suite — légendaire !", categorie: "regularite", estSecret: false, emoji: "👑" },
  { code: "matin_tot", nom: "Vitsika maraina", description: "S'entraîner avant 7h du matin", categorie: "regularite", estSecret: true, emoji: "🌅" },
  { code: "nuit_tard", nom: "Kintana", description: "S'entraîner après 22h", categorie: "regularite", estSecret: true, emoji: "⭐" },

  // Maîtrise
  { code: "maths_60", nom: "Ingona matematika", description: "Atteindre 60% en Maths", categorie: "maitrise", estSecret: false, emoji: "📐" },
  { code: "maths_90", nom: "Manampahaizana", description: "Atteindre 90% en Maths", categorie: "maitrise", estSecret: false, emoji: "🧮" },
  { code: "francais_60", nom: "Mpanoratra", description: "Atteindre 60% en Français", categorie: "maitrise", estSecret: false, emoji: "📝" },
  { code: "toutes_matieres_50", nom: "Mpikaroka", description: "Toutes les matières au-dessus de 50%", categorie: "maitrise", estSecret: false, emoji: "🎓" },
  { code: "cours_complet", nom: "Mpianatr'omby", description: "Finir un cours complet", categorie: "maitrise", estSecret: false, emoji: "📚" },
  { code: "tous_cours_matiere", nom: "Mahasolo tena", description: "Finir tous les cours d'une matière", categorie: "maitrise", estSecret: false, emoji: "🏆" },
  { code: "flashcards_10", nom: "Tsara saina", description: "10 flashcards maîtrisées", categorie: "maitrise", estSecret: false, emoji: "🃏" },
  { code: "exercices_50", nom: "Mpiasa mafy", description: "50 exercices réussis", categorie: "maitrise", estSecret: false, emoji: "💪" },
  { code: "cent_exercices", nom: "Ranomasina", description: "100 exercices complétés", categorie: "maitrise", estSecret: false, emoji: "🌊" },

  // Performance
  { code: "survie_parfait", nom: "Mpiahy", description: "Mode survie sans erreur", categorie: "performance", estSecret: false, emoji: "❤️" },
  { code: "chrono_serie", nom: "Mpifaninana", description: "5 bonnes réponses chrono d'affilée", categorie: "performance", estSecret: false, emoji: "⏱️" },
  { code: "examen_10", nom: "Mivoaka tsara", description: "Examen blanc > 10/20", categorie: "performance", estSecret: false, emoji: "📋" },
  { code: "examen_15", nom: "Manam-boninahitra", description: "Examen blanc > 15/20", categorie: "performance", estSecret: false, emoji: "🥇" },
  { code: "perfect_qcm", nom: "Tsy misy diso", description: "10 QCM parfaits d'affilée", categorie: "performance", estSecret: true, emoji: "🎯" },
  { code: "chapitres_5", nom: "Mpianatra be", description: "5 chapitres terminés", categorie: "performance", estSecret: false, emoji: "📖" },
  { code: "score_parfait", nom: "Tena mahasolo tena", description: "Score parfait sur un exercice", categorie: "performance", estSecret: false, emoji: "⭐" },

  // Sociaux
  { code: "premier_defi", nom: "Mpanao sahy", description: "Lancer ton premier défi", categorie: "special", estSecret: false, emoji: "⚔️" },
  { code: "defi_gagne", nom: "Mpandresy", description: "Gagner ton premier défi", categorie: "special", estSecret: false, emoji: "🥊" },
  { code: "aide_communaute", nom: "Mpampianatra", description: "Aider 5 élèves dans la communauté", categorie: "special", estSecret: false, emoji: "🤝" },
  { code: "partage", nom: "Mpiara-belona", description: "Partager un résultat sur WhatsApp", categorie: "special", estSecret: false, emoji: "📱" },

  // Spéciaux
  { code: "pret_bepc", nom: "Mivoaka amin'ny BEPC", description: "Jauge BEPC au-dessus de 80%", categorie: "special", estSecret: false, emoji: "🎓" },
  { code: "champion", nom: "Champion BEPC", description: "Atteindre le niveau 7", categorie: "special", estSecret: false, emoji: "🏆" },
  { code: "come_back", nom: "Tsy mety reraka", description: "Revenir après 14 jours d'absence", categorie: "special", estSecret: true, emoji: "🦋" },
  { code: "noel", nom: "Noely", description: "Réviser le 25 décembre", categorie: "special", estSecret: true, emoji: "🎄" },
  { code: "streak_recovery", nom: "Toky vaovao", description: "Reprendre après une streak brisée", categorie: "special", estSecret: false, emoji: "🌱" },

  // Niveaux
  { code: "niveau_2", nom: "Étudiant", description: "Atteindre le niveau 2", categorie: "niveau", estSecret: false, emoji: "⬆️" },
  { code: "niveau_3", nom: "Apprenti", description: "Atteindre le niveau 3", categorie: "niveau", estSecret: false, emoji: "⬆️" },
  { code: "niveau_4", nom: "Chercheur", description: "Atteindre le niveau 4", categorie: "niveau", estSecret: false, emoji: "⬆️" },
  { code: "niveau_5", nom: "Expert", description: "Atteindre le niveau 5", categorie: "niveau", estSecret: false, emoji: "⭐" },
  { code: "niveau_6", nom: "Lauréat", description: "Atteindre le niveau 6", categorie: "niveau", estSecret: false, emoji: "🌟" },
  { code: "niveau_7", nom: "Champion BEPC", description: "Atteindre le niveau 7 — tu l'as fait !", categorie: "niveau", estSecret: false, emoji: "👑" },
];

export const BADGES_PAR_CODE = Object.fromEntries(
  BADGES_CATALOGUE.map((b) => [b.code, b])
);
