import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a single supabase client instance and reuse it across HMR reloads
declare global {
  // eslint-disable-next-line no-var
  var __supabase__: any | undefined
}

function createSupabaseSingleton() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Fail fast with a minimal client to avoid hard crashes, but do not spam logs
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = globalThis.__supabase__ ?? createSupabaseSingleton()
if (!globalThis.__supabase__) {
  globalThis.__supabase__ = supabase
}
