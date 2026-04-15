import Link from "next/link";
import { BookOpen, Zap, Trophy, WifiOff } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-bepc-vert px-6 pt-12 pb-8 text-white">
        <h1 className="text-[22px] font-medium leading-tight">
          BEPC Mada
        </h1>
        <p className="mt-1 text-bepc-vert-clair text-corps-sm opacity-90">
          Prépare ton BEPC, à ton rythme
        </p>
      </header>

      {/* Hero */}
      <section className="px-6 py-8 flex-1">
        <h2 className="text-titre-lg font-medium text-gray-900 leading-snug">
          Réussis ton BEPC,<br />
          même si tu as décroché.
        </h2>
        <p className="mt-3 text-corps text-bepc-gris leading-relaxed">
          Des cours adaptés, des exercices avec corrections bienveillantes,
          et un suivi de ta progression — conçu pour les élèves malgaches.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/auth/inscription"
            className="flex items-center justify-center min-h-touch bg-bepc-vert text-white font-medium rounded-2xl px-6 py-3 text-corps transition-opacity active:opacity-80"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/auth/connexion"
            className="flex items-center justify-center min-h-touch border-2 border-bepc-vert text-bepc-vert font-medium rounded-2xl px-6 py-3 text-corps transition-colors active:bg-bepc-vert-clair"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        {/* Features */}
        <ul className="mt-10 flex flex-col gap-5">
          <li className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-bepc-vert-clair flex items-center justify-center">
              <BookOpen size={20} className="text-bepc-vert" />
            </span>
            <div>
              <p className="font-medium text-corps text-gray-900">Cours générés par l&apos;IA</p>
              <p className="text-corps-sm text-bepc-gris mt-0.5">
                Maths, Français, SVT, Histoire-Géo, Physique et Anglais — avec des exemples malgaches.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-bepc-ambre-clair flex items-center justify-center">
              <Zap size={20} className="text-bepc-ambre" />
            </span>
            <div>
              <p className="font-medium text-corps text-gray-900">Entraînements adaptés</p>
              <p className="text-corps-sm text-bepc-gris mt-0.5">
                Exercices corrigés avec encouragements — jamais de &quot;mauvaise réponse&quot;.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-bepc-vert-clair flex items-center justify-center">
              <Trophy size={20} className="text-bepc-vert" />
            </span>
            <div>
              <p className="font-medium text-corps text-gray-900">Progression & badges</p>
              <p className="text-corps-sm text-bepc-gris mt-0.5">
                XP, niveaux et badges aux noms malgaches pour te motiver chaque jour.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <WifiOff size={20} className="text-bepc-gris" />
            </span>
            <div>
              <p className="font-medium text-corps text-gray-900">Fonctionne hors-ligne</p>
              <p className="text-corps-sm text-bepc-gris mt-0.5">
                Révise même sans connexion. Tes réponses se synchronisent automatiquement.
              </p>
            </div>
          </li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-corps-sm text-bepc-gris border-t border-gray-100">
        Conçu pour les élèves malgaches · BEPC Mada 2026
      </footer>
    </main>
  );
}
