// Extraction de texte depuis un PDF — Node.js runtime uniquement (pas edge)
// pdf-parse est un module CommonJS ; on l'importe via require() côté serveur.

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Import dynamique pour éviter les problèmes de bundling côté client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (
    buf: Buffer
  ) => Promise<{ text: string; numpages: number }>;

  const result = await pdfParse(buffer);

  if (!result.text || result.text.trim().length < 50) {
    throw new Error(
      "Le PDF semble vide ou non lisible (peut-être scanné sans OCR)."
    );
  }

  // Nettoyage basique : supprimer les lignes de whitespace pur
  const cleaned = result.text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");

  return cleaned;
}
