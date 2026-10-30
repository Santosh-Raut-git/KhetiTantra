import { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LogOut, User, Shield, CheckCircle2, MapPin, Phone, Building } from 'lucide-react-native';
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
      showToast('Profile saved successfully!', 'success');
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

  const userRole = profile?.role || session?.user?.user_metadata?.role || 'farmer';
  const isRetailer = userRole === 'retailer';

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        contentContainerClassName="w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-12 pt-6"
      >
        {/* Desktop Header Banner */}
        <View className="flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-soil/5">
          <View>
            <Text
              className="text-soil text-2xl lg:text-3xl font-bold"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Account & Profile
            </Text>
            <Text
              className="text-soil-muted text-sm mt-1"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Manage your personal credentials, contact details, and farming operations
            </Text>
          </View>

          {isAdmin && (
            <Pressable
              onPress={() => router.push('/admin')}
              className="flex-row items-center bg-leaf/10 border border-leaf/20 px-4 py-2.5 rounded-xl self-start sm:self-auto hover:bg-leaf/20"
              style={{ minHeight: 42 }}
            >
              <Shield size={18} color="#2E7D32" strokeWidth={2} />
              <Text
                className="text-leaf font-bold ml-2 text-sm"
                style={{ fontFamily: 'Inter-Bold' }}
              >
                Admin Panel
              </Text>
            </Pressable>
          )}
        </View>

        {/* 2-Column Desktop SaaS Layout */}
        <View className="flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: User Card & Sign Out (~340px) */}
          <View className="w-full lg:w-80 shrink-0 flex-col gap-6">
            <Animated.View entering={ZoomIn.duration(400)}>
              <View
                className="bg-surface rounded-2xl p-6 border border-soil/5 shadow-sm items-center text-center"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="w-24 h-24 rounded-full bg-leaf/10 items-center justify-center mb-4 border-2 border-leaf/20">
                  <User size={44} color="#2E7D32" strokeWidth={1.6} />
                </View>

                <Text
                  className="text-soil text-xl font-bold mb-1"
                  style={{ fontFamily: 'Inter-Bold' }}
                >
                  {profile?.full_name || 'KhetiTantra User'}
                </Text>

                <Text
                  className="text-soil-muted text-xs mb-3"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  {session?.user?.email}
                </Text>

                <View className="flex-row items-center bg-leaf/10 px-3 py-1 rounded-full border border-leaf/15 mb-4">
                  <CheckCircle2 size={13} color="#2E7D32" />
                  <Text
                    className="text-leaf text-xs capitalize font-semibold ml-1.5"
                    style={{ fontFamily: 'Inter-Medium' }}
                  >
                    {userRole} Account
                  </Text>
                </View>

                {/* Metadata summary */}
                <View className="w-full pt-4 border-t border-soil/5 space-y-2">
                  <View className="flex-row items-center justify-between text-xs py-1">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Status
                    </Text>
                    <Text className="text-leaf text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      Active
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between text-xs py-1">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Location
                    </Text>
                    <Text className="text-soil text-xs font-medium" style={{ fontFamily: 'Inter-Medium' }}>
                      {profile?.district ? `${profile.district}` : 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Sign Out Card */}
            <View className="bg-surface rounded-2xl p-4 border border-soil/5 shadow-xs">
              <Button
                label="Sign Out"
                variant="secondary"
                icon={<LogOut size={17} color="#3E2723" />}
                onPress={signOut}
              />
            </View>
          </View>

          {/* Right Column: Editable Information Form */}
          <View className="flex-1 w-full">
            <Animated.View entering={FadeInUp.delay(100).duration(450)}>
              <View
                className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="mb-6 pb-4 border-b border-soil/5">
                  <Text
                    className="text-soil text-lg font-bold"
                    style={{ fontFamily: 'Inter-Bold' }}
                  >
                    Personal & Farm Information
                  </Text>
                  <Text
                    className="text-soil-muted text-xs mt-1"
                    style={{ fontFamily: 'Inter-Regular' }}
                  >
                    Your details help us match regional market mandi rates and facilitate direct harvest trade.
                  </Text>
                </View>

                {/* Form Inputs Grid */}
                <View className="gap-4">
                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Input
                        label="Full Name"
                        placeholder="e.g. Ramesh Kumar"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        label="Phone Number"
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Input
                        label="Village / Town"
                        placeholder="Your village or town"
                        value={village}
                        onChangeText={setVillage}
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        label="District"
                        placeholder="e.g. Sambalpur, Puri"
                        value={district}
                        onChangeText={setDistrict}
                      />
                    </View>
                  </View>

                  {!isRetailer && (
                    <View className="w-full sm:w-1/2 sm:pr-2">
                      <Input
                        label="Total Land Area (Acres)"
                        placeholder="e.g. 4.5"
                        value={landArea}
                        onChangeText={setLandArea}
                        keyboardType="numeric"
                      />
                    </View>
                  )}

                  <View className="pt-4 border-t border-soil/5 flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Text className="text-soil-muted text-xs max-w-md" style={{ fontFamily: 'Inter-Regular' }}>
                      Changes are synchronized across all your devices and marketplace listings automatically.
                    </Text>

                    <Button
                      label={loading ? 'Saving Changes...' : 'Save Changes'}
                      onPress={updateProfile}
                      disabled={loading}
                      className="w-full sm:w-auto px-8"
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
