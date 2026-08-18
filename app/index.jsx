import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useStore } from '@/lib/store';

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
  if (!session) {
    return <Redirect href="/(auth)" />;
  }
  return <Redirect href="/(tabs)" />;
}
