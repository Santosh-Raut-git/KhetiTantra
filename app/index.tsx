import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useStore } from '@/lib/store';

/**
 * Root entry point — Expo Router opens the app here (route "/").
 *
 * We must always redirect away from this screen:
 *   - authenticated  → /(tabs)   (dashboard)
 *   - unauthenticated → /(auth)/login
 *
 * While the session is being restored from storage we show a plain
 * spinner on the app background colour so there is no jarring flash.
 */
export default function Index() {
  const { session, isLoading } = useStore();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F5F0',
        }}
      >
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
