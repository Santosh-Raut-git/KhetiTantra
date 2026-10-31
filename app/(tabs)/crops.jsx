import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Sprout, ChevronRight, CheckCircle2, Calendar, MapPin } from 'lucide-react-native';
import { useCrops, useCropProfits } from '@/lib/api/crops';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';
import { getStatusColor, getStatusBg } from '@/lib/utils';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function CropCard({ crop, index, netProfit, onPress, cardWidth }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 30, 240)).duration(300)}
      style={[{ width: cardWidth, padding: 8 }, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        className="bg-surface rounded-2xl p-5 border border-soil/5 shadow-sm hover:border-soil/20 transition-all flex-col justify-between"
        style={{
          shadowColor: '#3E2723',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          height: '100%',
          minHeight: 190,
        }}
      >
        <View>
          {/* Top row: Icon, Name, Status */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View className="w-12 h-12 rounded-2xl bg-leaf/10 items-center justify-center border border-leaf/15">
                <Sprout size={24} color="#2E7D32" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-soil text-lg font-bold"
                  style={{ fontFamily: 'Inter-Bold' }}
                  numberOfLines={1}
                >
                  {crop.crop_name}
                </Text>
                <Text
                  className="text-soil-muted text-xs mt-0.5"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  {crop.season} Season {crop.variety ? `• ${crop.variety}` : ''}
                </Text>
              </View>
            </View>

            <View className={`px-2.5 py-1 rounded-full ${getStatusBg(crop.status)}`}>
              <Text
                className={`text-xs capitalize font-semibold ${getStatusColor(crop.status)}`}
                style={{ fontFamily: 'Inter-Medium' }}
              >
                {crop.status}
              </Text>
            </View>
          </View>

          {/* Details strip */}
          <View className="flex-row items-center gap-4 py-3 border-t border-soil/5 mb-2">
            <View className="flex-1">
              <Text className="text-soil-muted text-[11px]" style={{ fontFamily: 'Inter-Regular' }}>
                Area Cultivated
              </Text>
              <Text className="text-soil text-sm font-semibold mt-0.5" style={{ fontFamily: 'Inter-Medium' }}>
                {crop.area_acres ? `${crop.area_acres} Acres` : 'Not specified'}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-soil-muted text-[11px]" style={{ fontFamily: 'Inter-Regular' }}>
                Sowing Date
              </Text>
              <Text className="text-soil text-sm font-semibold mt-0.5" style={{ fontFamily: 'Inter-Medium' }}>
                {crop.sowing_date || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom row: Net Profit & CTA */}
        <View className="pt-3 border-t border-soil/5 flex-row items-center justify-between">
          <View>
            <Text
              className="text-soil-muted text-[11px]"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Net Profit
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 16,
                color: netProfit >= 0 ? '#2E7D32' : '#D32F2F',
              }}
            >
              {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
            </Text>
          </View>

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

export default function CropsScreen() {
  const router = useRouter();
  const { data: crops, isLoading, error } = useCrops();
  const { data: cropProfits } = useCropProfits();
  const { width } = useWindowDimensions();

  const numColumns = width >= 1440 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const cardWidth = `${100 / numColumns}%`;

  const getProfit = (cropId) => {
    return cropProfits?.find((p) => p.crop_id === cropId)?.net_profit || 0;
  };

  const activeCropsCount = crops?.filter((c) => c.status === 'active').length || 0;
  const harvestedCount = crops?.filter((c) => c.status === 'harvested').length || 0;
  const totalLandAcres = useMemo(() => {
    return crops?.reduce((sum, c) => sum + (Number(c.area_acres) || 0), 0) || 0;
  }, [crops]);

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
        <Text className="text-clay">Error loading crops.</Text>
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
        <View className="flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-soil/5">
          <View>
            <Text
              className="text-soil text-2xl lg:text-3xl font-bold"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              My Crops
            </Text>
            <Text
              className="text-soil-muted text-sm mt-1"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Monitor active crop cycles, sown acreage, variety performance, and financial returns
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/crops/new')}
            className="flex-row items-center justify-center bg-leaf px-5 py-3 rounded-xl shadow-sm hover:bg-leaf-dark self-start sm:self-auto"
            style={{ minHeight: 44 }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text
              className="text-white text-sm ml-2"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Add New Crop
            </Text>
          </Pressable>
        </View>

        {/* 3 Overview Metric Cards */}
        <View className="flex-row flex-wrap gap-4 mb-8">
          <View className="bg-surface rounded-2xl p-5 border border-soil/5 shadow-sm flex-1 min-w-[160px]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                Active Cycles
              </Text>
              <View className="w-8 h-8 rounded-lg bg-leaf/10 items-center justify-center">
                <Sprout size={16} color="#2E7D32" strokeWidth={2} />
              </View>
            </View>
            <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              {activeCropsCount}
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-5 border border-soil/5 shadow-sm flex-1 min-w-[160px]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                Cultivated Land
              </Text>
              <View className="w-8 h-8 rounded-lg bg-harvest/10 items-center justify-center">
                <MapPin size={16} color="#F57F17" strokeWidth={2} />
              </View>
            </View>
            <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              {totalLandAcres.toFixed(1)} <Text className="text-sm font-normal text-soil-muted">Acres</Text>
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-5 border border-soil/5 shadow-sm flex-1 min-w-[160px]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                Completed Harvests
              </Text>
              <View className="w-8 h-8 rounded-lg bg-leaf/10 items-center justify-center">
                <CheckCircle2 size={16} color="#2E7D32" strokeWidth={2} />
              </View>
            </View>
            <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              {harvestedCount}
            </Text>
          </View>
        </View>

        {crops?.length === 0 ? (
          <EmptyState
            icon={<Sprout size={36} color="#2E7D32" strokeWidth={1.8} />}
            title="No crops recorded yet"
            description="Start tracking your farm's performance by adding your first crop."
            actionLabel="Add Crop"
            onAction={() => router.push('/crops/new')}
          />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -8 }}>
            {crops?.map((crop, i) => (
              <CropCard
                key={crop.id}
                crop={crop}
                index={i}
                cardWidth={cardWidth}
                netProfit={getProfit(crop.id)}
                onPress={() => router.push(`/crops/${crop.id}`)}
              />
            ))}

            {/* If fewer than 3 crops, show a dashed Add Crop card so space is balanced */}
            {crops && crops.length < 3 && (
              <View style={{ width: cardWidth, padding: 8 }}>
                <Pressable
                  onPress={() => router.push('/crops/new')}
                  className="w-full border-2 border-dashed border-soil/15 rounded-2xl p-6 items-center justify-center bg-surface/50 hover:bg-surface hover:border-leaf/50 transition-all"
                  style={{ height: '100%', minHeight: 190 }}
                >
                  <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mb-3">
                    <Plus size={22} color="#2E7D32" strokeWidth={2.2} />
                  </View>
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    Add Another Crop
                  </Text>
                  <Text className="text-soil-muted text-xs mt-1 text-center" style={{ fontFamily: 'Inter-Regular' }}>
                    Track upcoming Kharif, Rabi, or Zaid cycles
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
