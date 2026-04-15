import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import InscriptionForm from "./InscriptionForm";

export default async function InscriptionPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-b from-bepc-green to-green-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">BEPC Mada</h1>
          <p className="text-green-100 mt-2 text-sm">
            Commence ton parcours vers le succès
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Créer mon compte
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Quelques secondes pour démarrer
          </p>
          <InscriptionForm />
        </div>

        <p className="text-center text-green-100 mt-6 text-sm">
          Déjà inscrit ?{" "}
          <a
            href="/auth/connexion"
            className="font-semibold underline underline-offset-2"
          >
            Se connecter
          </a>
        </p>
      </div>
    </main>
  );
}
