import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTransactions } from '@/lib/api/transactions';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Receipt, ChevronRight } from 'lucide-react-native';
import { useCrops } from '@/lib/api/crops';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
function TransactionRow({ tx, index, onPress }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 70, 280)).duration(400)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        className="bg-surface rounded-2xl p-4 border border-soil/5 flex-row items-center"
        style={{
          shadowColor: '#3E2723',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 1 },
        }}
      >
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${tx.type === 'income' ? 'bg-leaf/10' : 'bg-clay/10'}`}
        >
          <Receipt
            size={22}
            color={tx.type === 'income' ? '#2E7D32' : '#D32F2F'}
            strokeWidth={2}
          />
        </View>

        <View className="flex-1">
          <Text
            className="text-soil text-base font-semibold"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            {tx.category}
          </Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Text
              className="text-soil-muted text-xs"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              {tx.transaction_date}
            </Text>
            <Text className="text-soil-muted text-xs">•</Text>
            <Text
              className="text-soil-muted text-xs"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              {tx.crops?.crop_name}
            </Text>
          </View>
        </View>

        {tx.receipt_url && (
          <View className="w-8 h-8 rounded overflow-hidden mr-3">
            <Image source={{ uri: tx.receipt_url }} className="w-full h-full" />
          </View>
        )}

        <View className="items-end mr-2">
          <Text
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 16,
              color: tx.type === 'income' ? '#2E7D32' : '#D32F2F',
            }}
          >
            {tx.type === 'income' ? '+' : '-'}₹
            {tx.amount.toLocaleString('en-IN')}
          </Text>
        </View>

        <ChevronRight size={18} color="#BDB8B0" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}
export default function LedgerScreen() {
  const router = useRouter();
  const [filterCrop, setFilterCrop] = useState('');
  const { data: crops } = useCrops();
  const {
    data: transactions,
    isLoading,
    error,
  } = useTransactions(filterCrop || undefined);
  const cropOptions = [
    { label: 'All Crops', value: '' },
    ...(crops?.map((c) => ({ label: c.crop_name, value: c.id })) || []),
  ];
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <Text className="text-clay">Error loading transactions.</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2 md:max-w-3xl md:w-full md:self-center">
        <Text
          className="text-soil text-2xl font-bold"
          style={{ fontFamily: 'Inter-Bold' }}
        >
          Ledger
        </Text>
        <Pressable
          onPress={() => router.push('/ledger/new')}
          className="w-11 h-11 rounded-full bg-leaf items-center justify-center shadow-sm"
        >
          <Plus size={22} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>

      <View className="px-5 py-2 md:max-w-3xl md:w-full md:self-center">
        <Select
          value={filterCrop}
          onValueChange={setFilterCrop}
          options={cropOptions}
          placeholder="Filter by Crop"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-8 pt-2 md:max-w-3xl md:w-full md:self-center md:py-6"
      >
        {transactions?.length === 0 ? (
          <EmptyState
            icon={<Receipt size={36} color="#2E7D32" strokeWidth={1.8} />}
            title="No transactions yet"
            description="Track your income and expenses by adding your first transaction."
            actionLabel="Add Transaction"
            onAction={() => router.push('/ledger/new')}
          />
        ) : (
          <View className="gap-3">
            {transactions?.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                index={i}
                onPress={() => router.push(`/ledger/${tx.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
