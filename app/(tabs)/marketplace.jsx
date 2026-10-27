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
      entering={FadeInUp.delay(Math.min(index * 70, 350)).duration(400)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        className="bg-surface rounded-2xl border border-soil/5"
        style={{
          shadowColor: '#3E2723',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        {/* Card header row */}
        <View className="flex-row items-center p-4 pb-3">
          <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-3">
            <Sprout size={22} color="#2E7D32" strokeWidth={2} />
          </View>

          <View className="flex-1">
            <Text
              className="text-soil text-base"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              {listing.crop_type}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <MapPin size={11} color="#9E9189" strokeWidth={2} />
              <Text
                className="text-soil-muted text-xs"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                {listing.profiles?.village
                  ? `${listing.profiles.village}, ${listing.profiles.district}`
                  : listing.profiles?.district || 'Location not set'}
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color="#BDB8B0" strokeWidth={2} />
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

          <View
            className={`px-2.5 py-1 rounded-full ${catColors.bg}`}
          >
            <Text
              className={`text-xs ${catColors.text}`}
              style={{ fontFamily: 'Inter-Medium' }}
            >
              {listing.category}
            </Text>
          </View>
        </View>

        {/* Seller name */}
        {listing.profiles?.full_name && (
          <View className="px-4 pb-3">
            <Text
              className="text-soil-muted text-xs"
              style={{ fontFamily: 'Inter-Regular' }}
            >
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
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="flex-row items-center justify-between px-5 pt-4 pb-3 md:max-w-3xl md:w-full md:self-center"
      >
        <View>
          <Text
            className="text-soil-muted text-sm"
            style={{ fontFamily: 'Inter-Medium' }}
          >
            Retailer Portal
          </Text>
          <Text
            className="text-soil text-2xl"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            Marketplace
          </Text>
        </View>
        {isFarmer && (
          <Pressable
            onPress={() => router.push('/marketplace/new')}
            className="w-11 h-11 rounded-full bg-leaf items-center justify-center"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
        )}
      </Animated.View>

      {/* Search bar */}
      <Animated.View
        entering={FadeInDown.delay(80).duration(450)}
        className="px-5 pb-3 md:max-w-3xl md:w-full md:self-center"
      >
        <View
          className="flex-row items-center bg-surface border border-soil/10 rounded-xl px-3 min-h-[44px]"
          style={{
            shadowColor: '#3E2723',
            shadowOpacity: 0.03,
            shadowRadius: 4,
          }}
        >
          <Search size={18} color="#9E9189" strokeWidth={2} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search crop or location…"
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
      </Animated.View>

      {/* Category chips */}
      <Animated.View entering={FadeInDown.delay(140).duration(450)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 pb-3 gap-2 md:max-w-3xl md:self-center"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Pressable
                key={cat || 'all'}
                onPress={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full border ${
                  isActive
                    ? 'bg-leaf border-leaf'
                    : 'bg-surface border-soil/10'
                }`}
              >
                <Text
                  style={{
                    fontFamily: isActive ? 'Inter-Bold' : 'Inter-Medium',
                    fontSize: 13,
                    color: isActive ? '#FFFFFF' : '#6D4C41',
                  }}
                >
                  {cat || 'All'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Listings */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10 gap-3 md:max-w-3xl md:w-full md:self-center md:py-4"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Stats strip */}
        {listings && listings.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            className="flex-row gap-3 mb-1"
          >
            <View className="flex-1 bg-surface border border-soil/5 rounded-xl p-3 flex-row items-center gap-2">
              <Package size={16} color="#2E7D32" strokeWidth={2} />
              <Text
                className="text-soil-muted text-xs"
                style={{ fontFamily: 'Inter-Medium' }}
              >
                <Text
                  className="text-soil"
                  style={{ fontFamily: 'Inter-Bold', fontSize: 15 }}
                >
                  {listings.length}
                </Text>
                {'  '}active listings
              </Text>
            </View>
            <View className="flex-1 bg-surface border border-soil/5 rounded-xl p-3 flex-row items-center gap-2">
              <Tag size={16} color="#F9A825" strokeWidth={2} />
              <Text
                className="text-soil-muted text-xs"
                style={{ fontFamily: 'Inter-Medium' }}
              >
                <Text
                  className="text-soil"
                  style={{ fontFamily: 'Inter-Bold', fontSize: 15 }}
                >
                  {filtered.length}
                </Text>
                {'  '}showing
              </Text>
            </View>
          </Animated.View>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Store size={36} color="#2E7D32" strokeWidth={1.8} />}
            title={
              search || activeCategory
                ? 'No listings match your search'
                : 'No listings yet'
            }
            description={
              isFarmer
                ? 'Be the first to list your crop harvest for sale.'
                : 'Farmers have not listed any crops yet. Check back soon.'
            }
            actionLabel={isFarmer ? 'List a Crop' : undefined}
            onAction={isFarmer ? () => router.push('/marketplace/new') : undefined}
          />
        ) : (
          filtered.map((listing, i) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={i}
              onPress={() => router.push(`/marketplace/${listing.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
