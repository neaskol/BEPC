import UploadForm from "./UploadForm";

export default function AdminUploadPage() {
  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import PDF sujet BEPC</h1>
        <p className="text-gray-500 text-sm mt-1">
          Dépose un sujet officiel — Claude extrait les exercices automatiquement.
          Le sujet reste en brouillon jusqu&apos;à validation.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <UploadForm />
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <p className="font-semibold mb-1">Conseils</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>PDFs texte uniquement — les PDFs scannés (images) ne fonctionnent pas</li>
          <li>Après import, valide le sujet dans <a href="/admin/contenu" className="underline">Contenu</a> pour le rendre visible aux élèves</li>
          <li>L&apos;extraction peut prendre jusqu&apos;à 30 secondes</li>
        </ul>
      </div>
    </div>
  );
}
