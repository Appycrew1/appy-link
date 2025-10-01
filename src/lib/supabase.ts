import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Optional: Helper function for getting user
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Optional: Helper function for sign out
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
