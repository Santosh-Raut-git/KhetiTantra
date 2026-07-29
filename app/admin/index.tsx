import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { useAdminStats } from '@/lib/api/admin';
import { Shield, Users, Sprout, Wallet, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { data: stats, isLoading, refetch } = useAdminStats();

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-soil/5 md:max-w-3xl md:w-full md:self-center">
        <Button 
          variant="secondary" 
          label="" 
          icon={<ArrowLeft size={24} color="#3E2723" />} 
          onPress={() => router.replace('/(tabs)')}
          className="mr-3 w-12 h-12 p-0"
        />
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-leaf/10 items-center justify-center mr-3">
            <Shield size={22} color="#2E7D32" strokeWidth={2} />
          </View>
          <View>
            <Text className="text-soil text-xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              Super Admin
            </Text>
            <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
              KhetiTantra Control Panel
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-8 md:max-w-3xl md:w-full md:self-center md:py-10"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} colors={['#2E7D32']} />
        }
      >
        <Text className="text-soil text-lg font-bold mb-3" style={{ fontFamily: 'Inter-Bold' }}>
          Platform Overview
        </Text>

        <View className="flex-row gap-4 mb-4">
          <Card className="flex-1">
            <View className="w-10 h-10 rounded-full bg-leaf/10 items-center justify-center mb-3">
              <Users size={20} color="#2E7D32" />
            </View>
            <Text className="text-soil-muted text-sm mb-1" style={{ fontFamily: 'Inter-Medium' }}>Total Users</Text>
            <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              {stats?.totalUsers || 0}
            </Text>
          </Card>

          <Card className="flex-1">
            <View className="w-10 h-10 rounded-full bg-leaf/10 items-center justify-center mb-3">
              <Sprout size={20} color="#2E7D32" />
            </View>
            <Text className="text-soil-muted text-sm mb-1" style={{ fontFamily: 'Inter-Medium' }}>Total Crops</Text>
            <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              {stats?.totalCrops || 0}
            </Text>
          </Card>
        </View>

        <View className="flex-row gap-4 mb-4">
          <Card className="flex-1">
            <View className="w-10 h-10 rounded-full bg-harvest/10 items-center justify-center mb-3">
              <Sprout size={20} color="#F57F17" />
            </View>
            <Text className="text-soil-muted text-sm mb-1" style={{ fontFamily: 'Inter-Medium' }}>Active Crops</Text>
            <Text className="text-harvest-dark text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              {stats?.activeCrops || 0}
            </Text>
          </Card>

          <Card className="flex-1">
            <View className="w-10 h-10 rounded-full bg-soil/5 items-center justify-center mb-3">
              <Wallet size={20} color="#6D4C41" />
            </View>
            <Text className="text-soil-muted text-sm mb-1" style={{ fontFamily: 'Inter-Medium' }}>Transactions</Text>
            <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              {stats?.totalTransactions || 0}
            </Text>
          </Card>
        </View>

        <Text className="text-soil text-lg font-bold mb-3 mt-4" style={{ fontFamily: 'Inter-Bold' }}>
          Financial Summary (All Users)
        </Text>

        <Card className="mb-4 bg-leaf/5 border-leaf/20">
          <View className="flex-row justify-between py-3 border-b border-leaf/10">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-leaf/10 items-center justify-center mr-3">
                <TrendingUp size={16} color="#2E7D32" />
              </View>
              <Text className="text-soil text-base" style={{ fontFamily: 'Inter-Medium' }}>Total Income</Text>
            </View>
            <Text className="text-leaf text-base font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              ₹{(stats?.totalIncome || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-leaf/10">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-clay/10 items-center justify-center mr-3">
                <TrendingDown size={16} color="#D32F2F" />
              </View>
              <Text className="text-soil text-base" style={{ fontFamily: 'Inter-Medium' }}>Total Expenses</Text>
            </View>
            <Text className="text-clay text-base font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              ₹{(stats?.totalExpense || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View className="flex-row justify-between py-4">
            <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>Net Profit</Text>
            <Text 
              className="text-lg"
              style={{ 
                fontFamily: 'Inter-Bold', 
                color: (stats?.netProfit || 0) >= 0 ? '#2E7D32' : '#D32F2F' 
              }}
            >
              {(stats?.netProfit || 0) >= 0 ? '+' : ''}₹{(stats?.netProfit || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}