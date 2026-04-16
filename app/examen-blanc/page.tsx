"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, WifiOff, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";

// ── Matières officielles BEPC ────────────────────────────────────────────────
const MATIERES = [
  { code: "maths", nom: "Mathématiques", coeff: 4, duree_min: 180, couleur: "#639922" },
  { code: "francais", nom: "Français", coeff: 4, duree_min: 120, couleur: "#BA7517" },
  { code: "hist_geo", nom: "Histoire-Géographie", coeff: 3, duree_min: 120, couleur: "#5F5E5A" },
  { code: "svt", nom: "SVT", coeff: 3, duree_min: 120, couleur: "#639922" },
  { code: "physique", nom: "Physique-Chimie", coeff: 3, duree_min: 120, couleur: "#D85A30" },
  { code: "anglais", nom: "Anglais", coeff: 2, duree_min: 90, couleur: "#BA7517" },
] as const;

// Durée totale officielle : somme de toutes les matières
const DUREE_TOTALE_SEC = MATIERES.reduce((sum, m) => sum + m.duree_min * 60, 0);

type MatiereCode = (typeof MATIERES)[number]["code"];

interface ReponseMatiere {
  matiere_code: MatiereCode;
  note: number;
  reponses: {
    enonce: string;
    reponse_eleve: string;
  }[];
}

type Phase = "intro" | "exam" | "submit" | "done";

function formatTemps(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExamenBlancPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [prochaineDispo, setProchaineDispo] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [tempsRestant, setTempsRestant] = useState(DUREE_TOTALE_SEC);
  const [matiereActive, setMatiereActive] = useState(0);
  const [notes, setNotes] = useState<Record<MatiereCode, string>>({
    maths: "",
    francais: "",
    hist_geo: "",
    svt: "",
    physique: "",
    anglais: "",
  });
  const [reponses, setReponses] = useState<Record<MatiereCode, string>>({
    maths: "",
    francais: "",
    hist_geo: "",
    svt: "",
    physique: "",
    anglais: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Vérifier connexion
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Vérifier disponibilité
  useEffect(() => {
    if (!isOnline) return;
    fetch("/api/examen-blanc/disponibilite")
      .then((r) => r.json())
      .then((data) => {
        setDisponible(data.disponible);
        if (!data.disponible) setProchaineDispo(data.prochaineDispo);
      })
      .catch(() => setDisponible(true));
  }, [isOnline]);

  // Timer
  const demarrerTimer = useCallback(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setTempsRestant((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          // Temps écoulé — soumettre automatiquement
          handleSoumettre();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const demarrerExamen = () => {
    setPhase("exam");
    demarrerTimer();
  };

  const handleNoteChange = (code: MatiereCode, value: string) => {
    const num = parseFloat(value);
    if (value === "" || (num >= 0 && num <= 20)) {
      setNotes((prev) => ({ ...prev, [code]: value }));
    }
  };

  const handleReponseChange = (code: MatiereCode, value: string) => {
    setReponses((prev) => ({ ...prev, [code]: value }));
  };

  const handleSoumettre = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSubmitting(true);
    setErrorSubmit(null);

    const duree_sec = Math.floor((Date.now() - startRef.current) / 1000);

    const resultats = MATIERES.map((m) => ({
      matiere_code: m.code,
      note: parseFloat(notes[m.code] || "0") || 0,
      reponses: reponses[m.code]
        ? [{ enonce: `Réponses ${m.nom}`, reponse_eleve: reponses[m.code] }]
        : [],
    }));

    try {
      const res = await fetch("/api/examen-blanc/soumettre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultats, duree_sec }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la soumission.");
      }

      router.push(`/examen-blanc/rapport/${data.rapport_id}`);
    } catch (err) {
      setErrorSubmit(
        err instanceof Error
          ? err.message
          : "La connexion est instable, réessaie dans quelques minutes."
      );
      setIsSubmitting(false);
    }
  }, [notes, reponses, router]);

  // ── États : hors-ligne ────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff size={28} className="text-amber-600" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800 mb-2">
            Connexion requise
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            L'examen blanc nécessite une connexion internet pour générer ton rapport personnalisé.
          </p>
        </div>
      </div>
    );
  }

  // ── États : vérification disponibilité ───────────────────────────────────
  if (disponible === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#639922] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── États : non disponible (< 7 jours) ───────────────────────────────────
  if (!disponible && prochaineDispo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-[#639922]" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800 mb-2">
            Examen déjà passé cette semaine
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Tu as déjà fait ton examen blanc cette semaine. Le prochain sera disponible :
          </p>
          <div className="bg-green-50 rounded-xl p-3 text-sm font-medium text-[#639922]">
            {formatDateFr(prochaineDispo)}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            En attendant, continue à réviser pour progresser !
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 w-full bg-[#639922] text-white rounded-xl py-3 text-sm font-medium"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // ── Phase : intro ─────────────────────────────────────────────────────────
  if (phase === "intro") {
    const dureeH = Math.floor(DUREE_TOTALE_SEC / 3600);
    const dureeM = Math.floor((DUREE_TOTALE_SEC % 3600) / 60);

    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="bg-[#639922] text-white px-4 pt-12 pb-8">
          <h1 className="text-xl font-semibold mb-1">Examen blanc BEPC</h1>
          <p className="text-green-100 text-sm">Simulation conditions réelles</p>
        </div>

        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={20} className="text-[#639922]" />
              <span className="text-sm font-medium text-gray-700">
                Durée totale : {dureeH}h{dureeM > 0 ? `${dureeM}min` : ""}
              </span>
            </div>

            <h2 className="text-sm font-semibold text-gray-800 mb-3">Matières et coefficients</h2>
            <div className="space-y-2">
              {MATIERES.map((m) => (
                <div key={m.code} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{m.nom}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{m.duree_min} min</span>
                    <span className="text-xs bg-green-100 text-[#639922] font-medium px-2 py-0.5 rounded-full">
                      coeff {m.coeff}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">Règles de l'examen</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Pas d'aide IA pendant la session</li>
                  <li>• Pas de correction immédiate</li>
                  <li>• Le rapport IA sera généré à la fin</li>
                  <li>• Disponible une fois par semaine</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-3 text-center mb-6">
            <p className="text-xs text-[#639922] font-medium">+100 XP à la completion !</p>
          </div>

          <button
            onClick={demarrerExamen}
            className="w-full bg-[#639922] text-white rounded-2xl py-4 text-base font-semibold"
          >
            Commencer l'examen
          </button>
        </div>
      </div>
    );
  }

  // ── Phase : exam ──────────────────────────────────────────────────────────
  const matiereActuelle = MATIERES[matiereActive];
  const tempsUrgent = tempsRestant < 600; // moins de 10 min

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Timer fixe en haut */}
      <div
        className={`sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm ${
          tempsUrgent ? "bg-red-500 text-white" : "bg-white text-gray-800"
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className={tempsUrgent ? "text-white" : "text-[#639922]"} />
          <span className="text-sm font-mono font-semibold">
            {formatTemps(tempsRestant)}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {matiereActive + 1}/{MATIERES.length}
        </span>
      </div>

      {/* Navigation matières */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {MATIERES.map((m, i) => {
          const note = parseFloat(notes[m.code] || "");
          const fait = !isNaN(note) && notes[m.code] !== "";
          return (
            <button
              key={m.code}
              onClick={() => setMatiereActive(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === matiereActive
                  ? "bg-[#639922] text-white"
                  : fait
                  ? "bg-green-100 text-[#639922]"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {fait && <CheckCircle2 size={12} className="inline mr-1" />}
              {m.nom.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Formulaire matière active */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              {matiereActuelle.nom}
            </h2>
            <span className="text-xs bg-green-50 text-[#639922] px-2 py-1 rounded-full font-medium">
              coeff {matiereActuelle.coeff}
            </span>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2 font-medium">
              Ta note estimée (sur 20)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={notes[matiereActuelle.code]}
              onChange={(e) => handleNoteChange(matiereActuelle.code, e.target.value)}
              placeholder="Ex : 12.5"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold text-center text-gray-800 focus:outline-none focus:border-[#639922]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">
              Notes ou observations (optionnel)
            </label>
            <textarea
              value={reponses[matiereActuelle.code]}
              onChange={(e) => handleReponseChange(matiereActuelle.code, e.target.value)}
              placeholder="Note ici ce que tu as trouvé difficile, tes doutes..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#639922]"
            />
          </div>
        </div>

        {/* Navigation matière suivante */}
        {matiereActive < MATIERES.length - 1 ? (
          <button
            onClick={() => setMatiereActive((prev) => prev + 1)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-2xl py-3 text-sm font-medium"
          >
            Matière suivante : {MATIERES[matiereActive + 1].nom}
            <ChevronRight size={16} />
          </button>
        ) : (
          <div className="space-y-3">
            {/* Récapitulatif */}
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs font-medium text-[#639922] mb-2">Récapitulatif</p>
              <div className="space-y-1">
                {MATIERES.map((m) => {
                  const n = notes[m.code];
                  return (
                    <div key={m.code} className="flex justify-between text-xs">
                      <span className="text-gray-600">{m.nom}</span>
                      <span className={n ? "text-gray-800 font-medium" : "text-gray-400"}>
                        {n ? `${n}/20` : "Non renseigné"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {errorSubmit && (
              <div className="bg-red-50 rounded-xl p-3 text-sm text-[#D85A30]">
                {errorSubmit}
              </div>
            )}

            <button
              onClick={handleSoumettre}
              disabled={isSubmitting}
              className="w-full bg-[#639922] text-white rounded-2xl py-4 text-base font-semibold disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  L'IA prépare ton rapport...
                </span>
              ) : (
                "Terminer et voir mon rapport"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
