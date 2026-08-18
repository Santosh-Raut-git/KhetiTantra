import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminCrops, useDeleteCropAdmin } from '@/lib/api/admin';
import { Card } from '@/components/ui/Card';
import { Sprout, Trash2, User } from 'lucide-react-native';
import { getStatusColor, getStatusBg } from '@/lib/utils';
export default function AdminCropsScreen() {
  const { data: crops, isLoading, refetch } = useAdminCrops();
  const deleteCrop = useDeleteCropAdmin();
  const handleDeleteCrop = (crop) => {
    Alert.alert(
      'Delete Crop',
      `Are you sure you want to delete "${crop.crop_name}"? This will also remove linked transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCrop.mutate(crop.id, {
              onError: (err) => Alert.alert('Error', err.message),
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="px-5 pt-4 pb-3 border-b border-soil/5 md:max-w-3xl md:w-full md:self-center">
        <Text
          className="text-soil text-2xl font-bold"
          style={{ fontFamily: 'Inter-Bold' }}
        >
          All Crops
        </Text>
        <Text
          className="text-soil-muted text-sm mt-1"
          style={{ fontFamily: 'Inter-Regular' }}
        >
          {crops?.length || 0} crops across all users
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-8 md:max-w-3xl md:w-full md:self-center md:py-8"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            colors={['#2E7D32']}
          />
        }
      >
        {crops?.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Sprout size={48} color="#2E7D32" />
            <Text
              className="text-soil text-lg font-bold mt-4"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              No crops recorded
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {crops?.map((crop) => (
              <Card key={crop.id} className="p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-start flex-1">
                    <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-3">
                      <Sprout size={22} color="#2E7D32" strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className="text-soil text-base font-bold"
                          style={{ fontFamily: 'Inter-Bold' }}
                        >
                          {crop.crop_name}
                        </Text>
                        <View
                          className={`px-2.5 py-1 rounded-full ${getStatusBg(crop.status)}`}
                        >
                          <Text
                            className={`text-xs font-bold capitalize ${getStatusColor(crop.status)}`}
                            style={{ fontFamily: 'Inter-Bold' }}
                          >
                            {crop.status}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mt-1.5 gap-2">
                        <Text
                          className="text-soil-muted text-xs"
                          style={{ fontFamily: 'Inter-Regular' }}
                        >
                          {crop.variety ? `${crop.variety} • ` : ''}
                          {crop.season}
                        </Text>
                        {crop.area_acres && (
                          <Text
                            className="text-soil-muted text-xs"
                            style={{ fontFamily: 'Inter-Regular' }}
                          >
                            • {crop.area_acres} acres
                          </Text>
                        )}
                      </View>

                      <View className="flex-row items-center mt-2">
                        <User size={12} color="#6D4C41" />
                        <Text
                          className="text-soil-muted text-xs ml-1"
                          style={{ fontFamily: 'Inter-Medium' }}
                        >
                          {crop.profiles?.full_name || 'Unknown User'}
                        </Text>
                        <Text
                          className="text-soil-muted text-xs ml-3"
                          style={{ fontFamily: 'Inter-Regular' }}
                        >
                          Sown: {crop.sowing_date}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteCrop(crop)}
                    className="w-10 h-10 rounded-full bg-clay/10 items-center justify-center ml-2"
                    style={{ minHeight: 44, minWidth: 44 }}
                  >
                    <Trash2 size={18} color="#D32F2F" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
