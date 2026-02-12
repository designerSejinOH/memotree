// src/lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client for build time when env vars are not available
const createMockClient = () => {
  const handler = {
    get: () => {
      throw new Error('Supabase client is not available - missing environment variables')
    },
  }
  return new Proxy({} as SupabaseClient<Database>, handler)
}

export const supabase: SupabaseClient<Database> =
  supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : createMockClient()
