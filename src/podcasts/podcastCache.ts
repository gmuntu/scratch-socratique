/**
 * Mise en cache locale des épisodes (Cache Storage).
 *
 * On utilise le même cache que la règle Workbox de vite.config.ts
 * (« podcasts-v1 ») : un épisode téléchargé ici est donc aussi servi par
 * le ServiceWorker. La lecture d'un épisode en cache passe par une URL
 * Blob locale : elle fonctionne même sans ServiceWorker (mode dev) et sans
 * dépendre des requêtes partielles (Range) du navigateur.
 */

export const PODCAST_CACHE = 'podcasts-v1';

const supported = (): boolean => typeof caches !== 'undefined';

export async function isCached(url: string): Promise<boolean> {
  if (!supported()) return false;
  const cache = await caches.open(PODCAST_CACHE);
  const res = await cache.match(url);
  return res !== undefined && res.status === 200;
}

/**
 * Télécharge entièrement un épisode et le range dans le cache.
 * `onProgress` reçoit une valeur entre 0 et 1 (si la taille est connue).
 */
export async function downloadEpisode(
  url: string,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!supported()) throw new Error('Le stockage hors-ligne n’est pas disponible sur ce navigateur.');

  const init: RequestInit = signal ? { signal } : {};
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Téléchargement impossible (HTTP ${res.status}).`);

  const type = res.headers.get('Content-Type') ?? 'audio/mpeg';
  const total = Number(res.headers.get('Content-Length')) || 0;
  let blob: Blob;

  if (res.body && total > 0 && onProgress) {
    const reader = res.body.getReader();
    const chunks: BlobPart[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value as unknown as BlobPart);
      received += value.byteLength;
      onProgress(Math.min(1, received / total));
    }
    blob = new Blob(chunks, { type });
  } else {
    blob = await res.blob();
  }

  const cache = await caches.open(PODCAST_CACHE);
  await cache.put(
    url,
    new Response(blob, { headers: { 'Content-Type': type, 'Content-Length': String(blob.size) } })
  );
  onProgress?.(1);

  // Demande au navigateur de ne pas effacer ce stockage en cas de manque de place.
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* non bloquant */
  }
}

export async function removeEpisode(url: string): Promise<void> {
  if (!supported()) return;
  const cache = await caches.open(PODCAST_CACHE);
  await cache.delete(url);
}

/** Renvoie une URL Blob locale pour lire un épisode en cache, ou null. */
export async function getCachedObjectUrl(url: string): Promise<string | null> {
  if (!supported()) return null;
  const cache = await caches.open(PODCAST_CACHE);
  const res = await cache.match(url);
  if (!res || res.status !== 200) return null;
  return URL.createObjectURL(await res.blob());
}
