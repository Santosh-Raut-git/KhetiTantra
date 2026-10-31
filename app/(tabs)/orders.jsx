import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Package, Truck, Clock, CheckCircle2 } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';

export default function OrdersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, width: '100%' }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
      >
        <Animated.View
          entering={FadeInDown.duration(450)}
          className="flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-soil/5"
        >
          <View>
            <Text className="text-soil text-2xl lg:text-3xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
              Supply Chain Orders
            </Text>
            <Text className="text-soil-muted text-sm mt-1" style={{ fontFamily: 'Inter-Regular' }}>
              Track direct farm-to-store deliveries, supplier contracts, and payment releases
            </Text>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-leaf/10 items-center justify-center border border-leaf/15">
            <Package size={24} color="#2E7D32" strokeWidth={2} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(450)}>
          <EmptyState
            icon={<Package size={36} color="#2E7D32" strokeWidth={1.8} />}
            title="No orders placed yet"
            description="Browse active crop listings on the marketplace to connect directly with farmers and initiate wholesale supply contracts."
            actionLabel="Explore Marketplace"
            onAction={() => router.push('/(tabs)/marketplace')}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
