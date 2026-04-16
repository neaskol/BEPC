"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Auteur {
  id: string;
  prenom: string;
}

interface Question {
  id: string;
  matiere: string;
  titre: string;
  corps: string;
  is_resolved: boolean;
  created_at: string;
  author: Auteur | Auteur[] | null;
  community_answers: { count: number }[] | null;
}

interface Props {
  userId: string;
  prenom: string;
  questions: Question[];
  matieres: string[];
  matiereActive: string | null;
}

function getAuteur(a: Auteur | Auteur[] | null): Auteur | null {
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function getNbReponses(answers: { count: number }[] | null): number {
  if (!answers || answers.length === 0) return 0;
  return answers[0].count ?? 0;
}

export function CommunauteClient({
  userId,
  prenom,
  questions,
  matieres,
  matiereActive,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formMatiere, setFormMatiere] = useState(matiereActive ?? matieres[0]);
  const [formTitre, setFormTitre] = useState("");
  const [formCorps, setFormCorps] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [questionOuverte, setQuestionOuverte] = useState<string | null>(null);
  const [reponseCorps, setReponseCorps] = useState("");
  const [reponsesCache, setReponsesCache] = useState<Record<string, { id: string; corps: string; author: Auteur | null; created_at: string }[]>>({});
  const [chargementReponse, setChargementReponse] = useState(false);
  const [signalementEnvoi, setSignalementEnvoi] = useState<string | null>(null);

  async function posterQuestion() {
    if (!formTitre.trim() || !formCorps.trim()) {
      setErreur("Remplis tous les champs !");
      return;
    }
    setChargement(true);
    setErreur("");
    try {
      const res = await fetch("/api/communaute/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matiere: formMatiere,
          titre: formTitre.trim(),
          corps: formCorps.trim(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormTitre("");
        setFormCorps("");
        router.refresh();
      } else {
        const data = await res.json();
        setErreur(data.error ?? "Erreur lors de la publication");
      }
    } catch {
      setErreur("Connexion perdue. Réessaie !");
    } finally {
      setChargement(false);
    }
  }

  async function chargerReponses(questionId: string) {
    if (questionOuverte === questionId) {
      setQuestionOuverte(null);
      return;
    }
    setQuestionOuverte(questionId);
    if (reponsesCache[questionId]) return;

    try {
      const res = await fetch(`/api/communaute/questions/${questionId}/answers`);
      if (res.ok) {
        const data = await res.json();
        const reponses = (data.answers ?? []).map((a: {
          id: string;
          corps: string;
          created_at: string;
          author: Auteur | Auteur[] | null;
        }) => ({
          id: a.id,
          corps: a.corps,
          author: getAuteur(a.author),
          created_at: a.created_at,
        }));
        setReponsesCache((prev) => ({ ...prev, [questionId]: reponses }));
      }
    } catch {
      // silencieux
    }
  }

  async function posterReponse(questionId: string) {
    if (!reponseCorps.trim() || reponseCorps.trim().length < 5) {
      return;
    }
    setChargementReponse(true);
    try {
      const res = await fetch(`/api/communaute/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corps: reponseCorps.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        const nouvelleReponse = {
          id: data.answer.id,
          corps: data.answer.corps,
          author: { id: userId, prenom },
          created_at: data.answer.created_at,
        };
        setReponsesCache((prev) => ({
          ...prev,
          [questionId]: [...(prev[questionId] ?? []), nouvelleReponse],
        }));
        setReponseCorps("");
        router.refresh();
      }
    } catch {
      // silencieux
    } finally {
      setChargementReponse(false);
    }
  }

  async function signalerPost(targetId: string, targetType: "question" | "answer") {
    try {
      await fetch(`/api/communaute/questions/${targetId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: targetType }),
      });
      setSignalementEnvoi(targetId);
      setTimeout(() => setSignalementEnvoi(null), 3000);
    } catch {
      // silencieux
    }
  }

  return (
    <div className="space-y-4">
      {/* XP info */}
      <div className="bg-bepc-vert/10 border border-bepc-vert/20 rounded-xl p-3 flex items-center gap-3">
        <span className="text-xl">💡</span>
        <p className="text-sm text-bepc-vert font-medium">
          Répondre à une question = +25 XP
        </p>
      </div>

      {/* Filtre matière */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={() => router.push("/communaute")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !matiereActive
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          Toutes
        </button>
        {matieres.map((m) => (
          <button
            key={m}
            onClick={() => router.push(`/communaute?matiere=${encodeURIComponent(m)}`)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              matiereActive === m
                ? "bg-bepc-vert text-white border-bepc-vert"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Bouton poster */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-bepc-vert text-white rounded-2xl py-4 font-semibold active:scale-95 transition-transform"
      >
        {showForm ? "Annuler" : "📝 Poser une question"}
      </button>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Ta question</h2>

          {erreur && (
            <p className="text-red-500 text-sm">{erreur}</p>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Matière
            </label>
            <select
              value={formMatiere}
              onChange={(e) => setFormMatiere(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bepc-vert"
            >
              {matieres.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Titre de ta question
            </label>
            <input
              type="text"
              placeholder="Ex: Comment calculer l'aire d'un triangle ?"
              value={formTitre}
              onChange={(e) => setFormTitre(e.target.value)}
              maxLength={200}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bepc-vert"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Détails
            </label>
            <textarea
              placeholder="Explique ta question en détail..."
              value={formCorps}
              onChange={(e) => setFormCorps(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bepc-vert resize-none"
            />
          </div>

          <button
            onClick={posterQuestion}
            disabled={chargement}
            className="w-full bg-bepc-vert text-white rounded-xl py-3 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            {chargement ? "Publication..." : "Publier ma question"}
          </button>
        </div>
      )}

      {/* Liste questions */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-500 text-sm">
            Aucune question pour le moment.
            <br />
            Sois le premier à en poser une !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const auteur = getAuteur(q.author);
            const nbReponses = getNbReponses(q.community_answers);
            const estOuverte = questionOuverte === q.id;
            const reponses = reponsesCache[q.id] ?? [];
            const isMyQuestion = auteur?.id === userId;

            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Question */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {q.matiere}
                    </span>
                    {q.is_resolved && (
                      <span className="inline-block bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                        Résolu
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {q.titre}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{q.corps}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">
                        {auteur?.prenom ?? "Élève"} ·{" "}
                        {new Date(q.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isMyQuestion && (
                        <button
                          onClick={() => signalerPost(q.id, "question")}
                          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                          {signalementEnvoi === q.id ? "Signalé ✓" : "Signaler"}
                        </button>
                      )}
                      <button
                        onClick={() => chargerReponses(q.id)}
                        className="text-xs text-bepc-vert font-medium"
                      >
                        {nbReponses > 0 ? `${nbReponses} réponse${nbReponses > 1 ? "s" : ""}` : "Répondre"}{" "}
                        {estOuverte ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Réponses */}
                {estOuverte && (
                  <div className="border-t border-gray-50">
                    {/* Liste réponses */}
                    {reponses.length > 0 && (
                      <div className="divide-y divide-gray-50">
                        {reponses.map((r) => (
                          <div key={r.id} className="p-4 bg-gray-50">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-gray-700 flex-1">{r.corps}</p>
                              {r.author?.id !== userId && (
                                <button
                                  onClick={() => signalerPost(r.id, "answer")}
                                  className="text-xs text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                  Signaler
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {r.author?.prenom ?? "Élève"} ·{" "}
                              {new Date(r.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire réponse */}
                    <div className="p-4 space-y-2">
                      <textarea
                        placeholder="Écris ta réponse ici... (+25 XP)"
                        value={reponseCorps}
                        onChange={(e) => setReponseCorps(e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bepc-vert resize-none"
                      />
                      <button
                        onClick={() => posterReponse(q.id)}
                        disabled={chargementReponse || reponseCorps.trim().length < 5}
                        className="w-full bg-bepc-vert text-white rounded-xl py-2 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {chargementReponse ? "Envoi..." : "Répondre"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
