import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminUsers, useDeleteUserAdmin } from '@/lib/api/admin';
import {
  User,
  MapPin,
  Phone,
  Trash2,
  Sprout,
  Globe,
  Search,
  X,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Users,
  Store,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AdminUsersScreen() {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const deleteUser = useDeleteUserAdmin();
  const { width } = useWindowDimensions();
  const numColumns = width >= 1440 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const cardWidth = `${100 / numColumns}%`;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '' | 'farmer' | 'retailer' | 'admin'

  const handleDeleteUser = (user) => {
    const userName = user.full_name || 'this user';
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${userName}"?\n\nThis will permanently remove their profile, crops, and ledger transactions.`,
      );
      if (confirmed) {
        deleteUser.mutate(user.id, {
          onError: (err) => alert('Error: ' + err.message),
        });
      }
    } else {
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete "${userName}"? This will remove all their data including crops and transactions.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteUser.mutate(user.id, {
                onError: (err) => Alert.alert('Error', err.message),
              });
            },
          },
        ],
      );
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.village?.toLowerCase().includes(q) ||
        u.district?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q);

      let matchRole = true;
      if (roleFilter === 'farmer') matchRole = u.role === 'farmer' || (!u.role && !u.is_admin);
      else if (roleFilter === 'retailer') matchRole = u.role === 'retailer';
      else if (roleFilter === 'admin') matchRole = Boolean(u.is_admin);

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    if (!users) return { farmers: 0, retailers: 0, admins: 0, totalAcres: 0 };
    let farmers = 0;
    let retailers = 0;
    let admins = 0;
    let totalAcres = 0;

    users.forEach((u) => {
      if (u.is_admin) admins++;
      if (u.role === 'retailer') retailers++;
      else farmers++;
      if (u.land_area_acres) totalAcres += Number(u.land_area_acres);
    });

    return { farmers, retailers, admins, totalAcres };
  }, [users]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, width: '100%' }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Header Banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(62,39,35,0.06)',
          }}
        >
          <View>
            <Text
              style={{ fontFamily: 'Inter-Bold', fontSize: 28, color: '#3E2723' }}
            >
              User Directory & Permissions
            </Text>
            <Text
              style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 2 }}
            >
              Auditing {users?.length || 0} registered platform members across all districts
            </Text>
          </View>
        </View>

        {/* 4 Summary Metric Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Total Users</Text>
              <Users size={16} color="#2E7D32" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#3E2723' }}>
              {users?.length || 0}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Growers (Farmers)</Text>
              <Sprout size={16} color="#2E7D32" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#2E7D32' }}>
              {stats.farmers}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Buyers (Retailers)</Text>
              <Store size={16} color="#F57F17" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#F57F17' }}>
              {stats.retailers}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Total Cultivated</Text>
              <MapPin size={16} color="#1565C0" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#1565C0' }}>
              {stats.totalAcres.toFixed(1)} <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: '#9E9189' }}>Acres</Text>
            </Text>
          </View>
        </View>

        {/* Search & Filter Toolbar */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(62,39,35,0.06)',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            shadowColor: '#3E2723',
            shadowOpacity: 0.03,
            shadowRadius: 6,
          }}
        >
          {/* Search Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F5F0',
              borderRadius: 12,
              paddingHorizontal: 14,
              height: 44,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.08)',
            }}
          >
            <Search size={18} color="#9E9189" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, phone, village, or district..."
              placeholderTextColor="#9E9189"
              style={{
                flex: 1,
                marginLeft: 10,
                fontFamily: 'Inter-Regular',
                fontSize: 14,
                color: '#3E2723',
                outline: 'none',
              }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X size={16} color="#9E9189" />
              </Pressable>
            )}
          </View>

          {/* Role Filter Chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginRight: 4 }}>
              Account Type:
            </Text>
            {[
              { label: 'All Users', value: '' },
              { label: 'Growers (Farmers)', value: 'farmer' },
              { label: 'Buyers (Retailers)', value: 'retailer' },
              { label: 'Super Admins', value: 'admin' },
            ].map((tab) => {
              const active = roleFilter === tab.value;
              return (
                <Pressable
                  key={tab.label}
                  onPress={() => setRoleFilter(tab.value)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? '#2E7D32' : '#F5F5F0',
                    borderWidth: 1,
                    borderColor: active ? '#2E7D32' : 'rgba(62,39,35,0.08)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: active ? 'Inter-Bold' : 'Inter-Medium',
                      fontSize: 12,
                      color: active ? '#FFFFFF' : '#6D4C41',
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Results Counter */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189' }}>
            Showing <Text style={{ fontFamily: 'Inter-Bold', color: '#3E2723' }}>{filteredUsers.length}</Text> user accounts
          </Text>
          {(search || roleFilter) && (
            <Pressable onPress={() => { setSearch(''); setRoleFilter(''); }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
                Reset Filters
              </Text>
            </Pressable>
          )}
        </View>

        {/* User Cards Responsive Grid */}
        {filteredUsers.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Users size={26} color="#2E7D32" strokeWidth={1.8} />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}>
              No users match your criteria
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 4, textAlign: 'center', maxWidth: 340 }}>
              Try adjusting your search terms or selecting a different account type filter.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -8 }}>
            {filteredUsers.map((user, i) => {
              const isFarmer = user.role !== 'retailer';
              const isAdmin = Boolean(user.is_admin);

              return (
                <Animated.View
                  key={user.id}
                  entering={FadeInUp.delay(Math.min(i * 30, 240)).duration(300)}
                  style={{ width: cardWidth, padding: 8 }}
                >
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: 'rgba(62,39,35,0.06)',
                      padding: 18,
                      height: '100%',
                      minHeight: 210,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      shadowColor: '#3E2723',
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <View>
                      {/* Top Row: User Avatar, Name, Role Badge, Delete */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 14,
                              backgroundColor: isAdmin ? '#FFEBEE' : isFarmer ? '#E8F5E9' : '#FFF8E1',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                              borderWidth: 1,
                              borderColor: isAdmin ? 'rgba(211,47,47,0.2)' : isFarmer ? 'rgba(46,125,50,0.2)' : 'rgba(245,127,23,0.2)',
                            }}
                          >
                            {isAdmin ? (
                              <Shield size={20} color="#D32F2F" strokeWidth={2} />
                            ) : isFarmer ? (
                              <Sprout size={20} color="#2E7D32" strokeWidth={2} />
                            ) : (
                              <Store size={20} color="#F57F17" strokeWidth={2} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text
                                style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}
                                numberOfLines={1}
                              >
                                {user.full_name || 'Unnamed User'}
                              </Text>
                              {isAdmin && (
                                <View style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 9, color: '#D32F2F', textTransform: 'uppercase' }}>
                                    Admin
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 1 }}>
                              {user.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account` : 'Farmer Account'}
                            </Text>
                          </View>
                        </View>

                        <Pressable
                          onPress={() => handleDeleteUser(user)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: '#FFEBEE',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          hitSlop={6}
                        >
                          <Trash2 size={16} color="#D32F2F" strokeWidth={2} />
                        </Pressable>
                      </View>

                      {/* Details row: Location, Phone, Land */}
                      <View
                        style={{
                          paddingTop: 10,
                          borderTopWidth: 1,
                          borderTopColor: 'rgba(62,39,35,0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={13} color="#9E9189" />
                          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#6D4C41' }}>
                            {user.village ? `${user.village}, ` : ''}{user.district || 'Location unrecorded'}
                          </Text>
                        </View>

                        {user.phone && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Phone size={13} color="#9E9189" />
                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#3E2723' }}>
                              {user.phone}
                            </Text>
                          </View>
                        )}

                        {user.land_area_acres && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Sprout size={13} color="#2E7D32" />
                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
                              {user.land_area_acres} Acres Cultivated
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Footer: Joined date */}
                    <View
                      style={{
                        paddingTop: 10,
                        marginTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(62,39,35,0.04)',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                        Registered: {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      {user.preferred_language && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Globe size={11} color="#9E9189" />
                          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#9E9189', textTransform: 'uppercase' }}>
                            {user.preferred_language}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
