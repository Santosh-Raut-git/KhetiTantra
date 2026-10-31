import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTransaction, useDeleteTransaction } from '@/lib/api/transactions';
import {
  ArrowLeft,
  Trash2,
  Receipt,
  Calendar,
  Sprout,
  Tag,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: tx, isLoading } = useTransaction(id);
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this transaction from your ledger? This action cannot be undone.',
      );
      if (confirmed) {
        deleteTransaction.mutate(id, {
          onSuccess: () => router.back(),
          onError: (err) => alert('Error deleting transaction: ' + err.message),
        });
      }
    } else {
      Alert.alert(
        'Delete Transaction',
        'Are you sure you want to delete this transaction? This action cannot be undone.',
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
            },
          },
        ],
      );
    }
  };

  if (isLoading || !tx) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  const isIncome = tx.type === 'income';

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
                  Transaction Voucher
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    isIncome ? 'bg-leaf/10' : 'bg-clay/10'
                  }`}
                >
                  <Text
                    className={`text-xs capitalize font-bold ${
                      isIncome ? 'text-leaf' : 'text-clay'
                    }`}
                    style={{ fontFamily: 'Inter-Bold' }}
                  >
                    {tx.type === 'income' ? 'Farm Credit' : 'Farm Debit'}
                  </Text>
                </View>
              </View>
              <Text
                className="text-soil-muted text-xs lg:text-sm mt-0.5"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                Recorded on {tx.transaction_date} • Batch margin entry
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleDelete}
            className="flex-row items-center bg-clay/10 border border-clay/20 px-4 py-2.5 rounded-xl hover:bg-clay/20"
            style={{ minHeight: 40 }}
          >
            <Trash2 size={16} color="#D32F2F" strokeWidth={2} />
            <Text
              className="text-clay font-bold ml-2 text-sm"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Delete Record
            </Text>
          </Pressable>
        </View>

        {/* 2-Column Responsive Body */}
        <View className="flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Transaction Details & Breakdown */}
          <View className="flex-1 w-full flex-col gap-6">
            {/* Hero Card */}
            <Animated.View entering={FadeInUp.duration(400)}>
              <View
                className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center justify-between pb-6 border-b border-soil/5 mb-6">
                  <View className="flex-row items-center gap-4">
                    <View
                      className={`w-14 h-14 rounded-2xl items-center justify-center ${
                        isIncome ? 'bg-leaf/10 border border-leaf/20' : 'bg-clay/10 border border-clay/20'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp size={28} color="#2E7D32" strokeWidth={2.2} />
                      ) : (
                        <TrendingDown size={28} color="#D32F2F" strokeWidth={2.2} />
                      )}
                    </View>
                    <View>
                      <Text className="text-soil-muted text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'Inter-Medium' }}>
                        {isIncome ? 'Total Received' : 'Total Paid Out'}
                      </Text>
                      <Text
                        className={`text-3xl md:text-4xl font-bold ${
                          isIncome ? 'text-leaf' : 'text-clay'
                        }`}
                        style={{ fontFamily: 'Inter-Bold' }}
                      >
                        {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-sand/80 border border-soil/10 px-4 py-2 rounded-xl">
                    <Text className="text-soil text-sm font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      {tx.category}
                    </Text>
                  </View>
                </View>

                {/* Voucher Specifications Grid */}
                <Text
                  className="text-soil text-base font-bold mb-4"
                  style={{ fontFamily: 'Inter-Bold' }}
                >
                  Transaction Specifications
                </Text>

                <View className="bg-sand/40 rounded-xl border border-soil/5 divide-y divide-soil/5">
                  <View className="flex-row items-center justify-between p-4">
                    <View className="flex-row items-center gap-3">
                      <Sprout size={18} color="#2E7D32" />
                      <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Regular' }}>
                        Associated Crop Batch
                      </Text>
                    </View>
                    <Text className="text-soil text-sm font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      {tx.crops?.crop_name || 'Unassigned Batch'}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between p-4">
                    <View className="flex-row items-center gap-3">
                      <Calendar size={18} color="#3E2723" />
                      <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Regular' }}>
                        Posting Date
                      </Text>
                    </View>
                    <Text className="text-soil text-sm font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      {tx.transaction_date}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between p-4">
                    <View className="flex-row items-center gap-3">
                      <Tag size={18} color="#F57F17" />
                      <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Regular' }}>
                        Accounting Category
                      </Text>
                    </View>
                    <Text className="text-soil text-sm font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      {tx.category}
                    </Text>
                  </View>

                  <View className="flex-col p-4">
                    <View className="flex-row items-center gap-3 mb-2">
                      <FileText size={18} color="#9E9189" />
                      <Text className="text-soil-muted text-sm" style={{ fontFamily: 'Inter-Regular' }}>
                        Notes & Description
                      </Text>
                    </View>
                    <Text className="text-soil text-sm leading-5 pl-7" style={{ fontFamily: 'Inter-Regular' }}>
                      {tx.description || 'No detailed note was provided for this voucher.'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Right Column: Receipt Image & Audit Proof (~380px) */}
          <View className="w-full lg:w-96 shrink-0 flex-col gap-6">
            {/* Attached Receipt Card */}
            <View
              className="bg-surface rounded-2xl p-6 border border-soil/5 shadow-sm"
              style={{
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-soil/5">
                <View className="flex-row items-center gap-2">
                  <Receipt size={18} color="#2E7D32" strokeWidth={2.2} />
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    Documentary Evidence
                  </Text>
                </View>
                {tx.receipt_url && (
                  <Pressable
                    onPress={() => Linking.openURL(tx.receipt_url)}
                    className="flex-row items-center gap-1 bg-leaf/10 px-2.5 py-1 rounded-lg hover:bg-leaf/20"
                  >
                    <Text className="text-leaf text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      Full View
                    </Text>
                    <ExternalLink size={12} color="#2E7D32" />
                  </Pressable>
                )}
              </View>

              {tx.receipt_url ? (
                <View className="w-full rounded-xl overflow-hidden border border-soil/10 bg-sand/40">
                  <Image
                    source={{ uri: tx.receipt_url }}
                    className="w-full h-72"
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View className="py-8 items-center justify-center bg-sand/30 rounded-xl border border-dashed border-soil/15 text-center px-4">
                  <Receipt size={36} color="#9E9189" strokeWidth={1.5} />
                  <Text className="text-soil text-sm font-semibold mt-2 mb-1" style={{ fontFamily: 'Inter-Medium' }}>
                    No Physical Receipt Attached
                  </Text>
                  <Text className="text-soil-muted text-xs text-center leading-4" style={{ fontFamily: 'Inter-Regular' }}>
                    This transaction was recorded via direct digital entry without an invoice photo.
                  </Text>
                </View>
              )}
            </View>

            {/* Audit & Profit Calculation Callout */}
            <View className="bg-leaf/5 border border-leaf/15 rounded-2xl p-5 flex-col gap-2.5">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={16} color="#2E7D32" />
                <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                  Audited Farm Record
                </Text>
              </View>
              <Text className="text-soil-muted text-xs leading-5" style={{ fontFamily: 'Inter-Regular' }}>
                This voucher is cryptographically signed in your personal ledger and mapped directly to {tx.crops?.crop_name || 'your farm'} to maintain an accurate seasonal P&L statement.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
