import Link from "next/link";
import { BookOpen, Zap, Trophy, WifiOff, Star, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Hero Header — gradient with decorative circles */}
      <header className="relative bg-bepc-hero px-6 pt-14 pb-12 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute top-16 -right-4 w-20 h-20 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 left-8 w-28 h-28 bg-bepc-vert-dark/40 rounded-full" />

        <div className="relative">
          {/* App badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm
                          border border-white/20 rounded-full px-3 py-1 mb-4">
            <Star size={11} className="fill-yellow-300 text-yellow-300" />
            <span className="text-xs font-semibold tracking-wide">BEPC MADA</span>
          </div>

          <h1 className="font-display text-[28px] font-extrabold leading-tight text-white">
            Réussis ton BEPC,<br />
            <span className="text-yellow-200">même si tu as décroché.</span>
          </h1>
          <p className="mt-3 text-white/80 text-[15px] leading-relaxed max-w-xs">
            Des cours adaptés, des exercices bienveillants et un suivi de ta progression —
            conçu pour les élèves malgaches.
          </p>
        </div>
      </header>

      {/* CTAs */}
      <section className="px-6 py-8 space-y-3">
        <Link
          href="/auth/inscription"
          className="btn-primary w-full gap-2"
        >
          Commencer gratuitement
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/auth/connexion"
          className="btn-secondary w-full"
        >
          J&apos;ai déjà un compte
        </Link>
      </section>

      {/* Social proof */}
      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 bg-bepc-vert-light border border-bepc-vert/20
                        rounded-2xl px-4 py-3">
          <div className="flex -space-x-1.5">
            {["#639922", "#BA7517", "#D85A30"].map((c) => (
              <div
                key={c}
                className="w-6 h-6 rounded-full border-2 border-white"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <p className="text-corps-sm text-bepc-vert font-semibold">
            Des milliers d&apos;élèves malgaches préparent déjà leur BEPC
          </p>
        </div>
      </div>

      {/* Features */}
      <section className="px-6 pt-8 pb-10 flex-1 space-y-4">
        <h2 className="font-display text-[17px] font-bold text-gray-700 uppercase tracking-wide">
          Tout ce dont tu as besoin
        </h2>

        <FeatureItem
          icon={<BookOpen size={20} className="text-bepc-vert" />}
          iconBg="bg-bepc-vert-clair"
          title="Cours générés par l'IA"
          description="Maths, Français, SVT, Histoire-Géo, Physique et Anglais — avec des exemples malgaches."
        />
        <FeatureItem
          icon={<Zap size={20} className="text-bepc-ambre" />}
          iconBg="bg-bepc-ambre-clair"
          title="Entraînements adaptés"
          description="Exercices corrigés avec encouragements — jamais de &quot;mauvaise réponse&quot;."
        />
        <FeatureItem
          icon={<Trophy size={20} className="text-yellow-600" />}
          iconBg="bg-yellow-50"
          title="Progression & badges"
          description="XP, niveaux et badges aux noms malgaches pour te motiver chaque jour."
        />
        <FeatureItem
          icon={<WifiOff size={20} className="text-bepc-gris" />}
          iconBg="bg-gray-100"
          title="Fonctionne hors-ligne"
          description="Révise même sans connexion. Tes réponses se synchronisent automatiquement."
        />
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-corps-sm text-bepc-gris border-t border-gray-100">
        Conçu pour les élèves malgaches · BEPC Mada 2026
      </footer>
    </main>
  );
}

function FeatureItem({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 card p-4">
      <span className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        {icon}
      </span>
      <div>
        <p className="font-semibold text-corps text-gray-900">{title}</p>
        <p
          className="text-corps-sm text-bepc-gris mt-0.5"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>
    </div>
  );
}
