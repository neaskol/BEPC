"use client";

import { useState, useRef, useTransition } from "react";
import { uploadAndExtractPdf } from "./actions";

type Result =
  | { success: true; titre: string; nbExercices: number; sujetId: string }
  | { success: false; error: string }
  | null;

export default function UploadForm() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);

    startTransition(async () => {
      const res = await uploadAndExtractPdf(formData);
      setResult(res);
      if (res.success) setFile(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Zone de dépôt */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragging ? "border-bepc-green bg-green-50" : "border-gray-300 hover:border-bepc-green hover:bg-gray-50"}
          ${file ? "border-bepc-green bg-green-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div>
            <div className="text-3xl mb-2">📄</div>
            <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
            <p className="text-gray-500 text-xs mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <div>
            <div className="text-3xl mb-2">☁️</div>
            <p className="text-sm font-medium text-gray-700">
              Glisse un PDF ici ou clique pour sélectionner
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF uniquement · max 50 MB</p>
          </div>
        )}
      </div>

      {/* Bouton d'extraction */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || isPending}
        className="w-full py-3 bg-bepc-green text-white font-semibold rounded-xl
                   disabled:opacity-40 disabled:cursor-not-allowed
                   hover:bg-green-700 active:scale-95 transition-transform"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Extraction en cours… (peut prendre 30 s)
          </span>
        ) : (
          "Extraire et importer le sujet"
        )}
      </button>

      {/* Résultat */}
      {result && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            result.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {result.success ? (
            <div>
              <p className="font-semibold">✓ Sujet importé avec succès</p>
              <p className="mt-1">{result.titre}</p>
              <p className="text-xs mt-1 text-green-600">
                {result.nbExercices} exercice
                {result.nbExercices > 1 ? "s" : ""} extrait
                {result.nbExercices > 1 ? "s" : ""}
              </p>
              <a
                href="/admin/contenu"
                className="inline-block mt-3 text-xs font-semibold underline"
              >
                Voir dans le contenu →
              </a>
            </div>
          ) : (
            <div>
              <p className="font-semibold">✗ Erreur</p>
              <p className="mt-1">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
