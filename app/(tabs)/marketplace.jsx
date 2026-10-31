import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useListings } from '@/lib/api/listings';
import { useStore } from '@/lib/store';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Store,
  Search,
  Plus,
  Sprout,
  ChevronRight,
  MapPin,
  Package,
  Tag,
  X,
  ShieldCheck,
  Truck,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const UNIT_LABELS = {
  quintal: 'qtl',
  kg: 'kg',
  ton: 'ton',
  dozen: 'dz',
  piece: 'pc',
};

const CATEGORY_COLORS = {
  Vegetables: { bg: 'bg-leaf/10', text: 'text-leaf' },
  Fruits: { bg: 'bg-harvest/10', text: 'text-harvest-dark' },
  Grains: { bg: 'bg-soil/10', text: 'text-soil' },
  Pulses: { bg: 'bg-clay/10', text: 'text-clay' },
  Spices: { bg: 'bg-harvest/15', text: 'text-harvest-dark' },
  Other: { bg: 'bg-soil/5', text: 'text-soil-muted' },
};

function ListingCard({ listing, index, onPress }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const catColors =
    CATEGORY_COLORS[listing.category] || CATEGORY_COLORS.Other;
  const unitLabel = UNIT_LABELS[listing.unit] || listing.unit;

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 60, 300)).duration(400)}
      style={animatedStyle}
      className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-12px)] xl:w-[calc(25%-12px)]"
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        className="bg-surface rounded-2xl border border-soil/5 shadow-sm hover:border-soil/20 transition-all flex-col justify-between"
        style={{
          shadowColor: '#3E2723',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View>
          {/* Card header row */}
          <View className="flex-row items-center p-4 pb-3">
            <View className="w-12 h-12 rounded-2xl bg-leaf/10 items-center justify-center mr-3 border border-leaf/15">
              <Sprout size={22} color="#2E7D32" strokeWidth={2} />
            </View>

            <View className="flex-1">
              <Text
                className="text-soil text-base font-bold"
                style={{ fontFamily: 'Inter-Bold' }}
                numberOfLines={1}
              >
                {listing.crop_type}
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <MapPin size={11} color="#9E9189" strokeWidth={2} />
                <Text
                  className="text-soil-muted text-xs"
                  style={{ fontFamily: 'Inter-Regular' }}
                  numberOfLines={1}
                >
                  {listing.profiles?.village
                    ? `${listing.profiles.village}, ${listing.profiles.district}`
                    : listing.profiles?.district || 'Location not set'}
                </Text>
              </View>
            </View>

            <View className={`px-2.5 py-1 rounded-full ${catColors.bg}`}>
              <Text
                className={`text-xs ${catColors.text}`}
                style={{ fontFamily: 'Inter-Medium' }}
              >
                {listing.category}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-soil/5 mx-4" />

          {/* Stats row */}
          <View className="flex-row items-center px-4 py-3 gap-4">
            <View className="flex-1">
              <Text
                className="text-soil-muted text-xs mb-0.5"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                Price
              </Text>
              <Text
                className="text-leaf"
                style={{ fontFamily: 'Inter-Bold', fontSize: 17 }}
              >
                ₹{Number(listing.price_per_unit).toLocaleString('en-IN')}
                <Text
                  className="text-soil-muted"
                  style={{ fontFamily: 'Inter-Regular', fontSize: 12 }}
                >
                  {' '}
                  / {unitLabel}
                </Text>
              </Text>
            </View>

            <View className="flex-1">
              <Text
                className="text-soil-muted text-xs mb-0.5"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                Available
              </Text>
              <Text
                className="text-soil"
                style={{ fontFamily: 'Inter-Bold', fontSize: 15 }}
              >
                {Number(listing.quantity_available).toLocaleString('en-IN')}{' '}
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12 }}>
                  {unitLabel}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Footer row: Seller & CTA */}
        <View className="px-4 py-3 border-t border-soil/5 flex-row items-center justify-between bg-sand/30 rounded-b-2xl">
          <Text
            className="text-soil-muted text-xs flex-1 mr-2"
            style={{ fontFamily: 'Inter-Regular' }}
            numberOfLines={1}
          >
            Seller: <Text style={{ fontFamily: 'Inter-Medium', color: '#6D4C41' }}>{listing.profiles?.full_name || 'Verified Grower'}</Text>
          </Text>

          <View className="flex-row items-center gap-1">
            <Text className="text-leaf text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              View Details
            </Text>
            <ChevronRight size={16} color="#2E7D32" strokeWidth={2} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const { profile } = useStore();
  const isFarmer = profile?.role === 'farmer' || !profile?.role;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const { data: listings, isLoading, error, refetch } = useListings();

  const categories = ['', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Other'];

  const filtered = useMemo(() => {
    if (!listings) return [];
    return listings.filter((l) => {
      const matchesSearch =
        !search ||
        l.crop_type.toLowerCase().includes(search.toLowerCase()) ||
        l.profiles?.village?.toLowerCase().includes(search.toLowerCase()) ||
        l.profiles?.district?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !activeCategory || l.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [listings, search, activeCategory]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <Text className="text-clay">Error loading marketplace.</Text>
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
            onRefresh={refetch}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Desktop Header Banner */}
        <View className="flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-soil/5">
          <View>
            <Text
              className="text-soil text-2xl lg:text-3xl font-bold"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Produce Marketplace
            </Text>
            <Text
              className="text-soil-muted text-sm mt-1"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Direct-from-grower crop trading • Real-time wholesale prices across districts
            </Text>
          </View>

          {isFarmer && (
            <Pressable
              onPress={() => router.push('/marketplace/new')}
              className="flex-row items-center justify-center bg-leaf px-5 py-3 rounded-xl shadow-sm hover:bg-leaf-dark self-start sm:self-auto"
              style={{ minHeight: 44 }}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text
                className="text-white text-sm ml-2"
                style={{ fontFamily: 'Inter-Bold' }}
              >
                List a Crop for Sale
              </Text>
            </Pressable>
          )}
        </View>

        {/* Search & Category Filter Toolbar */}
        <View className="mb-6 bg-surface p-4 rounded-2xl border border-soil/5 gap-3 shadow-sm">
          {/* Search bar */}
          <View
            className="flex-row items-center bg-sand/60 border border-soil/10 rounded-xl px-3.5 min-h-[44px]"
          >
            <Search size={18} color="#9E9189" strokeWidth={2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by crop name, village, or district…"
              placeholderTextColor="#9E9189"
              className="flex-1 ml-2 text-soil"
              style={{ fontFamily: 'Inter-Regular', fontSize: 15 }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X size={16} color="#9E9189" strokeWidth={2} />
              </Pressable>
            )}
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Pressable
                  key={cat || 'all'}
                  onPress={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl border ${
                    isActive
                      ? 'bg-leaf border-leaf'
                      : 'bg-sand/60 border-soil/10'
                  }`}
                >
                  <Text
                    style={{
                      fontFamily: isActive ? 'Inter-Bold' : 'Inter-Medium',
                      fontSize: 13,
                      color: isActive ? '#FFFFFF' : '#6D4C41',
                    }}
                  >
                    {cat || 'All Categories'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Stats strip */}
        {listings && listings.length > 0 && (
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-surface border border-soil/5 rounded-xl p-3.5 flex-row items-center gap-3">
              <Package size={18} color="#2E7D32" strokeWidth={2} />
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                <Text className="text-soil font-bold text-base">{listings.length}</Text> total active listings
              </Text>
            </View>
            <View className="flex-1 bg-surface border border-soil/5 rounded-xl p-3.5 flex-row items-center gap-3">
              <Tag size={18} color="#F9A825" strokeWidth={2} />
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                <Text className="text-soil font-bold text-base">{filtered.length}</Text> results matching
              </Text>
            </View>
          </View>
        )}

        {/* Produce Grid */}
        {filtered.length === 0 ? (
          <View className="flex-col gap-6">
            <EmptyState
              icon={<Store size={36} color="#2E7D32" strokeWidth={1.8} />}
              title={
                search || activeCategory
                  ? 'No listings match your search'
                  : 'No listings active yet'
              }
              description={
                isFarmer
                  ? 'Be the first to list your crop harvest for sale on the marketplace and connect directly with bulk buyers.'
                  : 'Farmers have not listed any crops matching this filter yet. Check back soon or reset your filter.'
              }
              actionLabel={isFarmer ? 'List a Crop' : undefined}
              onAction={isFarmer ? () => router.push('/marketplace/new') : undefined}
            />

            {/* Marketplace Information Cards */}
            <View className="bg-surface rounded-2xl p-6 border border-soil/5 shadow-xs max-w-3xl mx-auto w-full mt-4">
              <Text className="text-soil font-bold text-base mb-4 text-center" style={{ fontFamily: 'Inter-Bold' }}>
                How KhetiTantra Direct Trading Works
              </Text>
              <View className="flex-col sm:flex-row gap-4">
                <View className="flex-1 items-center text-center p-3">
                  <View className="w-11 h-11 rounded-2xl bg-leaf/10 items-center justify-center mb-2.5 border border-leaf/15">
                    <Sprout size={20} color="#2E7D32" />
                  </View>
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    1. Direct From Farm
                  </Text>
                  <Text className="text-soil-muted text-xs text-center mt-1" style={{ fontFamily: 'Inter-Regular' }}>
                    Growers list harvest batches with verified weight, variety, and location.
                  </Text>
                </View>

                <View className="flex-1 items-center text-center p-3">
                  <View className="w-11 h-11 rounded-2xl bg-harvest/10 items-center justify-center mb-2.5 border border-harvest/15">
                    <Tag size={20} color="#F57F17" />
                  </View>
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    2. Wholesale Pricing
                  </Text>
                  <Text className="text-soil-muted text-xs text-center mt-1" style={{ fontFamily: 'Inter-Regular' }}>
                    Transparent district mandi price benchmarks with zero middleman deductions.
                  </Text>
                </View>

                <View className="flex-1 items-center text-center p-3">
                  <View className="w-11 h-11 rounded-2xl bg-blue-500/10 items-center justify-center mb-2.5 border border-blue-500/15">
                    <ShieldCheck size={20} color="#1565C0" />
                  </View>
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    3. Verified Quality
                  </Text>
                  <Text className="text-soil-muted text-xs text-center mt-1" style={{ fontFamily: 'Inter-Regular' }}>
                    Direct communication with grower, contract tracking, and safe fulfillment.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-4">
            {filtered.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                index={i}
                onPress={() => router.push(`/marketplace/${listing.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
