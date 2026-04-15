"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inscrire } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-bepc-green text-white rounded-xl font-semibold
                 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity
                 hover:bg-green-700 active:scale-95 transition-transform"
    >
      {pending ? "Création en cours…" : "Créer mon compte"}
    </button>
  );
}

export default function InscriptionForm() {
  const [state, action] = useFormState(inscrire, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="prenom"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Prénom <span className="text-red-500">*</span>
        </label>
        <input
          id="prenom"
          name="prenom"
          type="text"
          required
          autoComplete="given-name"
          placeholder="Ton prénom"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-bepc-green focus:border-transparent
                     text-sm placeholder:text-gray-400"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email <span className="text-red-500">*</span>
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
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-bepc-green focus:border-transparent
                     text-sm placeholder:text-gray-400"
        />
      </div>

      <div>
        <label
          htmlFor="ville"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Ta ville{" "}
          <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <input
          id="ville"
          name="ville"
          type="text"
          placeholder="Antananarivo, Toamasina…"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-bepc-green focus:border-transparent
                     text-sm placeholder:text-gray-400"
        />
      </div>

      <div>
        <label
          htmlFor="bepc_date"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date de ton BEPC{" "}
          <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <input
          id="bepc_date"
          name="bepc_date"
          type="date"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-bepc-green focus:border-transparent
                     text-sm text-gray-700"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
