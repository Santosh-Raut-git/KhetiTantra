import { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase, supabasePublic } from '@/lib/supabase';
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
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
      if (!session?.user?.id) return;
      const { data, error, status } = await supabasePublic
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.warn('Profile fetch warning in profile.jsx:', error);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user?.id) throw new Error('No user on the session!');
      const cleanName = fullName.trim();
      const updates = {
        id: session.user.id,
        full_name: cleanName,
        phone: phone.trim(),
        village: village.trim(),
        district: district.trim(),
        land_area_acres: landArea ? parseFloat(landArea) : null,
        updated_at: new Date().toISOString(),
      };

      // 1. Update public.profiles table in Supabase Database (using supabasePublic to avoid recursive RLS errors)
      const { data, error } = await supabasePublic
        .from('profiles')
        .upsert(updates)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 2. Also keep Supabase Auth metadata in sync so session object carries the updated name
      try {
        await supabase.auth.updateUser({
          data: { full_name: cleanName, name: cleanName },
        });
      } catch (authErr) {
        console.warn('Auth user metadata sync warning:', authErr);
      }

      // 3. Immediately update global Zustand store so Dashboard and Sidebar re-render in real time
      const freshProfile = data || {
        ...(profile ?? { id: session.user.id, preferred_language: 'en' }),
        ...updates,
      };
      setProfile(freshProfile);

      showToast('Profile saved successfully! Dashboard updated.', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error updating profile';
      showToast(msg, 'error');
      if (Platform.OS !== 'web') {
        Alert.alert('Error updating profile', msg);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: width >= 768 ? 32 : 16, paddingTop: 20, flexGrow: 1 }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
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
          {/* Left Column: User Card & Sign Out */}
          {isDesktop ? (
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
                    {profile?.full_name || fullName || 'KhetiTantra User'}
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
          ) : (
            /* Sleek Compact Mobile Profile Card */
            <View style={{ width: '100%', marginBottom: 8 }}>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.06)',
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#E8F5E9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: 'rgba(46,125,50,0.2)',
                        marginRight: 10,
                      }}
                    >
                      <User size={22} color="#2E7D32" strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text
                          style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}
                          numberOfLines={1}
                        >
                          {profile?.full_name || fullName || 'KhetiTantra User'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 8 }}>
                          <CheckCircle2 size={10} color="#2E7D32" />
                          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: '#2E7D32', marginLeft: 3, textTransform: 'capitalize' }}>
                            {userRole}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 1 }} numberOfLines={1}>
                        {session?.user?.email}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={signOut}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFEBEE',
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(211,47,47,0.25)',
                    }}
                  >
                    <LogOut size={13} color="#D32F2F" strokeWidth={2.2} />
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: '#D32F2F', marginLeft: 4 }}>
                      Sign Out
                    </Text>
                  </Pressable>
                </View>

                {/* Compact Status & Location Strip */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 10,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(62,39,35,0.05)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32' }} />
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#2E7D32' }}>Active</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} color="#9E9189" />
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#6D4C41' }}>
                      {profile?.district ? profile.district : 'Location not set'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

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
                        label="Username / Full Name"
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
