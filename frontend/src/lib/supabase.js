import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isValidUrl = (value) => {
	try {
		if (!value) return false;
		const parsed = new URL(value);
		return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
	} catch {
		return false;
	}
};

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && !!supabaseKey;
export const supabaseConfigError = isSupabaseConfigured
	? null
	: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local.';

if (!isSupabaseConfigured) {
	console.error(supabaseConfigError);
	if (typeof window !== 'undefined' && window.localStorage) {
		Object.keys(window.localStorage)
			.filter((key) => key.startsWith('sb-'))
			.forEach((key) => window.localStorage.removeItem(key));
	}
}

export const supabase = createClient(
	isSupabaseConfigured ? supabaseUrl : 'https://invalid.supabase.co',
	isSupabaseConfigured ? supabaseKey : 'invalid-key',
	{
		auth: {
			autoRefreshToken: isSupabaseConfigured,
			persistSession: isSupabaseConfigured,
			detectSessionInUrl: isSupabaseConfigured,
		},
	}
);
