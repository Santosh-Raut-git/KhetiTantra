import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Sprout, ChevronRight } from 'lucide-react-native';
import { useCrops, useCropProfits, Crop } from '@/lib/api/crops';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-leaf';
    case 'harvested': return 'text-harvest-dark';
    case 'failed': return 'text-clay';
    default: return 'text-soil-muted';
  }
};

type CropCardProps = {
  crop: Crop;
  index: number;
  netProfit: number;
  onPress: () => void;
};

function CropCard({ crop, index, netProfit, onPress }: CropCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 80, 320)).duration(400)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        className="bg-surface rounded-2xl p-4 border border-soil/5 flex-row items-center"
        style={{ shadowColor: '#3E2723', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 1 } }}
      >
        <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-3">
          <Sprout size={22} color="#2E7D32" strokeWidth={2} />
        </View>

        <View className="flex-1">
          <Text className="text-soil text-base font-semibold" style={{ fontFamily: 'Inter-Bold' }}>
            {crop.crop_name}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
              {crop.season}
            </Text>
            <Text className="text-soil-muted text-xs">•</Text>
            <Text className={`text-xs capitalize font-medium ${getStatusColor(crop.status)}`} style={{ fontFamily: 'Inter-Medium' }}>
              {crop.status}
            </Text>
          </View>
        </View>

        <View className="items-end mr-2">
          <Text className="text-soil-muted text-xs mb-1" style={{ fontFamily: 'Inter-Regular' }}>Net Profit</Text>
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 14,
              color: netProfit >= 0 ? '#2E7D32' : '#D32F2F',
            }}
          >
            {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
          </Text>
        </View>

        <ChevronRight size={18} color="#BDB8B0" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

export default function CropsScreen() {
  const router = useRouter();
  const { data: crops, isLoading, error } = useCrops();
  const { data: cropProfits } = useCropProfits();

  const getProfit = (cropId: string) => {
    return cropProfits?.find(p => p.crop_id === cropId)?.net_profit || 0;
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
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <Text className="text-clay">Error loading crops.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2 md:max-w-3xl md:w-full md:self-center">
        <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
          My Crops
        </Text>
        <Pressable
          onPress={() => router.push('/crops/new')}
          className="w-11 h-11 rounded-full bg-leaf items-center justify-center"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          <Plus size={22} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-8 pt-4 md:max-w-3xl md:w-full md:self-center md:py-8">
        {crops?.length === 0 ? (
          <EmptyState
            icon={<Sprout size={36} color="#2E7D32" strokeWidth={1.8} />}
            title="No crops recorded yet"
            description="Start tracking your farm's performance by adding your first crop."
            actionLabel="Add Crop"
            onAction={() => router.push('/crops/new')}
          />
        ) : (
          <View className="gap-3">
            {crops?.map((crop, i) => (
              <CropCard
                key={crop.id}
                crop={crop}
                index={i}
                netProfit={getProfit(crop.id)}
                onPress={() => router.push(`/crops/${crop.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
