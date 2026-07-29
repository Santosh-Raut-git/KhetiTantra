import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminUsers, useDeleteUserAdmin, AdminUser } from '@/lib/api/admin';
import { Card } from '@/components/ui/Card';
import { User, MapPin, Phone, Trash2, Sprout } from 'lucide-react-native';

export default function AdminUsersScreen() {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const deleteUser = useDeleteUserAdmin();

  const handleDeleteUser = (user: AdminUser) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.full_name || 'Unknown'}"? This will remove all their data including crops and transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteUser.mutate(user.id, {
              onError: (err) => Alert.alert('Error', err.message),
            });
          }
        },
      ]
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
        <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
          User Management
        </Text>
        <Text className="text-soil-muted text-sm mt-1" style={{ fontFamily: 'Inter-Regular' }}>
          {users?.length || 0} registered users
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerClassName="p-5 pb-8 md:max-w-3xl md:w-full md:self-center md:py-8"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} colors={['#2E7D32']} />
        }
      >
        {users?.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <User size={48} color="#6D4C41" />
            <Text className="text-soil text-lg font-bold mt-4" style={{ fontFamily: 'Inter-Bold' }}>
              No users yet
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {users?.map((user) => (
              <Card key={user.id} className="p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-3">
                      <User size={22} color="#2E7D32" strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-soil text-base font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                        {user.full_name || 'Unnamed User'}
                      </Text>
                      <View className="flex-row items-center mt-1 flex-wrap gap-y-1">
                        {user.village && (
                          <View className="flex-row items-center mr-3">
                            <MapPin size={12} color="#6D4C41" />
                            <Text className="text-soil-muted text-xs ml-1" style={{ fontFamily: 'Inter-Regular' }}>
                              {user.village}{user.district ? `, ${user.district}` : ''}
                            </Text>
                          </View>
                        )}
                        {user.phone && (
                          <View className="flex-row items-center mr-3">
                            <Phone size={12} color="#6D4C41" />
                            <Text className="text-soil-muted text-xs ml-1" style={{ fontFamily: 'Inter-Regular' }}>
                              {user.phone}
                            </Text>
                          </View>
                        )}
                        {user.land_area_acres && (
                          <View className="flex-row items-center">
                            <Sprout size={12} color="#6D4C41" />
                            <Text className="text-soil-muted text-xs ml-1" style={{ fontFamily: 'Inter-Regular' }}>
                              {user.land_area_acres} acres
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-soil-muted text-xs mt-1" style={{ fontFamily: 'Inter-Regular' }}>
                        Joined: {new Date(user.created_at).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteUser(user)}
                    className="w-10 h-10 rounded-full bg-clay/10 items-center justify-center"
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