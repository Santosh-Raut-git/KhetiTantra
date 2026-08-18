import { useState } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      Alert.alert('Success', 'Account created successfully!');
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
            <Text
              className="text-soil text-3xl font-bold mb-2"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Create Account
            </Text>
            <Text
              className="text-soil-muted text-base text-center"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Start tracking your crops and ledger today
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
              placeholder="Minimum 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button
              label={loading ? 'Creating...' : 'Sign Up'}
              onPress={signUpWithEmail}
              disabled={loading}
              className="mt-2"
            />
          </View>

          <View className="flex-row justify-center mt-6">
            <Text
              className="text-soil-muted"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Text
                className="text-leaf font-bold"
                style={{ fontFamily: 'Inter-Bold' }}
              >
                Log In
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
