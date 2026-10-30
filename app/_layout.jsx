import '../global.css';
import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { supabase, supabasePublic } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();
export default function RootLayout() {
  const { setSession, setProfile, setIsLoading } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });
  useEffect(() => {
    async function syncUser(session) {
      setSession(session);
      if (session?.user?.id) {
        try {
          const { data } = await supabasePublic
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data) setProfile(data);
        } catch (e) {
          console.warn('Profile sync warning:', e);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" backgroundColor="#F5F5F0" />
      </ToastProvider>
    </QueryClientProvider>
  );
}
