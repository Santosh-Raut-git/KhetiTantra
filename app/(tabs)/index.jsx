import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { supabasePublic } from '@/lib/supabase';
import { useCrops } from '@/lib/api/crops';
import { useTransactions } from '@/lib/api/transactions';
import { useListings, useMarketplaceStats } from '@/lib/api/listings';
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
  BarChart3,
  ShoppingCart,
  Clock,
  Bot,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

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

function MetricCard({ title, value, icon, iconBg, valueColor, subtitle }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(62,39,35,0.06)',
        shadowColor: '#3E2723',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: iconBg || '#E8F5E9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        {subtitle && (
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#9E9189' }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginBottom: 4 }}>
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter-Bold',
          fontSize: 22,
          color: valueColor || '#3E2723',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function QuickActionItem({ title, subtitle, icon, iconBg, onPress }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: 'rgba(62,39,35,0.06)',
          borderRadius: 16,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#3E2723',
          shadowOpacity: 0.03,
          shadowRadius: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
              {title}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 1 }} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        <ArrowRight size={17} color="#9E9189" />
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

function FeedListingCard({ listing, index, onPress, cardWidth }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const unitLabel = UNIT_LABELS[listing.unit] || listing.unit;
  const catColor = CAT_COLORS[listing.category] || CAT_COLORS.Other;

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 30, 240)).duration(300)}
      style={[{ width: cardWidth || '100%', padding: 8 }, animStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(62,39,35,0.06)',
          padding: 16,
          height: '100%',
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          shadowColor: '#3E2723',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#E8F5E9',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Sprout size={20} color="#2E7D32" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723' }} numberOfLines={1}>
                {listing.crop_type}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MapPin size={11} color="#9E9189" strokeWidth={2} />
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginLeft: 3 }} numberOfLines={1}>
                  {listing.profiles?.village
                    ? `${listing.profiles.village}, ${listing.profiles.district}`
                    : listing.profiles?.district || 'Location not set'}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ backgroundColor: catColor.bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: catColor.text }}>
              {listing.category}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(62,39,35,0.05)' }}>
          <View>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
              Price
            </Text>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#2E7D32', marginTop: 1 }}>
              ₹{Number(listing.price_per_unit).toLocaleString('en-IN')}
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                {' '}/ {unitLabel}
              </Text>
            </Text>
          </View>

          <View>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189', textAlign: 'right' }}>
              Quantity
            </Text>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: '#3E2723', marginTop: 1, textAlign: 'right' }}>
              {Number(listing.quantity_available).toLocaleString('en-IN')} {unitLabel}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 8 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
              Details
            </Text>
            <ChevronRight size={14} color="#2E7D32" strokeWidth={2.2} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { profile, setProfile, session } = useStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { data: crops, isLoading: cropsLoading, refetch: refetchCrops } = useCrops();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useTransactions();
  const { data: listings, isLoading: listingsLoading, refetch: refetchListings } = useListings();
  const { data: mktStats, refetch: refetchStats } = useMarketplaceStats();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

    // Keep profile synchronized directly from database
  useEffect(() => {
    async function loadFreshProfile() {
      if (session?.user?.id) {
        try {
          const { data } = await supabasePublic
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data) setProfile(data);
        } catch (e) {
          console.warn('Dashboard profile fetch error:', e);
        }
      }
    }
    loadFreshProfile();
  }, [session?.user?.id]);

  const onRefresh = async () => {
    if (session?.user?.id) {
      try {
        const { data } = await supabasePublic
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) setProfile(data);
      } catch (e) {
        console.warn('Dashboard profile refresh error:', e);
      }
    }
    refetchCrops();
    refetchTx();
    refetchListings();
    refetchStats();
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

  const role = profile?.role || session?.user?.user_metadata?.role || 'farmer';
  const isRetailer = role === 'retailer';
  const defaultTitle = isRetailer ? 'Retailer' : 'Farmer';

  const rawName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0];
  const displayName = rawName || defaultTitle;

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, width: '100%' }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        {/* Header Greeting Banner */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: '#9E9189' }}>
                Welcome back,
              </Text>
              <View style={{ backgroundColor: 'rgba(46,125,50,0.1)', paddingHorizontal: 10, paddingVertical: 2.5, borderRadius: 999 }}>
                <Text
                  style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32', textTransform: 'capitalize' }}
                >
                  {role} Account
                </Text>
              </View>
            </View>
            <Text
              style={{ fontFamily: 'Inter-Bold', fontSize: 32, color: '#3E2723' }}
            >
              {displayName}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.push(isRetailer ? '/(tabs)/marketplace' : '/crops/new')}
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
              }}
            >
              {isRetailer ? (
                <>
                  <Store size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={{ fontFamily: 'Inter-Bold', color: '#FFFFFF', marginLeft: 8, fontSize: 14 }}>
                    Browse Market
                  </Text>
                </>
              ) : (
                <>
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={{ fontFamily: 'Inter-Bold', color: '#FFFFFF', marginLeft: 8, fontSize: 14 }}>
                    Add New Crop
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* 4 Metric Cards Strip across the screen with explicit gap */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {!isRetailer ? (
            <>
              <MetricCard
                title="Net Balance"
                value={`₹${netProfit.toLocaleString('en-IN')}`}
                valueColor={netProfit >= 0 ? '#2E7D32' : '#D32F2F'}
                icon={<Wallet size={20} color="#2E7D32" />}
                iconBg="#E8F5E9"
                subtitle={netProfit >= 0 ? 'Profitable' : 'Loss'}
              />
              <MetricCard
                title="Active Crops"
                value={activeCropsCount.toString()}
                valueColor="#3E2723"
                icon={<Sprout size={20} color="#2E7D32" />}
                iconBg="#E8F5E9"
                subtitle={`${crops?.length || 0} total`}
              />
              <MetricCard
                title="Total Income"
                value={`₹${totalIncome.toLocaleString('en-IN')}`}
                valueColor="#2E7D32"
                icon={<TrendingUp size={20} color="#2E7D32" />}
                iconBg="#E8F5E9"
              />
              <MetricCard
                title="Total Expense"
                value={`₹${totalExpense.toLocaleString('en-IN')}`}
                valueColor="#D32F2F"
                icon={<TrendingDown size={20} color="#D32F2F" />}
                iconBg="#FCE4EC"
              />
            </>
          ) : (
            <>
              <MetricCard
                title="Available Produce"
                value={(mktStats?.totalActive || listings?.length || 0).toString()}
                valueColor="#2E7D32"
                icon={<Store size={20} color="#2E7D32" />}
                iconBg="#E8F5E9"
                subtitle="Live wholesale"
              />
              <MetricCard
                title="Crop Categories"
                value={(mktStats?.priceTrends?.length || 6).toString()}
                valueColor="#3E2723"
                icon={<Tag size={20} color="#F57F17" />}
                iconBg="#FFF8E1"
                subtitle="Active commodities"
              />
              <MetricCard
                title="New Listings (7d)"
                value={(mktStats?.recentCount || 0).toString()}
                valueColor="#1565C0"
                icon={<Clock size={20} color="#1565C0" />}
                iconBg="#E3F2FD"
                subtitle="Fresh arrivals"
              />
              <MetricCard
                title="AI Assistant"
                value="Active"
                valueColor="#2E7D32"
                icon={<Bot size={20} color="#2E7D32" />}
                iconBg="#E8F5E9"
                subtitle="Analyst ready"
              />
            </>
          )}
        </View>

        {/* 2-Column Desktop SaaS Layout with explicit gap */}
        <View
          style={{
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 32,
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Produce Listings Feed */}
          <View style={{ flex: 1, width: isDesktop ? undefined : '100%' }}>
            {/* Feed Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: '#3E2723' }}>
                  Live Produce Feed
                </Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 2 }}>
                  {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} available in your region
                </Text>
              </View>

              <Pressable
                onPress={() => router.push('/(tabs)/marketplace')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#2E7D32' }}>
                  View All Marketplace
                </Text>
                <ChevronRight size={15} color="#2E7D32" strokeWidth={2.2} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.08)',
                  paddingHorizontal: 14,
                  height: 46,
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                }}
              >
                <Search size={16} color="#9E9189" strokeWidth={2} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search crops, varieties, or locations..."
                  placeholderTextColor="#9E9189"
                  style={{ flex: 1, marginLeft: 8, fontFamily: 'Inter-Regular', fontSize: 14, color: '#3E2723' }}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <X size={15} color="#9E9189" strokeWidth={2} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
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

            {/* 2-Column Listing Cards Feed */}
            {listingsLoading ? (
              <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#2E7D32" />
              </View>
            ) : filteredListings.length === 0 ? (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 36,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  marginTop: 8,
                }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Store size={26} color="#2E7D32" strokeWidth={1.8} />
                </View>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}>
                  No produce matching filters
                </Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', textAlign: 'center', marginTop: 4, marginBottom: 16, maxWidth: 360, lineHeight: 18 }}>
                  Try adjusting your search keywords or clear the category filter to view all available wholesale crops.
                </Text>
                <Pressable
                  onPress={() => { setSearch(''); setActiveCategory(''); }}
                  style={{ backgroundColor: 'rgba(46,125,50,0.08)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
                >
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#2E7D32' }}>
                    Reset Filters
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -8 }}>
                {filteredListings.map((listing, i) => (
                  <FeedListingCard
                    key={listing.id}
                    listing={listing}
                    index={i}
                    cardWidth={isDesktop ? '50%' : '100%'}
                    onPress={() => router.push(`/marketplace/${listing.id}`)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Right Column: Quick Actions + Market Insights + AI Callout with gap: 20 */}
          <View
            style={{
              width: isDesktop ? 360 : '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Quick Actions Card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(62,39,35,0.06)',
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723', marginBottom: 14 }}>
                Quick Actions
              </Text>
              <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!isRetailer ? (
                  <>
                    <QuickActionItem
                      title="Add Crop"
                      subtitle="Start a new crop cycle"
                      icon={<Plus size={20} color="#2E7D32" strokeWidth={2.4} />}
                      iconBg="#E8F5E9"
                      onPress={() => router.push('/crops/new')}
                    />
                    <QuickActionItem
                      title="Add Transaction"
                      subtitle="Record income or expense"
                      icon={<FileText size={20} color="#D32F2F" strokeWidth={2} />}
                      iconBg="#FCE4EC"
                      onPress={() => router.push('/ledger/new')}
                    />
                    <QuickActionItem
                      title="List Produce"
                      subtitle="Sell your harvest directly"
                      icon={<Store size={20} color="#F57F17" strokeWidth={2} />}
                      iconBg="#FFF8E1"
                      onPress={() => router.push('/marketplace/new')}
                    />
                  </>
                ) : (
                  <>
                    <QuickActionItem
                      title="Browse Marketplace"
                      subtitle="Discover direct-from-grower lots"
                      icon={<Store size={20} color="#2E7D32" strokeWidth={2} />}
                      iconBg="#E8F5E9"
                      onPress={() => router.push('/(tabs)/marketplace')}
                    />
                    <QuickActionItem
                      title="Supply Orders"
                      subtitle="Track crop delivery contracts"
                      icon={<Package size={20} color="#F57F17" strokeWidth={2} />}
                      iconBg="#FFF8E1"
                      onPress={() => router.push('/(tabs)/orders')}
                    />
                    <QuickActionItem
                      title="Kheti AI Analyst"
                      subtitle="Price trends and procurement forecasts"
                      icon={<Bot size={20} color="#1565C0" strokeWidth={2} />}
                      iconBg="#E3F2FD"
                      onPress={() => router.push('/(tabs)/assistant')}
                    />
                  </>
                )}
              </View>
            </View>

            {/* Benchmark Price Trends */}
            {mktStats?.priceTrends && mktStats.priceTrends.length > 0 && (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(62,39,35,0.06)',
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <BarChart3 size={17} color="#2E7D32" strokeWidth={2} />
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
                      Market Benchmarks
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                    Avg. Rate
                  </Text>
                </View>

                <View>
                  {mktStats.priceTrends.slice(0, 5).map((trend, idx) => {
                    const catColor = CAT_COLORS[trend.category] || CAT_COLORS.Other;
                    return (
                      <View
                        key={trend.category}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 10,
                          borderTopWidth: idx === 0 ? 0 : 1,
                          borderTopColor: 'rgba(62,39,35,0.05)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={{
                              backgroundColor: catColor.bg,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 999,
                            }}
                          >
                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: catColor.text }}>
                              {trend.category}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                            {trend.listingCount} lot{trend.listingCount !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#2E7D32' }}>
                          ₹{trend.avgPrice.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* AI Callout Banner */}
            <View
              style={{
                backgroundColor: 'rgba(46,125,50,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(46,125,50,0.18)',
                borderRadius: 20,
                padding: 20,
                shadowColor: '#2E7D32',
                shadowOpacity: 0.04,
                shadowRadius: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#FFFFFF" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#3E2723' }}>
                    Kheti AI Assistant
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#6D4C41' }}>
                    {isRetailer ? 'Business & Procurement AI' : 'Agronomist & Market AI'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#5D4037', marginBottom: 14, lineHeight: 18 }}>
                {isRetailer
                  ? 'Ask about mandi wholesale price changes, supply availability, and demand projections.'
                  : 'Ask about soil health, pest control, weather advisories, or fertilizer schedules.'}
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/assistant')}
                style={{
                  backgroundColor: '#2E7D32',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#2E7D32',
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}
              >
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#FFFFFF' }}>
                  Chat with Kheti AI
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
