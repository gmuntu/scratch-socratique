/**
 * Relais serveur (Vercel Function) vers l'API Gemini.
 *
 * La clé GEMINI_API_KEY reste côté serveur : elle n'est jamais envoyée au
 * navigateur. Le client (geminiProvider.ts) poste ici exactement le même
 * corps JSON que pour l'API Google ; on le transmet tel quel.
 *
 * Variables d'environnement (tableau de bord Vercel → Settings → Environment Variables) :
 *  - GEMINI_API_KEY  (obligatoire)
 *  - GEMINI_MODEL    (optionnel, défaut : gemini-3.6-flash)
 *  - ALLOWED_ORIGIN  (optionnel, ex. https://scratch-socratique.vercel.app)
 */

declare const process: { env: Record<string, string | undefined> };

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_BODY_BYTES = 32_000; // une question d'élève + contexte : largement suffisant

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(500, { error: { message: 'GEMINI_API_KEY manquante côté serveur.' } });

  // Refuse les appels venant d'autres sites (protection simple contre l'abus de ta clé).
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = request.headers.get('origin');
  if (allowed && origin && origin !== allowed) {
    return json(403, { error: { message: 'Origine non autorisée.' } });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: { message: 'Requête trop volumineuse.' } });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: { message: 'JSON invalide.' } });
  }

  // Le modèle est fixé côté serveur : le client ne peut pas choisir un modèle plus coûteux.
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';
  const upstream = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body)
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
