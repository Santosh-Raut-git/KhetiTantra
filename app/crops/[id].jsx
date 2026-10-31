import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCrop, useDeleteCrop, useCropProfits } from '@/lib/api/crops';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Sprout,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { getStatusColor, getStatusBg } from '@/lib/utils';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function CropDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: crop, isLoading } = useCrop(id);
  const deleteCrop = useDeleteCrop();
  const { data: cropProfits } = useCropProfits();

  const profitData = cropProfits?.find((p) => p.crop_id === id);
  const netProfit = profitData?.net_profit || 0;

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${crop?.crop_name}"?\n\nLinked transactions will be preserved in your ledger but unlinked from this crop.`,
      );
      if (confirmed) {
        deleteCrop.mutate(id, {
          onSuccess: () => router.back(),
          onError: (err) => alert('Error: ' + err.message),
        });
      }
    } else {
      Alert.alert(
        'Delete Crop',
        'Are you sure you want to delete this crop? Linked transactions will be preserved but unlinked.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteCrop.mutate(id, {
                onSuccess: () => router.back(),
                onError: (err) => Alert.alert('Error', err.message),
              });
            },
          },
        ],
      );
    }
  };

  if (isLoading || !crop) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
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
        {/* Top Header Banner */}
        <View className="flex-row items-center justify-between mb-8 pb-5 border-b border-soil/5">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-xl bg-surface items-center justify-center border border-soil/10 hover:bg-surface/80"
              hitSlop={8}
            >
              <ArrowLeft size={18} color="#3E2723" strokeWidth={2.2} />
            </Pressable>
            <View>
              <View className="flex-row items-center gap-3">
                <Text
                  className="text-soil text-2xl lg:text-3xl font-bold"
                  style={{ fontFamily: 'Inter-Bold' }}
                >
                  {crop.crop_name}
                </Text>
                <View className={`px-2.5 py-0.5 rounded-full ${getStatusBg(crop.status)}`}>
                  <Text className={`text-xs capitalize ${getStatusColor(crop.status)} font-bold`} style={{ fontFamily: 'Inter-Bold' }}>
                    {crop.status}
                  </Text>
                </View>
              </View>
              <Text
                className="text-soil-muted text-xs lg:text-sm mt-0.5"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                {crop.season} Season {crop.variety ? `• Variety: ${crop.variety}` : ''}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.push(`/crops/${id}/edit`)}
              className="flex-row items-center bg-leaf/10 border border-leaf/20 px-4 py-2.5 rounded-xl hover:bg-leaf/20"
              style={{ minHeight: 40 }}
            >
              <Edit2 size={16} color="#2E7D32" strokeWidth={2} />
              <Text className="text-leaf font-bold ml-2 text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                Edit Crop
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              className="flex-row items-center bg-clay/10 border border-clay/20 px-4 py-2.5 rounded-xl hover:bg-clay/20"
              style={{ minHeight: 40 }}
            >
              <Trash2 size={16} color="#D32F2F" strokeWidth={2} />
              <Text className="text-clay font-bold ml-2 text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                Delete
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 2-Column Responsive SaaS Body */}
        <View className="flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Hero Badge Card (~340px) */}
          <View className="w-full lg:w-88 shrink-0 flex-col gap-6">
            <Animated.View entering={FadeInUp.duration(400)}>
              <View
                className="bg-surface rounded-2xl p-6 border border-soil/5 shadow-sm items-center text-center"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="w-24 h-24 rounded-full bg-leaf/10 items-center justify-center mb-4 border-2 border-leaf/20">
                  <Sprout size={44} color="#2E7D32" strokeWidth={1.8} />
                </View>

                <Text className="text-soil text-2xl font-bold mb-1" style={{ fontFamily: 'Inter-Bold' }}>
                  {crop.crop_name}
                </Text>

                <Text className="text-soil-muted text-sm mb-4" style={{ fontFamily: 'Inter-Regular' }}>
                  {crop.variety ? `${crop.variety} • ` : ''}{crop.season} Cycle
                </Text>

                <View className="w-full pt-4 border-t border-soil/5 flex-col gap-3">
                  <View className="flex-row items-center justify-between text-xs py-1">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Status
                    </Text>
                    <Text className={`text-xs capitalize font-bold ${getStatusColor(crop.status)}`} style={{ fontFamily: 'Inter-Bold' }}>
                      {crop.status}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between text-xs py-1">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Acreage Sown
                    </Text>
                    <Text className="text-soil text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      {crop.area_acres ? `${crop.area_acres} Acres` : 'Not set'}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between text-xs py-1">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Sowing Date
                    </Text>
                    <Text className="text-soil text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      {crop.sowing_date}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Right Main Area: Field Schedule & Financial Statement */}
          <View className="flex-1 w-full flex-col gap-6">
            {/* Card 1: Schedule & Field Metrics */}
            <View
              className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
              style={{
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row items-center gap-3 mb-6 pb-4 border-b border-soil/5">
                <View className="w-10 h-10 rounded-xl bg-leaf/10 items-center justify-center border border-leaf/15">
                  <Calendar size={20} color="#2E7D32" strokeWidth={2} />
                </View>
                <View>
                  <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                    Cultivation Timeline & Yield
                  </Text>
                  <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                    Recorded milestones from planting through harvest completion
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-4">
                <View className="flex-1 min-w-[140px] bg-sand/60 rounded-xl p-4 border border-soil/5">
                  <Text className="text-soil-muted text-xs mb-1" style={{ fontFamily: 'Inter-Regular' }}>
                    Area Cultivated
                  </Text>
                  <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                    {crop.area_acres ? `${crop.area_acres} Acres` : '—'}
                  </Text>
                </View>

                <View className="flex-1 min-w-[140px] bg-sand/60 rounded-xl p-4 border border-soil/5">
                  <Text className="text-soil-muted text-xs mb-1" style={{ fontFamily: 'Inter-Regular' }}>
                    Date Sown
                  </Text>
                  <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                    {crop.sowing_date || '—'}
                  </Text>
                </View>

                <View className="flex-1 min-w-[140px] bg-sand/60 rounded-xl p-4 border border-soil/5">
                  <Text className="text-soil-muted text-xs mb-1" style={{ fontFamily: 'Inter-Regular' }}>
                    Expected Harvest
                  </Text>
                  <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                    {crop.expected_harvest_date || '—'}
                  </Text>
                </View>

                {crop.status === 'harvested' && (
                  <>
                    <View className="flex-1 min-w-[140px] bg-leaf/10 rounded-xl p-4 border border-leaf/20">
                      <Text className="text-leaf text-xs mb-1 font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                        Actual Harvest
                      </Text>
                      <Text className="text-leaf text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                        {crop.actual_harvest_date || '—'}
                      </Text>
                    </View>

                    <View className="flex-1 min-w-[140px] bg-leaf/10 rounded-xl p-4 border border-leaf/20">
                      <Text className="text-leaf text-xs mb-1 font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                        Final Yield
                      </Text>
                      <Text className="text-leaf text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                        {crop.yield_quantity ? `${crop.yield_quantity} ${crop.yield_unit}` : '—'}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Card 2: Batch Financial Statement & Net Profit */}
            <View
              className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
              style={{
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-soil/5">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-harvest/10 items-center justify-center border border-harvest/15">
                    <Wallet size={20} color="#F57F17" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      Crop Financial Performance
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Live calculated revenues and input expenses mapped to this crop batch
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => router.push('/ledger/new')}
                  className="flex-row items-center bg-leaf/10 border border-leaf/20 px-3 py-1.5 rounded-lg hover:bg-leaf/20"
                >
                  <Plus size={14} color="#2E7D32" strokeWidth={2.4} />
                  <Text className="text-leaf text-xs font-bold ml-1.5" style={{ fontFamily: 'Inter-Bold' }}>
                    Add Transaction
                  </Text>
                </Pressable>
              </View>

              <View className="flex-row flex-wrap gap-4 mb-6">
                <View className="flex-1 min-w-[140px] bg-leaf/5 border border-leaf/15 rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <TrendingUp size={16} color="#2E7D32" strokeWidth={2.4} />
                    <Text className="text-leaf text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      Total Revenue
                    </Text>
                  </View>
                  <Text className="text-leaf text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                    ₹{(profitData?.total_income || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View className="flex-1 min-w-[140px] bg-clay/5 border border-clay/15 rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <TrendingDown size={16} color="#D32F2F" strokeWidth={2.4} />
                    <Text className="text-clay text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      Total Expenses
                    </Text>
                  </View>
                  <Text className="text-clay text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                    ₹{(profitData?.total_expense || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View
                  className={`flex-1 min-w-[140px] rounded-xl p-4 border ${netProfit >= 0 ? 'bg-leaf/10 border-leaf/20' : 'bg-clay/10 border-clay/20'}`}
                >
                  <View className="flex-row items-center gap-2 mb-2">
                    <Wallet size={16} color={netProfit >= 0 ? '#2E7D32' : '#D32F2F'} strokeWidth={2.4} />
                    <Text className={`text-xs font-semibold ${netProfit >= 0 ? 'text-leaf' : 'text-clay'}`} style={{ fontFamily: 'Inter-Medium' }}>
                      Net Batch Profit
                    </Text>
                  </View>
                  <Text
                    className={`text-2xl font-bold ${netProfit >= 0 ? 'text-leaf' : 'text-clay'}`}
                    style={{ fontFamily: 'Inter-Bold' }}
                  >
                    {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
