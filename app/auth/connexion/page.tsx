import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import ConnexionForm from "./ConnexionForm";

export default async function ConnexionPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-b from-bepc-green to-green-700 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">BEPC Mada</h1>
          <p className="text-green-100 mt-2 text-sm">
            Content de te revoir !
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Connexion
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Entre tes identifiants pour continuer
          </p>
          <ConnexionForm />
        </div>

        <p className="text-center text-green-100 mt-6 text-sm">
          Pas encore de compte ?{" "}
          <a
            href="/auth/inscription"
            className="font-semibold underline underline-offset-2"
          >
            S&apos;inscrire gratuitement
          </a>
        </p>
      </div>
    </main>
  );
}
