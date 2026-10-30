import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.',
  );
}

// Main client: persists authenticated session for user-specific operations (login, crops, transactions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // Disable Navigator.locks on web — the URL polyfill provides an
    // incomplete implementation that causes "lock immediately failed" errors.
    lock: Platform.OS === 'web' ? async (_name, _acquireTimeout, fn) => fn() : undefined,
  },
});

// Dedicated client without user session: bypasses authenticated-user RLS evaluation loops
// when fetching public directory data (e.g., growers network, listing seller profiles).
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
