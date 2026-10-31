import { useState, useMemo } from 'react';
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
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Receipt, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { useCrops } from '@/lib/api/crops';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function TransactionCard({ tx, index, onPress }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isIncome = tx.type === 'income';

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 50, 300)).duration(380)}
      style={animatedStyle}
      className="w-full md:w-[calc(50%-10px)] xl:w-[calc(33.333%-12px)]"
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        className="bg-surface rounded-2xl p-4 border border-soil/5 flex-row items-center justify-between shadow-sm hover:border-soil/20 transition-all"
        style={{
          shadowColor: '#3E2723',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 1 },
        }}
      >
        <View className="flex-row items-center flex-1 mr-3">
          <View
            className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${isIncome ? 'bg-leaf/10' : 'bg-clay/10'}`}
          >
            <Receipt
              size={22}
              color={isIncome ? '#2E7D32' : '#D32F2F'}
              strokeWidth={2}
            />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-soil text-base font-semibold"
                style={{ fontFamily: 'Inter-Bold' }}
                numberOfLines={1}
              >
                {tx.category}
              </Text>
              <View className={`px-2 py-0.5 rounded-md ${isIncome ? 'bg-leaf/10' : 'bg-clay/10'}`}>
                <Text
                  className={`text-[11px] capitalize font-medium ${isIncome ? 'text-leaf' : 'text-clay'}`}
                  style={{ fontFamily: 'Inter-Medium' }}
                >
                  {tx.type}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 mt-1">
              <Text
                className="text-soil-muted text-xs"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                {tx.transaction_date}
              </Text>
              {tx.crops?.crop_name && (
                <>
                  <Text className="text-soil-muted text-xs">•</Text>
                  <Text
                    className="text-soil-muted text-xs"
                    style={{ fontFamily: 'Inter-Medium' }}
                  >
                    {tx.crops.crop_name}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          {tx.receipt_url && (
            <View className="w-8 h-8 rounded-lg overflow-hidden border border-soil/10">
              <Image source={{ uri: tx.receipt_url }} className="w-full h-full" resizeMode="cover" />
            </View>
          )}

          <View className="items-end">
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 16,
                color: isIncome ? '#2E7D32' : '#D32F2F',
              }}
            >
              {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
            </Text>
          </View>

          <ChevronRight size={18} color="#BDB8B0" strokeWidth={2} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function LedgerScreen() {
  const router = useRouter();
  const [filterCrop, setFilterCrop] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!typeFilter) return transactions;
    return transactions.filter((tx) => tx.type === typeFilter);
  }, [transactions, typeFilter]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions?.forEach((tx) => {
      if (tx.type === 'income') inc += Number(tx.amount);
      if (tx.type === 'expense') exp += Number(tx.amount);
    });
    return { totalIncome: inc, totalExpense: exp };
  }, [transactions]);

  const netProfit = totalIncome - totalExpense;

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, width: '100%' }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
      >
        {/* Desktop Header Banner */}
        <View className="flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-soil/5">
          <View>
            <Text
              className="text-soil text-2xl lg:text-3xl font-bold"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Farm Ledger
            </Text>
            <Text
              className="text-soil-muted text-sm mt-1"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Track crop revenue, input costs, and net farm cash flow
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/ledger/new')}
            className="flex-row items-center justify-center bg-leaf px-5 py-3 rounded-xl shadow-sm hover:bg-leaf-dark self-start sm:self-auto"
            style={{ minHeight: 44 }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text
              className="text-white text-sm ml-2"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Add Transaction
            </Text>
          </Pressable>
        </View>

        {/* 3 Summary Cards */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          <Card className="flex-1 min-w-[160px] md:min-w-[220px]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                Net Balance
              </Text>
              <View className="w-7 h-7 rounded-full bg-leaf/10 items-center justify-center">
                <Wallet size={15} color="#2E7D32" />
              </View>
            </View>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 22,
                color: netProfit >= 0 ? '#2E7D32' : '#D32F2F',
              }}
            >
              {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
            </Text>
          </Card>

          <Card className="flex-1 min-w-[160px] md:min-w-[220px]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                Total Income
              </Text>
              <View className="w-7 h-7 rounded-full bg-leaf/10 items-center justify-center">
                <TrendingUp size={15} color="#2E7D32" />
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 22, color: '#2E7D32' }}>
              ₹{totalIncome.toLocaleString('en-IN')}
            </Text>
          </Card>

          <Card className="flex-1 min-w-[160px] md:min-w-[220px]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Medium' }}>
                Total Expenses
              </Text>
              <View className="w-7 h-7 rounded-full bg-clay/10 items-center justify-center">
                <TrendingDown size={15} color="#D32F2F" />
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 22, color: '#D32F2F' }}>
              ₹{totalExpense.toLocaleString('en-IN')}
            </Text>
          </Card>
        </View>

        {/* Filters Toolbar */}
        <View className="flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-surface p-3 rounded-2xl border border-soil/5">
          <View className="flex-1 max-w-xs">
            <Select
              value={filterCrop}
              onValueChange={setFilterCrop}
              options={cropOptions}
              placeholder="Filter by Crop"
            />
          </View>

          <View className="flex-row items-center gap-2">
            {[
              { label: 'All', value: '' },
              { label: 'Income', value: 'income' },
              { label: 'Expenses', value: 'expense' },
            ].map((tab) => {
              const active = typeFilter === tab.value;
              return (
                <Pressable
                  key={tab.label}
                  onPress={() => setTypeFilter(tab.value)}
                  className={`px-3.5 py-2 rounded-xl border ${active ? 'bg-soil border-soil' : 'bg-sand/60 border-soil/10'}`}
                >
                  <Text
                    style={{
                      fontFamily: active ? 'Inter-Bold' : 'Inter-Medium',
                      fontSize: 12,
                      color: active ? '#FFFFFF' : '#6D4C41',
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={36} color="#2E7D32" strokeWidth={1.8} />}
            title="No transactions yet"
            description="Track your farm income and input expenses by recording your first transaction."
            actionLabel="Add Transaction"
            onAction={() => router.push('/ledger/new')}
          />
        ) : (
          <View className="flex-row flex-wrap gap-4">
            {filteredTransactions.map((tx, i) => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                index={i}
                onPress={() => router.push(`/ledger/${tx.id}`)}
              />
            ))}

            {/* If fewer than 4 transactions, offer a quick Add Transaction dashed card */}
            {filteredTransactions.length < 4 && (
              <Pressable
                onPress={() => router.push('/ledger/new')}
                className="w-full md:w-[calc(50%-10px)] xl:w-[calc(33.333%-12px)] border-2 border-dashed border-soil/15 rounded-2xl p-5 items-center justify-center min-h-[90px] bg-surface/40 hover:bg-surface hover:border-leaf/50 transition-all flex-row gap-3"
              >
                <View className="w-10 h-10 rounded-xl bg-leaf/10 items-center justify-center">
                  <Plus size={20} color="#2E7D32" strokeWidth={2.2} />
                </View>
                <View>
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    Record New Transaction
                  </Text>
                  <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                    Log seeds, fertilizers, fuel, or sales revenue
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
