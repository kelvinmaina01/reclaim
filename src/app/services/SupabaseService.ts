import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Cloud features will be disabled.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Supabase connection failed:', e);
        return false;
    }
};
