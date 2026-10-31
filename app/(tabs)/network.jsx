import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGrowers } from '@/lib/api/network';
import { useToast } from '@/components/ui/Toast';
import {
  Users,
  Search,
  MapPin,
  Phone,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  X,
  Store,
  Copy,
  ExternalLink,
  MessageSquare,
} from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function GrowerCard({ grower, index, onSelect, onCall }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const initials = grower.displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 60, 300)).duration(400)}
      style={animatedStyle}
      className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-12px)] xl:w-[calc(25%-12px)]"
    >
      <Pressable
        onPress={() => onSelect(grower)}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(62,39,35,0.06)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 220,
          shadowColor: '#3E2723',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View>
          {/* Top Row: Avatar & Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: '#E8F5E9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(46,125,50,0.15)',
                }}
              >
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#2E7D32' }}>
                  {initials || 'GR'}
                </Text>
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }} numberOfLines={1}>
                    {grower.displayName}
                  </Text>
                  {grower.hasDetails && (
                    <ShieldCheck size={16} color="#2E7D32" strokeWidth={2.2} />
                  )}
                </View>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 1 }}>
                  Registered Producer
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor:
                  grower.scale === 'Commercial'
                    ? 'rgba(46,125,50,0.1)'
                    : grower.scale === 'Medium Scale'
                    ? 'rgba(245,127,23,0.1)'
                    : '#F5F5F0',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 11,
                  color:
                    grower.scale === 'Commercial'
                      ? '#2E7D32'
                      : grower.scale === 'Medium Scale'
                      ? '#F57F17'
                      : '#6D4C41',
                }}
              >
                {grower.scale}
              </Text>
            </View>
          </View>

          {/* Location & Farm Size */}
          <View
            style={{
              paddingVertical: 12,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: 'rgba(62,39,35,0.05)',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#9E9189" strokeWidth={2} />
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#6D4C41' }}>
                {grower.village ? `${grower.village}, ` : ''}
                {grower.district || 'Location not specified'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sprout size={14} color="#2E7D32" strokeWidth={2} />
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#3E2723' }}>
                  {grower.acres > 0 ? `${grower.acres} Acres Cultivated` : 'Acreage unrecorded'}
                </Text>
              </View>

              {grower.activeLotsCount > 0 && (
                <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#2E7D32' }}>
                    {grower.activeLotsCount} active lot{grower.activeLotsCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
          {grower.phone ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onCall(grower.phone);
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E8F5E9',
                borderRadius: 12,
                paddingVertical: 9,
                paddingHorizontal: 12,
                gap: 6,
              }}
            >
              <Phone size={14} color="#2E7D32" strokeWidth={2.2} />
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, color: '#2E7D32' }}>
                Call Grower
              </Text>
            </Pressable>
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: '#F5F5F0',
                borderRadius: 12,
                paddingVertical: 9,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189' }}>
                No phone registered
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => onSelect(grower)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.1)',
              borderRadius: 12,
              paddingVertical: 9,
              paddingHorizontal: 14,
              gap: 4,
            }}
          >
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#3E2723' }}>
              Profile
            </Text>
            <ChevronRight size={14} color="#3E2723" strokeWidth={2} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function NetworkScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useGrowers();

  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedScale, setSelectedScale] = useState('');
  const [activeModalGrower, setActiveModalGrower] = useState(null);

  const growers = data?.growers || [];
  const districts = data?.districts || [];
  const totalAcreage = data?.totalAcreage || 0;
  const totalLots = data?.totalLots || 0;

  const filteredGrowers = useMemo(() => {
    return growers.filter((g) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        g.displayName.toLowerCase().includes(q) ||
        (g.village && g.village.toLowerCase().includes(q)) ||
        (g.district && g.district.toLowerCase().includes(q));

      const matchDistrict = !selectedDistrict || g.district === selectedDistrict;
      const matchScale = !selectedScale || g.scale === selectedScale;

      return matchSearch && matchDistrict && matchScale;
    });
  }, [growers, search, selectedDistrict, selectedScale]);

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      showToast('No contact phone available for this grower', 'error');
      return;
    }
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      // If tel: fails (e.g. desktop web), copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(cleanPhone);
        showToast(`Phone ${cleanPhone} copied to clipboard!`, 'success');
      } else {
        showToast(`Contact: ${cleanPhone}`, 'info');
      }
    });
  };

  const handleCopyPhone = (phoneNumber) => {
    if (!phoneNumber) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phoneNumber);
      showToast('Phone number copied to clipboard!', 'success');
    } else {
      showToast(phoneNumber, 'info');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center p-8">
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#D32F2F' }}>
          Error loading grower network
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 4 }}>
          {error.message || 'Please check your internet connection'}
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{ marginTop: 14, backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
        >
          <Text style={{ fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 13 }}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, width: '100%' }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
      >
        {/* Desktop Header Banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 28,
            paddingBottom: 22,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(62,39,35,0.06)',
          }}
        >
          <View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 30, color: '#3E2723' }}>
              Grower Network
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: '#9E9189', marginTop: 3 }}>
              Direct procurement directory of verified local farmers, crop acreage, and harvest capacity
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/marketplace')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#2E7D32',
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 12,
              shadowColor: '#2E7D32',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              gap: 8,
            }}
          >
            <Store size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={{ fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 14 }}>
              Browse Marketplace
            </Text>
          </Pressable>
        </View>

        {/* 4 Overview Metric Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
          <View
            style={{
              flex: 1,
              minWidth: 160,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
              shadowColor: '#3E2723',
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>
                Verified Growers
              </Text>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#2E7D32" strokeWidth={2} />
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#2E7D32' }}>
              {growers.length}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 160,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
              shadowColor: '#3E2723',
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>
                Total Farm Acreage
              </Text>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center' }}>
                <Sprout size={18} color="#F57F17" strokeWidth={2} />
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#3E2723' }}>
              {totalAcreage.toFixed(0)} <Text style={{ fontSize: 14, fontFamily: 'Inter-Regular', color: '#9E9189' }}>Acres</Text>
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 160,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
              shadowColor: '#3E2723',
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>
                Districts Covered
              </Text>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color="#1565C0" strokeWidth={2} />
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#1565C0' }}>
              {districts.length}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 160,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
              shadowColor: '#3E2723',
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>
                Active Market Lots
              </Text>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' }}>
                <Store size={18} color="#2E7D32" strokeWidth={2} />
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#2E7D32' }}>
              {totalLots}
            </Text>
          </View>
        </View>

        {/* Search & Filters Toolbar */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: 'rgba(62,39,35,0.06)',
            marginBottom: 24,
            gap: 14,
            shadowColor: '#3E2723',
            shadowOpacity: 0.03,
            shadowRadius: 6,
          }}
        >
          {/* Search Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F5F0',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.1)',
              paddingHorizontal: 14,
              height: 46,
            }}
          >
            <Search size={18} color="#9E9189" strokeWidth={2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search growers by name, village, or district…"
              placeholderTextColor="#9E9189"
              style={{ flex: 1, marginLeft: 10, fontFamily: 'Inter-Regular', fontSize: 14, color: '#3E2723' }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X size={16} color="#9E9189" strokeWidth={2} />
              </Pressable>
            )}
          </View>

          {/* Filter Pills Rows */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {/* Districts filter */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginRight: 4 }}>
                District:
              </Text>
              <Pressable
                onPress={() => setSelectedDistrict('')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  backgroundColor: selectedDistrict === '' ? '#2E7D32' : '#F5F5F0',
                  borderColor: selectedDistrict === '' ? '#2E7D32' : 'rgba(62,39,35,0.1)',
                }}
              >
                <Text
                  style={{
                    fontFamily: selectedDistrict === '' ? 'Inter-Bold' : 'Inter-Medium',
                    fontSize: 12,
                    color: selectedDistrict === '' ? '#FFFFFF' : '#6D4C41',
                  }}
                >
                  All Districts
                </Text>
              </Pressable>

              {districts.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDistrict(d === selectedDistrict ? '' : d)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    backgroundColor: selectedDistrict === d ? '#2E7D32' : '#F5F5F0',
                    borderColor: selectedDistrict === d ? '#2E7D32' : 'rgba(62,39,35,0.1)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: selectedDistrict === d ? 'Inter-Bold' : 'Inter-Medium',
                      fontSize: 12,
                      color: selectedDistrict === d ? '#FFFFFF' : '#6D4C41',
                    }}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Farm scale filter */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginRight: 4 }}>
                Scale:
              </Text>
              {['', 'Commercial', 'Medium Scale', 'Smallholder'].map((scaleVal) => (
                <Pressable
                  key={scaleVal || 'all'}
                  onPress={() => setSelectedScale(scaleVal === selectedScale ? '' : scaleVal)}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 5,
                    borderRadius: 8,
                    borderWidth: 1,
                    backgroundColor: selectedScale === scaleVal ? '#3E2723' : '#F5F5F0',
                    borderColor: selectedScale === scaleVal ? '#3E2723' : 'rgba(62,39,35,0.08)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: selectedScale === scaleVal ? 'Inter-Bold' : 'Inter-Regular',
                      fontSize: 11,
                      color: selectedScale === scaleVal ? '#FFFFFF' : '#6D4C41',
                    }}
                  >
                    {scaleVal || 'All Scales'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Results Counter */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189' }}>
            Showing <Text style={{ fontFamily: 'Inter-Bold', color: '#3E2723' }}>{filteredGrowers.length}</Text> growers
          </Text>

          {(search || selectedDistrict || selectedScale) && (
            <Pressable
              onPress={() => {
                setSearch('');
                setSelectedDistrict('');
                setSelectedScale('');
              }}
            >
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
                Clear Filters
              </Text>
            </Pressable>
          )}
        </View>

        {/* Grower Grid */}
        {filteredGrowers.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 40,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Users size={26} color="#2E7D32" strokeWidth={1.8} />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}>
              No growers found
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', textAlign: 'center', marginTop: 4, maxWidth: 360 }}>
              Try adjusting your search criteria or reset district and scale filters.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {filteredGrowers.map((grower, i) => (
              <GrowerCard
                key={grower.id}
                grower={grower}
                index={i}
                onSelect={(g) => setActiveModalGrower(g)}
                onCall={handleCall}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Interactive Grower Profile Modal */}
      {activeModalGrower && (
        <Modal
          visible={Boolean(activeModalGrower)}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModalGrower(null)}
        >
          <Pressable
            onPress={() => setActiveModalGrower(null)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.45)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 540,
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 26,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
              }}
            >
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 20,
                      backgroundColor: '#E8F5E9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: 'rgba(46,125,50,0.2)',
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: '#2E7D32' }}>
                      {activeModalGrower.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'GR'}
                    </Text>
                  </View>

                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: '#3E2723' }}>
                        {activeModalGrower.displayName}
                      </Text>
                      {activeModalGrower.hasDetails && (
                        <CheckCircle2 size={18} color="#2E7D32" strokeWidth={2.2} />
                      )}
                    </View>
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 2 }}>
                      Verified KhetiTantra Producer
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setActiveModalGrower(null)}
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} color="#6D4C41" strokeWidth={2} />
                </Pressable>
              </View>

              {/* Information Grid */}
              <View
                style={{
                  backgroundColor: '#F5F5F0',
                  borderRadius: 16,
                  padding: 16,
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189' }}>
                    Farm Location
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
                    {activeModalGrower.village ? `${activeModalGrower.village}, ` : ''}
                    {activeModalGrower.district || 'Not recorded'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189' }}>
                    Cultivated Acreage
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#2E7D32' }}>
                    {activeModalGrower.acres > 0 ? `${activeModalGrower.acres} Acres` : 'N/A'} ({activeModalGrower.scale})
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189' }}>
                    Direct Contact Phone
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
                      {activeModalGrower.phone || 'Not shared'}
                    </Text>
                    {activeModalGrower.phone && (
                      <Pressable onPress={() => handleCopyPhone(activeModalGrower.phone)} hitSlop={6}>
                        <Copy size={14} color="#2E7D32" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>

              {/* Active Market Lots Section */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723', marginBottom: 10 }}>
                  Active Marketplace Lots
                </Text>

                {activeModalGrower.activeListings && activeModalGrower.activeListings.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    {activeModalGrower.activeListings.map((lot) => (
                      <View
                        key={lot.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: 'rgba(62,39,35,0.08)',
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <View>
                          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
                            {lot.crop_type} ({lot.category})
                          </Text>
                          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 1 }}>
                            Available: {lot.quantity_available} {lot.unit}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#2E7D32' }}>
                          ₹{lot.price_per_unit} / {lot.unit}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#F5F5F0', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189' }}>
                      No active crop lots listed currently. Contact grower directly for seasonal harvests.
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions Footer */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {activeModalGrower.phone && (
                  <Pressable
                    onPress={() => {
                      handleCall(activeModalGrower.phone);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#2E7D32',
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      shadowColor: '#2E7D32',
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                    }}
                  >
                    <Phone size={16} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={{ fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 14 }}>
                      Call Farmer
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => {
                    setActiveModalGrower(null);
                    showToast('Inquiry drafted! You can connect with this grower.', 'success');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#F5F5F0',
                    borderWidth: 1,
                    borderColor: 'rgba(62,39,35,0.1)',
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Inter-Bold', color: '#3E2723', fontSize: 14 }}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
