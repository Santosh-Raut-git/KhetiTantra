import { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LogOut, User, Shield } from 'lucide-react-native';
import { useIsAdmin } from '@/lib/api/admin';
import { useToast } from '@/components/ui/Toast';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
export default function ProfileScreen() {
  const { session, profile, setProfile } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [landArea, setLandArea] = useState('');
  const { data: isAdmin } = useIsAdmin();
  const { showToast } = useToast();
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setVillage(profile.village || '');
      setDistrict(profile.district || '');
      setLandArea(
        profile.land_area_acres ? profile.land_area_acres.toString() : '',
      );
    } else {
      fetchProfile();
    }
  }, [profile]);
  async function fetchProfile() {
    try {
      if (!session?.user) throw new Error('No user on the session!');
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error loading profile', error.message);
      }
    }
  }
  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');
      const updates = {
        id: session?.user.id,
        full_name: fullName,
        phone,
        village,
        district,
        land_area_acres: landArea ? parseFloat(landArea) : null,
        updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) {
        throw error;
      }
      // Update the store immediately so the dashboard re-renders with the new name
      setProfile({
        ...(profile ?? { id: session.user.id, preferred_language: '' }),
        ...updates,
      });
      showToast('Profile saved!', 'success');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error updating profile', error.message);
      }
    } finally {
      setLoading(false);
    }
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setProfile(null);
      router.replace('/(auth)');
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2 border-b border-soil/5 md:max-w-lg md:w-full md:self-center">
        <Text
          className="text-soil text-2xl font-bold"
          style={{ fontFamily: 'Inter-Bold' }}
        >
          Profile
        </Text>
        {isAdmin && (
          <Pressable
            onPress={() => router.push('/admin')}
            className="flex-row items-center bg-leaf/10 px-4 py-2 rounded-full"
            style={{ minHeight: 44 }}
          >
            <Shield size={18} color="#2E7D32" />
            <Text
              className="text-leaf font-bold ml-2 text-sm"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Admin Panel
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-8 pt-4 md:max-w-lg md:w-full md:self-center md:py-8"
      >
        <Animated.View entering={ZoomIn.duration(500)}>
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-leaf/10 items-center justify-center mb-3">
              <User size={32} color="#2E7D32" strokeWidth={1.5} />
            </View>
            {profile?.full_name ? (
              <Text
                className="text-soil text-lg font-bold mb-0.5"
                style={{ fontFamily: 'Inter-Bold' }}
              >
                {profile.full_name}
              </Text>
            ) : null}
            <Text
              className="text-soil-muted text-sm"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              {session?.user?.email}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(500)}>
          <View className="bg-surface p-5 rounded-3xl border border-soil/5 mb-6">
            <Text
              className="text-soil text-lg font-bold mb-4"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Personal Information
            </Text>

            <Input
              label="Full Name"
              placeholder="Ramesh Kumar"
              value={fullName}
              onChangeText={setFullName}
            />
            <Input
              label="Phone Number"
              placeholder="9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label="Village"
              placeholder="Your village name"
              value={village}
              onChangeText={setVillage}
            />
            <Input
              label="District"
              placeholder="Your district"
              value={district}
              onChangeText={setDistrict}
            />
            <Input
              label="Total Land Area (Acres)"
              placeholder="e.g. 3.5"
              value={landArea}
              onChangeText={setLandArea}
              keyboardType="numeric"
            />

            <Button
              label={loading ? 'Saving...' : 'Save Changes'}
              onPress={updateProfile}
              disabled={loading}
              className="mt-2"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).duration(500)}>
          <Button
            label="Log Out"
            variant="secondary"
            icon={<LogOut size={18} color="#3E2723" />}
            onPress={signOut}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
