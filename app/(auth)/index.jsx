import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Sprout, Store, Mail, Lock, Headphones, Music, User } from 'lucide-react-native';

const PRIMARY_COLOR = '#2E7D32';
const DARK_COLOR = '#1B5E20';

export default function UnifiedAuthScreen() {
  const [role, setRole] = useState('farmer'); // 'farmer' | 'retailer'
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const containerWidth = Math.min(width - 32, 400);

  const animProgress = useSharedValue(0); // 0 = farmer, 1 = retailer

  const switchRole = (newRole) => {
    setRole(newRole);
    const target = newRole === 'farmer' ? 0 : 1;
    animProgress.value = withSpring(target, {
      damping: 25,
      stiffness: 120,
    });
  };

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);

    if (!isSignUp) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Login Failed', error.message);
      } else {
        router.replace('/(tabs)');
      }
    } else {
      if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters long');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role: role // 'farmer' or 'retailer'
          }
        }
      });
      if (error) {
        Alert.alert('Signup Failed', error.message);
      } else {
        Alert.alert('Success', 'Account created successfully!');
        router.replace('/(tabs)');
      }
    }
    setLoading(false);
  }

  // -- Animations --

  const heroStyle = useAnimatedStyle(() => {
    if (isWide) {
      return { transform: [{ translateY: animProgress.value * -548 }] };
    }
    return { transform: [{ translateX: animProgress.value * -containerWidth }] };
  });

  const formStyle = useAnimatedStyle(() => {
    if (isWide) {
      return { transform: [{ translateY: animProgress.value * -500 }] };
    }
    return { transform: [{ translateX: animProgress.value * -containerWidth }] };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    if (isWide) {
      const topOffset = animProgress.value * 250; // 500 total height, 250 per button roughly
      return {
        top: 125 + topOffset, // Center of first button is ~125
        transform: [{ translateY: -30 }], // Half of indicator height
        left: 0,
      };
    } else {
      return {
        left: 0,
        top: 'auto',
        transform: [{ translateX: animProgress.value * (containerWidth / 2) }],
      };
    }
  }, [isWide, containerWidth]);

  // -- Render Helpers --

  const renderHeroContent = (currentRole) => {
    const isFarmer = currentRole === 'farmer';
    return (
      <View
        className="justify-center items-center px-8"
        style={{ width: isWide ? '100%' : containerWidth, height: isWide ? 548 : 200 }}
      >
        <Text
          className="text-white font-bold text-center mb-2"
          style={{ fontFamily: 'Inter-Bold', fontSize: isWide ? 32 : 24 }}
        >
          {isFarmer ? 'Farmer Portal.' : 'Retailer Portal.'}
        </Text>
        <Text
          className="text-white/80 text-center mb-8"
          style={{ fontFamily: 'Inter-Regular', fontSize: isWide ? 16 : 14 }}
        >
          {isFarmer ? 'Manage your crops and finances.' : 'Buy produce directly from farmers.'}
        </Text>
        
        {/* Placeholder for the illustration */}
        <View className="items-center justify-center relative">
          {isFarmer ? (
            <Sprout size={isWide ? 120 : 64} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
          ) : (
            <Store size={isWide ? 120 : 64} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
          )}
        </View>
      </View>
    );
  };

  const renderFormContent = (currentRole) => {
    return (
      <View
        className="justify-center px-8"
        style={{ width: isWide ? '100%' : containerWidth, height: isWide ? 500 : 400 }}
      >
        <View className="flex-row mb-8">
          <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>
            {!isSignUp ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <Pressable onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={{ color: PRIMARY_COLOR, fontFamily: 'Inter-Bold' }}>
              {!isSignUp ? 'Sign Up.' : 'Sign In.'}
            </Text>
          </Pressable>
        </View>

        <View className="space-y-4">
          <Input
            label="Email"
            placeholder="youremail@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-soil/5 border-0"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-soil/5 border-0"
          />
          
          <Button
            label={loading ? 'Please wait...' : !isSignUp ? 'Sign In' : 'Sign Up'}
            onPress={handleAuth}
            disabled={loading}
            className="mt-4"
            style={{ backgroundColor: PRIMARY_COLOR }}
          />

          <Text className="text-soil-muted/60 text-xs mt-6 leading-5" style={{ fontFamily: 'Inter-Regular' }}>
            By clicking {isSignUp ? 'Sign Up' : 'Sign In'} you agree to our terms and conditions, privacy policy and reusability rules.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F6F8] justify-center" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center p-4"
      >
        <View
          className="bg-white rounded-[24px] self-center relative flex-col md:flex-row md:items-center overflow-hidden md:overflow-visible shadow-sm border border-soil/5"
          style={{
            width: isWide ? 860 : '100%',
            maxWidth: isWide ? 860 : 400,
            height: isWide ? 500 : 660, // Mobile total height approx
          }}
        >
          
          {/* Desktop/Mobile Navigation */}
          <View
            className={`flex-row md:flex-col items-center justify-center border-b md:border-b-0 md:border-r border-soil/5 relative z-20 bg-white ${isWide ? 'w-[140px] h-full rounded-l-[24px]' : 'w-full h-[60px]'}`}
          >
            <Pressable
              onPress={() => switchRole('farmer')}
              className="flex-1 w-full flex-row md:flex-col items-center justify-center"
            >
              <Sprout size={20} color={role === 'farmer' ? DARK_COLOR : '#9CA3AF'} />
              <Text
                className={`ml-2 md:ml-0 md:mt-2 text-sm ${role === 'farmer' ? 'text-leaf-dark' : 'text-gray-400'}`}
                style={{ fontFamily: role === 'farmer' ? 'Inter-Bold' : 'Inter-Medium' }}
              >
                Farmer
              </Text>
            </Pressable>

            <Pressable
              onPress={() => switchRole('retailer')}
              className="flex-1 w-full flex-row md:flex-col items-center justify-center"
            >
              <Store size={20} color={role === 'retailer' ? DARK_COLOR : '#9CA3AF'} />
              <Text
                className={`ml-2 md:ml-0 md:mt-2 text-sm ${role === 'retailer' ? 'text-leaf-dark' : 'text-gray-400'}`}
                style={{ fontFamily: role === 'retailer' ? 'Inter-Bold' : 'Inter-Medium' }}
              >
                Retailer
              </Text>
            </Pressable>

            {/* Active Indicator */}
            <Animated.View
              style={[
                { position: 'absolute', backgroundColor: PRIMARY_COLOR, zIndex: 50 },
                isWide
                  ? { width: 6, height: 60, borderTopRightRadius: 8, borderBottomRightRadius: 8 }
                  : { height: 4, width: containerWidth / 2, bottom: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
                indicatorStyle,
              ]}
            />
          </View>

          {/* Mobile Hero (Stacked) OR Desktop Hero (Flex Item) */}
          <View
            className={`z-30 overflow-hidden bg-leaf ${
              isWide
                ? 'h-[548px] w-[320px] rounded-[28px] shadow-2xl shadow-leaf/30 -ml-6'
                : 'w-full h-[200px]'
            }`}
          >
            <Animated.View style={[{ width: isWide ? '100%' : containerWidth * 2, flexDirection: isWide ? 'column' : 'row' }, heroStyle]}>
              {renderHeroContent('farmer')}
              {renderHeroContent('retailer')}
            </Animated.View>
          </View>

          {/* Forms Section */}
          <View
            className={`relative overflow-hidden z-10 bg-white ${
              isWide
                ? 'flex-1 h-full rounded-r-[24px]'
                : 'w-full flex-1'
            }`}
          >
            <Animated.View style={[{ width: isWide ? '100%' : containerWidth * 2, flexDirection: isWide ? 'column' : 'row' }, formStyle]}>
              {renderFormContent('farmer')}
              {renderFormContent('retailer')}
            </Animated.View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
