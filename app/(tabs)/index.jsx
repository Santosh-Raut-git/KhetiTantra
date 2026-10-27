import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { useCrops } from '@/lib/api/crops';
import { useTransactions } from '@/lib/api/transactions';
import { useListings } from '@/lib/api/listings';
import { Card } from '@/components/ui/Card';
import {
  Sprout,
  TrendingUp,
  TrendingDown,
  Plus,
  Wallet,
  FileText,
  ArrowRight,
  Search,
  X,
  MapPin,
  ChevronRight,
  Package,
  Tag,
  Store,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Other'];

const UNIT_LABELS = {
  quintal: 'qtl',
  kg: 'kg',
  ton: 'ton',
  dozen: 'dz',
  piece: 'pc',
};

const CAT_COLORS = {
  Vegetables: { bg: '#E8F5E9', text: '#2E7D32' },
  Fruits: { bg: '#FFF8E1', text: '#F57F17' },
  Grains: { bg: '#EFEBE9', text: '#4E342E' },
  Pulses: { bg: '#FCE4EC', text: '#C62828' },
  Spices: { bg: '#FFF3E0', text: '#E65100' },
  Other: { bg: '#F5F5F5', text: '#6D4C41' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function QuickActionCard({ onPress, children }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        className="bg-surface border border-soil/5 rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function CategoryChip({ label, isActive, onPress }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 15, stiffness: 500 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 500 }); }}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1,
          backgroundColor: isActive ? '#2E7D32' : '#FFFFFF',
          borderColor: isActive ? '#2E7D32' : 'rgba(62,39,35,0.1)',
          marginRight: 8,
        }}
      >
        <Text
          style={{
            fontFamily: isActive ? 'Inter-Bold' : 'Inter-Medium',
            fontSize: 13,
            color: isActive ? '#FFFFFF' : '#6D4C41',
          }}
        >
          {label || 'All'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ListingCard({ listing, index, onPress }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const unitLabel = UNIT_LABELS[listing.unit] || listing.unit;
  const catColor = CAT_COLORS[listing.category] || CAT_COLORS.Other;

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 60, 300)).duration(380)}
      style={[animStyle, { marginBottom: 10 }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(62,39,35,0.06)',
          shadowColor: '#3E2723',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#E8F5E9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Sprout size={20} color="#2E7D32" strokeWidth={2} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723' }}>
              {listing.crop_type}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <MapPin size={11} color="#9E9189" strokeWidth={2} />
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginLeft: 3 }}>
                {listing.profiles?.village
                  ? `${listing.profiles.village}, ${listing.profiles.district}`
                  : listing.profiles?.district || 'Location not set'}
              </Text>
            </View>
          </View>

          {/* Category badge */}
          <View style={{ backgroundColor: catColor.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: catColor.text }}>
              {listing.category}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(62,39,35,0.05)', marginHorizontal: 14 }} />

        {/* Bottom row — price / qty / arrow */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>Price</Text>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#2E7D32', marginTop: 1 }}>
              ₹{Number(listing.price_per_unit).toLocaleString('en-IN')}
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189' }}>
                {' '}/ {unitLabel}
              </Text>
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>Available</Text>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723', marginTop: 1 }}>
              {Number(listing.quantity_available).toLocaleString('en-IN')}
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12 }}> {unitLabel}</Text>
            </Text>
          </View>

          <ChevronRight size={18} color="#BDB8B0" strokeWidth={2} />
        </View>

        {/* Seller row */}
        {listing.profiles?.full_name && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
              Seller:{' '}
              <Text style={{ fontFamily: 'Inter-Medium', color: '#6D4C41' }}>
                {listing.profiles.full_name}
              </Text>
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { profile, session } = useStore();
  const router = useRouter();

  const { data: crops, isLoading: cropsLoading, refetch: refetchCrops } = useCrops();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useTransactions();
  const { data: listings, isLoading: listingsLoading, refetch: refetchListings } = useListings();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const onRefresh = () => {
    refetchCrops();
    refetchTx();
    refetchListings();
  };

  const activeCropsCount = useMemo(
    () => crops?.filter((c) => c.status === 'active').length || 0,
    [crops],
  );

  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions?.forEach((tx) => {
      if (tx.type === 'income') inc += Number(tx.amount);
      if (tx.type === 'expense') exp += Number(tx.amount);
    });
    return { totalIncome: inc, totalExpense: exp };
  }, [transactions]);

  const netProfit = totalIncome - totalExpense;

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    return listings.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        l.crop_type.toLowerCase().includes(q) ||
        l.profiles?.village?.toLowerCase().includes(q) ||
        l.profiles?.district?.toLowerCase().includes(q);
      const matchCat = !activeCategory || l.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [listings, search, activeCategory]);

  const rawName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0];
  const firstName = rawName?.split(' ')[0] || 'Farmer';

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        contentContainerClassName="md:max-w-3xl md:w-full md:self-center"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        {/* ── Greeting ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: '#6D4C41' }}>
              Welcome back,
            </Text>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 28, color: '#3E2723', marginTop: 2 }}>
              {firstName}
            </Text>
          </View>
        </Animated.View>

        {/* ── Overview stats ─────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(450)}
          style={{ paddingHorizontal: 20 }}
        >
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: '#3E2723', marginBottom: 12 }}>
            Overview
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <Card className="flex-1">
              <View className="w-10 h-10 rounded-full bg-leaf/10 items-center justify-center mb-3">
                <Wallet size={20} color="#2E7D32" />
              </View>
              <Text className="text-soil-muted text-sm mb-1" style={{ fontFamily: 'Inter-Medium' }}>
                Net Balance
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 20,
                  color: netProfit >= 0 ? '#2E7D32' : '#D32F2F',
                }}
              >
                ₹{netProfit.toLocaleString('en-IN')}
              </Text>
            </Card>

            <Card className="flex-1">
              <View className="w-10 h-10 rounded-full bg-soil/5 items-center justify-center mb-3">
                <Sprout size={20} color="#6D4C41" />
              </View>
              <Text className="text-soil-muted text-sm mb-1" style={{ fontFamily: 'Inter-Medium' }}>
                Active Crops
              </Text>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: '#3E2723' }}>
                {activeCropsCount}
              </Text>
            </Card>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <Card className="flex-1">
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 rounded-full bg-leaf/10 items-center justify-center mr-2">
                  <TrendingUp size={14} color="#2E7D32" />
                </View>
                <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Medium' }}>
                  Income
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: '#2E7D32' }}>
                ₹{totalIncome.toLocaleString('en-IN')}
              </Text>
            </Card>

            <Card className="flex-1">
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 rounded-full bg-clay/10 items-center justify-center mr-2">
                  <TrendingDown size={14} color="#D32F2F" />
                </View>
                <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Medium' }}>
                  Expense
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: '#D32F2F' }}>
                ₹{totalExpense.toLocaleString('en-IN')}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(450)}
          style={{ paddingHorizontal: 20, marginBottom: 28 }}
        >
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: '#3E2723', marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View style={{ gap: 10 }}>
            <Animated.View entering={FadeInUp.delay(260).duration(430)}>
              <QuickActionCard onPress={() => router.push('/crops/new')}>
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-4">
                    <Plus size={24} color="#2E7D32" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-soil text-base" style={{ fontFamily: 'Inter-Bold' }}>
                      Add Crop
                    </Text>
                    <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Regular' }}>
                      Start a new crop cycle
                    </Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#BDB8B0" />
              </QuickActionCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(320).duration(430)}>
              <QuickActionCard onPress={() => router.push('/ledger/new')}>
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-clay/10 items-center justify-center mr-4">
                    <FileText size={24} color="#D32F2F" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-soil text-base" style={{ fontFamily: 'Inter-Bold' }}>
                      Add Transaction
                    </Text>
                    <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Regular' }}>
                      Record income or expense
                    </Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#BDB8B0" />
              </QuickActionCard>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── Marketplace Section ────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(360).duration(450)}>
          {/* Heading + View all */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: '#3E2723' }}>
              Marketplace
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/marketplace')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
            >
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#2E7D32' }}>
                View all
              </Text>
              <ChevronRight size={14} color="#2E7D32" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(62,39,35,0.1)',
                paddingHorizontal: 12,
                minHeight: 44,
                shadowColor: '#3E2723',
                shadowOpacity: 0.03,
                shadowRadius: 4,
              }}
            >
              <Search size={17} color="#9E9189" strokeWidth={2} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search crop or location…"
                placeholderTextColor="#9E9189"
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontFamily: 'Inter-Regular',
                  fontSize: 14,
                  color: '#3E2723',
                }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <X size={15} color="#9E9189" strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14 }}
          >
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat || 'all'}
                label={cat}
                isActive={activeCategory === cat}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>

          {/* Stats strip */}
          {listings && listings.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(420).duration(380)}
              style={{
                flexDirection: 'row',
                gap: 10,
                paddingHorizontal: 20,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.06)',
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Package size={15} color="#2E7D32" strokeWidth={2} />
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723' }}>
                    {listings.length}
                  </Text>
                  {'  '}active listings
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.06)',
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Tag size={15} color="#F9A825" strokeWidth={2} />
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723' }}>
                    {filteredListings.length}
                  </Text>
                  {'  '}showing
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Cards / empty / loading */}
          <View style={{ paddingHorizontal: 20 }}>
            {listingsLoading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#2E7D32" />
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 13,
                    color: '#9E9189',
                    marginTop: 10,
                  }}
                >
                  Loading listings…
                </Text>
              </View>
            ) : filteredListings.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center', gap: 8 }}>
                <Store size={34} color="#BDB8B0" strokeWidth={1.5} />
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#6D4C41' }}>
                  {search || activeCategory ? 'No matching listings' : 'No listings yet'}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 13,
                    color: '#9E9189',
                    textAlign: 'center',
                  }}
                >
                  {search || activeCategory
                    ? 'Try a different search or category.'
                    : 'Be the first to list your crop on the marketplace.'}
                </Text>
              </View>
            ) : (
              filteredListings.slice(0, 5).map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  onPress={() => router.push(`/marketplace/${listing.id}`)}
                />
              ))
            )}

            {/* See more button */}
            {filteredListings.length > 5 && (
              <Pressable
                onPress={() => router.push('/(tabs)/marketplace')}
                style={{
                  alignItems: 'center',
                  paddingVertical: 12,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.08)',
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: '#2E7D32' }}>
                  See {filteredListings.length - 5} more listings →
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
