import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { useCrops } from '@/lib/api/crops';
import { useTransactions } from '@/lib/api/transactions';
import { Card } from '@/components/ui/Card';
import {
  Sprout,
  TrendingUp,
  TrendingDown,
  Plus,
  Wallet,
  FileText,
  ArrowRight,
} from 'lucide-react-native';
import { useMemo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
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

export default function DashboardScreen() {
  const { profile, session } = useStore();
  const router = useRouter();
  const {
    data: crops,
    isLoading: cropsLoading,
    refetch: refetchCrops,
  } = useCrops();
  const {
    data: transactions,
    isLoading: txLoading,
    refetch: refetchTx,
  } = useTransactions();
  const isRefreshing = cropsLoading || txLoading;
  const onRefresh = () => {
    refetchCrops();
    refetchTx();
  };
  const activeCropsCount = useMemo(() => {
    return crops?.filter((c) => c.status === 'active').length || 0;
  }, [crops]);
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
  // Prefer the saved profile name; fall back to auth metadata, then email prefix, then 'Farmer'
  const rawName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0];
  const firstName = rawName?.split(' ')[0] || 'Farmer';
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-8 md:max-w-3xl md:w-full md:self-center md:py-10"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Greeting header */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="flex-row items-center justify-between mb-6"
        >
          <View>
            <Text
              className="text-soil-muted text-base"
              style={{ fontFamily: 'Inter-Medium' }}
            >
              Welcome back,
            </Text>
            <Text
              className="text-soil text-3xl font-bold mt-1"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              {firstName}
            </Text>
          </View>
        </Animated.View>

        {/* Overview heading + stats row 1 */}
        <Animated.View entering={FadeInUp.delay(120).duration(450)}>
          <Text
            className="text-soil text-lg font-bold mb-3"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            Overview
          </Text>

          <View className="flex-row gap-4 mb-4">
            <Card className="flex-1">
              <View className="w-10 h-10 rounded-full bg-leaf/10 items-center justify-center mb-3">
                <Wallet size={20} color="#2E7D32" />
              </View>
              <Text
                className="text-soil-muted text-sm mb-1"
                style={{ fontFamily: 'Inter-Medium' }}
              >
                Net Balance
              </Text>
              <Text
                className="text-xl font-bold"
                style={{
                  fontFamily: 'Inter-Bold',
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
              <Text
                className="text-soil-muted text-sm mb-1"
                style={{ fontFamily: 'Inter-Medium' }}
              >
                Active Crops
              </Text>
              <Text
                className="text-soil text-xl font-bold"
                style={{ fontFamily: 'Inter-Bold' }}
              >
                {activeCropsCount}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Stats row 2 — Income / Expense */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(450)}
          className="flex-row gap-4 mb-8"
        >
          <Card className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="w-6 h-6 rounded-full bg-leaf/10 items-center justify-center mr-2">
                <TrendingUp size={14} color="#2E7D32" />
              </View>
              <Text
                className="text-soil-muted text-sm"
                style={{ fontFamily: 'Inter-Medium' }}
              >
                Income
              </Text>
            </View>
            <Text
              className="text-leaf text-lg font-bold"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              ₹{totalIncome.toLocaleString('en-IN')}
            </Text>
          </Card>

          <Card className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="w-6 h-6 rounded-full bg-clay/10 items-center justify-center mr-2">
                <TrendingDown size={14} color="#D32F2F" />
              </View>
              <Text
                className="text-soil-muted text-sm"
                style={{ fontFamily: 'Inter-Medium' }}
              >
                Expense
              </Text>
            </View>
            <Text
              className="text-clay text-lg font-bold"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              ₹{totalExpense.toLocaleString('en-IN')}
            </Text>
          </Card>
        </Animated.View>

        {/* Quick Actions heading */}
        <Animated.View entering={FadeInUp.delay(280).duration(450)}>
          <Text
            className="text-soil text-lg font-bold mb-3"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            Quick Actions
          </Text>
        </Animated.View>

        <View className="gap-3">
          {/* Add Crop */}
          <Animated.View entering={FadeInUp.delay(340).duration(450)}>
            <QuickActionCard onPress={() => router.push('/crops/new')}>
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-4">
                  <Plus size={24} color="#2E7D32" strokeWidth={2} />
                </View>
                <View>
                  <Text
                    className="text-soil text-base font-bold"
                    style={{ fontFamily: 'Inter-Bold' }}
                  >
                    Add Crop
                  </Text>
                  <Text
                    className="text-soil-muted text-sm"
                    style={{ fontFamily: 'Inter-Regular' }}
                  >
                    Start a new crop cycle
                  </Text>
                </View>
              </View>
              <ArrowRight size={20} color="#BDB8B0" />
            </QuickActionCard>
          </Animated.View>

          {/* Add Transaction */}
          <Animated.View entering={FadeInUp.delay(400).duration(450)}>
            <QuickActionCard onPress={() => router.push('/ledger/new')}>
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-clay/10 items-center justify-center mr-4">
                  <FileText size={24} color="#D32F2F" strokeWidth={2} />
                </View>
                <View>
                  <Text
                    className="text-soil text-base font-bold"
                    style={{ fontFamily: 'Inter-Bold' }}
                  >
                    Add Transaction
                  </Text>
                  <Text
                    className="text-soil-muted text-sm"
                    style={{ fontFamily: 'Inter-Regular' }}
                  >
                    Record income or expense
                  </Text>
                </View>
              </View>
              <ArrowRight size={20} color="#BDB8B0" />
            </QuickActionCard>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
