import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Users } from 'lucide-react-native';

export default function NetworkScreen() {
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-8 md:max-w-3xl md:w-full md:self-center md:py-10"
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="flex-row items-center justify-between mb-6"
        >
          <View>
            <Text className="text-soil-muted text-base" style={{ fontFamily: 'Inter-Medium' }}>
              Directory
            </Text>
            <Text className="text-soil text-3xl font-bold mt-1" style={{ fontFamily: 'Inter-Bold' }}>
              Network
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center">
            <Users size={24} color="#2E7D32" strokeWidth={2} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(450)}>
          <View className="bg-surface border border-soil/5 rounded-2xl p-8 items-center justify-center shadow-sm mt-8">
            <Text className="text-soil text-lg mb-2 text-center" style={{ fontFamily: 'Inter-Bold' }}>
              Farmer Directory coming soon
            </Text>
            <Text className="text-soil-muted text-center" style={{ fontFamily: 'Inter-Regular' }}>
              Discover local farmers, view their profiles, and build your supply network.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
