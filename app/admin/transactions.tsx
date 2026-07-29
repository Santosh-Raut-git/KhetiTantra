import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminTransactions, useDeleteTransactionAdmin, AdminTransaction } from '@/lib/api/admin';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Trash2, User } from 'lucide-react-native';

export default function AdminTransactionsScreen() {
  const { data: transactions, isLoading, refetch } = useAdminTransactions();
  const deleteTransaction = useDeleteTransactionAdmin();

  const handleDeleteTransaction = (tx: AdminTransaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ₹${tx.amount} ${tx.type} transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction.mutate(tx.id, {
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
          All Transactions
        </Text>
        <Text className="text-soil-muted text-sm mt-1" style={{ fontFamily: 'Inter-Regular' }}>
          {transactions?.length || 0} transactions across all users
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerClassName="p-5 pb-8 md:max-w-3xl md:w-full md:self-center md:py-8"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} colors={['#2E7D32']} />
        }
      >
        {transactions?.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <TrendingUp size={48} color="#2E7D32" />
            <Text className="text-soil text-lg font-bold mt-4" style={{ fontFamily: 'Inter-Bold' }}>
              No transactions recorded
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {transactions?.map((tx) => (
              <Card key={tx.id} className="p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-start flex-1">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                      tx.type === 'income' ? 'bg-leaf/10' : 'bg-clay/10'
                    }`}>
                      {tx.type === 'income' ? (
                        <TrendingUp size={22} color="#2E7D32" strokeWidth={2} />
                      ) : (
                        <TrendingDown size={22} color="#D32F2F" strokeWidth={2} />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-soil text-base font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                          {tx.category}
                        </Text>
                        <Text 
                          className="text-base font-bold"
                          style={{ 
                            fontFamily: 'Inter-Bold',
                            color: tx.type === 'income' ? '#2E7D32' : '#D32F2F'
                          }}
                        >
                          {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      
                      {tx.description && (
                        <Text className="text-soil-muted text-sm mt-1" style={{ fontFamily: 'Inter-Regular' }} numberOfLines={1}>
                          {tx.description}
                        </Text>
                      )}

                      <View className="flex-row items-center mt-2 flex-wrap gap-y-1">
                        <View className="flex-row items-center mr-3">
                          <User size={12} color="#6D4C41" />
                          <Text className="text-soil-muted text-xs ml-1" style={{ fontFamily: 'Inter-Medium' }}>
                            {tx.profiles?.full_name || 'Unknown'}
                          </Text>
                        </View>
                        <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                          Crop: {tx.crops?.crop_name || 'Unknown'}
                        </Text>
                        <Text className="text-soil-muted text-xs ml-3" style={{ fontFamily: 'Inter-Regular' }}>
                          {tx.transaction_date}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteTransaction(tx)}
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