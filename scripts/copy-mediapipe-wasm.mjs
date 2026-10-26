// Copie le runtime WASM de MediaPipe GenAI dans public/ pour qu'il soit servi
// depuis notre origine (et donc cachable par le ServiceWorker → fonctionne hors-ligne).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'node_modules/@mediapipe/tasks-genai/wasm');
const dest = resolve(root, 'public/mediapipe-wasm');

if (!existsSync(src)) {
  console.warn('[copy-mediapipe-wasm] Dossier wasm introuvable, étape ignorée.');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('[copy-mediapipe-wasm] WASM copié vers public/mediapipe-wasm');
