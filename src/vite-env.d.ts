/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_GEMINI_PROXY_URL?: string;
  readonly VITE_GEMMA_MODEL_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
