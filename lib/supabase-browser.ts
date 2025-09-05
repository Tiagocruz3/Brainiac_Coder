import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseBrowserClient() {
    if (typeof window === 'undefined') {
        return null
    }
    
    if (supabaseClient) {
        return supabaseClient
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
        if (process.env.NODE_ENV === 'development') {
            console.warn('Supabase environment variables not configured - authentication features will be disabled')
            return null
        }
        throw new Error('Supabase URL and Anon Key are required')
    }
    
    // Validate URL format
    try {
        new URL(supabaseUrl)
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid Supabase URL format - authentication features will be disabled')
            return null
        }
        throw new Error('Invalid Supabase URL format')
    }
    
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
}