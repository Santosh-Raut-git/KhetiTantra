import { View, Text, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTransaction, useDeleteTransaction } from '@/lib/api/transactions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Trash2, Receipt } from 'lucide-react-native';

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: tx, isLoading } = useTransaction(id);
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteTransaction.mutate(id, {
              onSuccess: () => router.back(),
              onError: (err) => Alert.alert('Error', err.message),
            });
          }
        },
      ]
    );
  };

  if (isLoading || !tx) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

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
            Transaction
          </Text>
        </View>
        <Button 
          variant="secondary"
          label=""
          icon={<Trash2 size={20} color="#D32F2F" />}
          onPress={handleDelete}
          className="w-12 h-12 p-0 bg-clay/10"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 pb-12 md:max-w-2xl md:w-full md:self-center md:py-8">
        <Card className="mb-6 items-center pt-8 pb-8">
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${tx.type === 'income' ? 'bg-leaf/10' : 'bg-clay/10'}`}>
            <Receipt size={40} color={tx.type === 'income' ? '#2E7D32' : '#D32F2F'} strokeWidth={1.5} />
          </View>
          <Text 
            className="text-4xl font-bold mb-1" 
            style={{ 
              fontFamily: 'Inter-Bold',
              color: tx.type === 'income' ? '#2E7D32' : '#D32F2F'
            }}
          >
            {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
          </Text>
          <Text className="text-soil-muted text-base mb-3" style={{ fontFamily: 'Inter-Medium' }}>
            {tx.transaction_date}
          </Text>
          <View className="bg-surface border border-soil/10 px-4 py-1.5 rounded-full">
            <Text className="font-bold text-soil capitalize" style={{ fontFamily: 'Inter-Bold' }}>
              {tx.category}
            </Text>
          </View>
        </Card>

        <Text className="text-soil text-lg font-bold mb-3 px-1" style={{ fontFamily: 'Inter-Bold' }}>
          Details
        </Text>
        <Card className="mb-6">
          <View className="flex-row justify-between py-3 border-b border-soil/5">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Related Crop</Text>
            <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              {tx.crops?.crop_name}
            </Text>
          </View>
          <View className="flex-row justify-between py-3">
            <Text className="text-soil-muted" style={{ fontFamily: 'Inter-Regular' }}>Description</Text>
            <Text className="text-soil font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
              {tx.description || '-'}
            </Text>
          </View>
        </Card>

        {tx.receipt_url && (
          <>
            <Text className="text-soil text-lg font-bold mb-3 px-1 mt-2" style={{ fontFamily: 'Inter-Bold' }}>
              Receipt
            </Text>
            <View className="w-full h-64 rounded-2xl overflow-hidden border border-soil/15 bg-surface">
              <Image source={{ uri: tx.receipt_url }} className="w-full h-full" resizeMode="contain" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
