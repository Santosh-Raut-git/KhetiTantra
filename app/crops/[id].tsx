import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCrop, useDeleteCrop, useCropProfits } from '@/lib/api/crops';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Edit2, Trash2, Sprout } from 'lucide-react-native';

export default function CropDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: crop, isLoading } = useCrop(id);
  const deleteCrop = useDeleteCrop();
  const { data: cropProfits } = useCropProfits();
  
  const profitData = cropProfits?.find(p => p.crop_id === id);
  const netProfit = profitData?.net_profit || 0;

  const handleDelete = () => {
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
          }
        },
      ]
    );
  };

  if (isLoading || !crop) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-leaf';
      case 'harvested': return 'text-harvest-dark';
      case 'failed': return 'text-clay';
      default: return 'text-soil-muted';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-soil/5 md:max-w-2xl md:w-full md:self-center">
        <View className="flex-row items-center">
          <Button 
            variant="secondary" 
            label="" 
            icon={<ArrowLeft size={24} color="#3E2723" />} 
            onPress={() => router.back()}
            className="mr-3 w-12 h-12 p-0"
          />
          <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
            Crop Details
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Button 
            variant="secondary"
            label=""
            icon={<Edit2 size={20} color="#2E7D32" />}
            onPress={() => router.push(`/crops/${id}/edit`)}
            className="w-12 h-12 p-0 bg-leaf/10"
          />
          <Button 
            variant="secondary"
            label=""
            icon={<Trash2 size={20} color="#D32F2F" />}
            onPress={handleDelete}
            className="w-12 h-12 p-0 bg-clay/10"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 md:max-w-2xl md:w-full md:self-center md:py-8">
        <Card className="mb-6 items-center pt-8 pb-8">
          <View className="w-20 h-20 rounded-full bg-leaf/10 items-center justify-center mb-4">
            <Sprout size={40} color="#2E7D32" strokeWidth={1.5} />
          </View>
          <Text className="text-soil text-3xl font-bold mb-1" style={{ fontFamily: 'Inter-Bold' }}>
            {crop.crop_name}
          </Text>
          <Text className="text-soil-muted text-base mb-3" style={{ fontFamily: 'Inter-Regular' }}>
            {crop.variety ? `${crop.variety} • ` : ''}{crop.season}
          </Text>
          <View className="bg-surface border border-soil/10 px-4 py-1.5 rounded-full">
            <Text className={`font-bold capitalize ${getStatusColor(crop.status)}`} style={{ fontFamily: 'Inter-Bold' }}>
              {crop.status}
            </Text>
          </View>
        </Card>

        <Text className="text-soil text-lg font-bold mb-3 px-1" style={{ fontFamily: 'Inter-Bold' }}>
          Crop Information
        </Text>
        <Card className="mb-6">
          <View className="flex-row justify-between py-3 border-b border-soil/5">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Area</Text>
            <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              {crop.area_acres ? `${crop.area_acres} Acres` : '-'}
            </Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-soil/5">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Sowing Date</Text>
            <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              {crop.sowing_date}
            </Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-soil/5">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Expected Harvest</Text>
            <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              {crop.expected_harvest_date || '-'}
            </Text>
          </View>
          {crop.status === 'harvested' && (
            <>
              <View className="flex-row justify-between py-3 border-b border-soil/5">
                <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Actual Harvest</Text>
                <Text className="text-soil font-semibold text-leaf" style={{ fontFamily: 'Inter-Medium' }}>
                  {crop.actual_harvest_date || '-'}
                </Text>
              </View>
              <View className="flex-row justify-between py-3">
                <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Yield</Text>
                <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                  {crop.yield_quantity ? `${crop.yield_quantity} ${crop.yield_unit}` : '-'}
                </Text>
              </View>
            </>
          )}
        </Card>

        <Text className="text-soil text-lg font-bold mb-3 px-1 mt-2" style={{ fontFamily: 'Inter-Bold' }}>
          Financial Summary
        </Text>
        <Card className="mb-8 bg-leaf/5 border-leaf/20">
          <View className="flex-row justify-between py-3 border-b border-leaf/10">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Total Income</Text>
            <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              ₹{profitData?.total_income.toLocaleString('en-IN') || 0}
            </Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-leaf/10">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Total Expenses</Text>
            <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              ₹{profitData?.total_expense.toLocaleString('en-IN') || 0}
            </Text>
          </View>
          <View className="flex-row justify-between py-4">
            <Text className="text-soil font-bold text-lg" style={{ fontFamily: 'Inter-Bold' }}>Net Profit</Text>
            <Text 
              className="text-lg"
              style={{ 
                fontFamily: 'Inter-Bold', 
                color: netProfit >= 0 ? '#2E7D32' : '#D32F2F' 
              }}
            >
              {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
