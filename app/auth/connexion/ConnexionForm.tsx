"use client";

import { useFormState, useFormStatus } from "react-dom";
import { seConnecter } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-bepc-green text-white rounded-xl font-semibold
                 disabled:opacity-60 disabled:cursor-not-allowed
                 hover:bg-green-700 active:scale-95 transition-transform"
    >
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function ConnexionForm() {
  const [state, action] = useFormState(seConnecter, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ton@email.com"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-bepc-green focus:border-transparent
                     text-sm placeholder:text-gray-400"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Ton mot de passe"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-bepc-green focus:border-transparent
                     text-sm placeholder:text-gray-400"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
