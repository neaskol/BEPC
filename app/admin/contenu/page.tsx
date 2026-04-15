import { createClient } from "@/lib/supabase/server";
import { ToggleValideButton } from "./ToggleValideButton";

export const revalidate = 0; // Toujours fresh pour les admins

export default async function AdminContenuPage() {
  const supabase = createClient();

  const { data: sujets } = await supabase
    .from("sujets")
    .select(
      `
      id, titre, annee, type, valide, created_at,
      matieres (nom, couleur),
      exercices (id)
    `
    )
    .order("created_at", { ascending: false });

  const total = sujets?.length ?? 0;
  const publies = sujets?.filter((s) => s.valide).length ?? 0;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contenu</h1>
          <p className="text-gray-500 text-sm mt-1">
            {publies} / {total} sujets publiés
          </p>
        </div>
        <a
          href="/admin/upload"
          className="px-4 py-2 bg-bepc-green text-white text-sm font-semibold rounded-lg
                     hover:bg-green-700 transition-colors"
        >
          + Importer PDF
        </a>
      </div>

      {(!sujets || sujets.length === 0) && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📂</div>
          <p>Aucun sujet importé pour l&apos;instant.</p>
          <a
            href="/admin/upload"
            className="mt-4 inline-block text-sm text-bepc-green underline"
          >
            Importer le premier PDF →
          </a>
        </div>
      )}

      <div className="space-y-3">
        {sujets?.map((sujet) => {
          const raw = sujet.matieres;
          const matiere =
            raw && !Array.isArray(raw)
              ? (raw as { nom: string; couleur: string })
              : null;
          const nbExercices = Array.isArray(sujet.exercices)
            ? sujet.exercices.length
            : 0;

          return (
            <div
              key={sujet.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Matière badge */}
                  {matiere && (
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white mb-2"
                      style={{ backgroundColor: matiere.couleur }}
                    >
                      {matiere.nom}
                    </span>
                  )}

                  <h2 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                    {sujet.titre}
                  </h2>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {sujet.annee && <span>📅 {sujet.annee}</span>}
                    <span>📝 {nbExercices} exercice{nbExercices > 1 ? "s" : ""}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        sujet.type === "officiel"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {sujet.type}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <ToggleValideButton
                    sujetId={sujet.id}
                    valide={sujet.valide}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
