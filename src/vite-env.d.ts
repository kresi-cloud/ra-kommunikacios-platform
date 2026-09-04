/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_APP_ENV?: 'development' | 'test' | 'production'
  readonly VITE_APP_TIMEZONE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
