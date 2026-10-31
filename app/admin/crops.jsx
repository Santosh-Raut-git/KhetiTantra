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
import { useAdminCrops, useDeleteCropAdmin } from '@/lib/api/admin';
import {
  Sprout,
  Trash2,
  User,
  Search,
  X,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { getStatusColor, getStatusBg } from '@/lib/utils';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AdminCropsScreen() {
  const { data: crops, isLoading, refetch } = useAdminCrops();
  const deleteCrop = useDeleteCropAdmin();
  const { width } = useWindowDimensions();
  const numColumns = width >= 1440 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const cardWidth = `${100 / numColumns}%`;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');

  const handleDeleteCrop = (crop) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${crop.crop_name}"?\n\nThis will permanently delete this crop and its linked transaction ledger entries.`,
      );
      if (confirmed) {
        deleteCrop.mutate(crop.id, {
          onError: (err) => alert('Error: ' + err.message),
        });
      }
    } else {
      Alert.alert(
        'Delete Crop',
        `Are you sure you want to delete "${crop.crop_name}"? This will also remove linked transactions.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteCrop.mutate(crop.id, {
                onError: (err) => Alert.alert('Error', err.message),
              });
            },
          },
        ],
      );
    }
  };

  const filteredCrops = useMemo(() => {
    if (!crops) return [];
    const q = search.trim().toLowerCase();
    return crops.filter((c) => {
      const matchSearch =
        !q ||
        c.crop_name?.toLowerCase().includes(q) ||
        c.variety?.toLowerCase().includes(q) ||
        c.profiles?.full_name?.toLowerCase().includes(q);

      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchSeason = !seasonFilter || c.season === seasonFilter;

      return matchSearch && matchStatus && matchSeason;
    });
  }, [crops, search, statusFilter, seasonFilter]);

  const stats = useMemo(() => {
    if (!crops) return { active: 0, harvested: 0, failed: 0, totalAcres: 0 };
    let active = 0;
    let harvested = 0;
    let failed = 0;
    let totalAcres = 0;

    crops.forEach((c) => {
      if (c.status === 'active') active++;
      else if (c.status === 'harvested') harvested++;
      else if (c.status === 'failed') failed++;
      if (c.area_acres) totalAcres += Number(c.area_acres);
    });

    return { active, harvested, failed, totalAcres };
  }, [crops]);

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
              Crop Cultivation Oversight
            </Text>
            <Text
              style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 2 }}
            >
              Tracking {crops?.length || 0} batches recorded by farmers across Kharif, Rabi & Zaid seasons
            </Text>
          </View>
        </View>

        {/* 4 Summary Metric Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Total Batches</Text>
              <Layers size={16} color="#3E2723" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#3E2723' }}>
              {crops?.length || 0}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Active Growing</Text>
              <Clock size={16} color="#F57F17" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#F57F17' }}>
              {stats.active}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Harvested</Text>
              <CheckCircle2 size={16} color="#2E7D32" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#2E7D32' }}>
              {stats.harvested}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Total Acreage</Text>
              <Sprout size={16} color="#2E7D32" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#2E7D32' }}>
              {stats.totalAcres.toFixed(1)} <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: '#9E9189' }}>Acres</Text>
            </Text>
          </View>
        </View>

        {/* Search & Multi-Filter Toolbar */}
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
              placeholder="Search by crop name, variety, or farmer..."
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

          {/* Season & Status Filters Row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            {/* Status Filter */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginRight: 2 }}>
                Status:
              </Text>
              {[
                { label: 'All', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Harvested', value: 'harvested' },
                { label: 'Failed', value: 'failed' },
              ].map((tab) => {
                const active = statusFilter === tab.value;
                return (
                  <Pressable
                    key={tab.label}
                    onPress={() => setStatusFilter(tab.value)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: active ? '#2E7D32' : '#F5F5F0',
                      borderWidth: 1,
                      borderColor: active ? '#2E7D32' : 'rgba(62,39,35,0.08)',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: active ? 'Inter-Bold' : 'Inter-Medium',
                        fontSize: 11,
                        color: active ? '#FFFFFF' : '#6D4C41',
                      }}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Season Filter */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginRight: 2 }}>
                Season:
              </Text>
              {['', 'Kharif', 'Rabi', 'Zaid'].map((s) => {
                const active = seasonFilter === s;
                return (
                  <Pressable
                    key={s || 'all'}
                    onPress={() => setSeasonFilter(s)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: active ? '#3E2723' : '#F5F5F0',
                      borderWidth: 1,
                      borderColor: active ? '#3E2723' : 'rgba(62,39,35,0.08)',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: active ? 'Inter-Bold' : 'Inter-Regular',
                        fontSize: 11,
                        color: active ? '#FFFFFF' : '#6D4C41',
                      }}
                    >
                      {s || 'All Seasons'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Results Counter */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189' }}>
            Showing <Text style={{ fontFamily: 'Inter-Bold', color: '#3E2723' }}>{filteredCrops.length}</Text> crop records
          </Text>
          {(search || statusFilter || seasonFilter) && (
            <Pressable onPress={() => { setSearch(''); setStatusFilter(''); setSeasonFilter(''); }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
                Reset Filters
              </Text>
            </Pressable>
          )}
        </View>

        {/* Crops Responsive Grid */}
        {filteredCrops.length === 0 ? (
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
              <Sprout size={26} color="#2E7D32" strokeWidth={1.8} />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}>
              No crop records found
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 4, textAlign: 'center', maxWidth: 340 }}>
              Try searching with different keywords or clearing active status/season filters.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -8 }}>
            {filteredCrops.map((crop, i) => (
              <Animated.View
                key={crop.id}
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
                    minHeight: 200,
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
                    {/* Top Row: Crop Icon, Name, Status Badge, Delete */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            backgroundColor: '#E8F5E9',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(46,125,50,0.18)',
                          }}
                        >
                          <Sprout size={22} color="#2E7D32" strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}
                            numberOfLines={1}
                          >
                            {crop.crop_name}
                          </Text>
                          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 1 }}>
                            {crop.season} Season {crop.variety ? `• ${crop.variety}` : ''}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleDeleteCrop(crop)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          backgroundColor: '#FFEBEE',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        hitSlop={6}
                      >
                        <Trash2 size={15} color="#D32F2F" strokeWidth={2} />
                      </Pressable>
                    </View>

                    {/* Status Pill & Area */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
                      <View
                        className={`px-2.5 py-0.5 rounded-full ${getStatusBg(crop.status)}`}
                      >
                        <Text
                          className={`text-xs capitalize ${getStatusColor(crop.status)}`}
                          style={{ fontFamily: 'Inter-Bold' }}
                        >
                          {crop.status}
                        </Text>
                      </View>

                      {crop.area_acres && (
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#3E2723' }}>
                          {crop.area_acres} Acres Sown
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Grower Attribution & Sowing Date */}
                  <View
                    style={{
                      paddingTop: 10,
                      marginTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(62,39,35,0.05)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, marginRight: 6 }}>
                      <User size={13} color="#9E9189" />
                      <Text
                        style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#6D4C41' }}
                        numberOfLines={1}
                      >
                        {crop.profiles?.full_name || 'Grower'}
                      </Text>
                    </View>

                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                      {crop.sowing_date}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
