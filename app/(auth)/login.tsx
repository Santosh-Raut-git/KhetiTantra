import { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12 md:max-w-md md:w-full md:self-center">
          <View className="mb-8 items-center">
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: 180, height: 180, marginBottom: 16 }} 
              resizeMode="contain"
            />
            <Text className="text-soil text-3xl font-bold mb-2" style={{ fontFamily: 'Inter-Bold' }}>
              Welcome Back
            </Text>
            <Text className="text-soil-muted text-base text-center" style={{ fontFamily: 'Inter-Regular' }}>
              Log in to manage your farm and ledger
            </Text>
          </View>

          <View className="bg-surface p-6 rounded-3xl border border-soil/5 shadow-sm">
            <Input
              label="Email"
              placeholder="farmer@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button 
              label={loading ? 'Logging in...' : 'Log In'} 
              onPress={signInWithEmail} 
              disabled={loading}
              className="mt-2"
            />
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <Text className="text-leaf font-bold" style={{ fontFamily: 'Inter-Bold' }}>Sign Up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
