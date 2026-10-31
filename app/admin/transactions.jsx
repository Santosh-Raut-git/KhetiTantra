import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAdminTransactions,
  useDeleteTransactionAdmin,
} from '@/lib/api/admin';
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  User,
  Search,
  X,
  Wallet,
  Calendar,
  Sprout,
  Receipt,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AdminTransactionsScreen() {
  const { data: transactions, isLoading, refetch } = useAdminTransactions();
  const deleteTransaction = useDeleteTransactionAdmin();
  const { width } = useWindowDimensions();
  const numColumns = width >= 1440 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const cardWidth = `${100 / numColumns}%`;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // '' | 'income' | 'expense'

  const handleDeleteTransaction = (tx) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete this ₹${tx.amount} ${tx.type} transaction?\n\nThis will remove it from the platform ledger.`,
      );
      if (confirmed) {
        deleteTransaction.mutate(tx.id, {
          onError: (err) => alert('Error: ' + err.message),
        });
      }
    } else {
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
            },
          },
        ],
      );
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchSearch =
        !q ||
        tx.category?.toLowerCase().includes(q) ||
        tx.description?.toLowerCase().includes(q) ||
        tx.profiles?.full_name?.toLowerCase().includes(q) ||
        tx.crops?.crop_name?.toLowerCase().includes(q);

      const matchType = !typeFilter || tx.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [transactions, search, typeFilter]);

  const stats = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, net: 0 };
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      if (tx.type === 'expense') expense += Number(tx.amount);
    });

    return { income, expense, net: income - expense };
  }, [transactions]);

  if (isLoading) {
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
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Header Banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(62,39,35,0.06)',
          }}
        >
          <View>
            <Text
              style={{ fontFamily: 'Inter-Bold', fontSize: 28, color: '#3E2723' }}
            >
              Platform Financial Ledger
            </Text>
            <Text
              style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 2 }}
            >
              Master ledger auditing {transactions?.length || 0} financial events across all grower accounts
            </Text>
          </View>
        </View>

        {/* 4 Summary Metric Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Total Volume</Text>
              <Receipt size={16} color="#3E2723" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#3E2723' }}>
              {transactions?.length || 0}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Gross Inflow (Income)</Text>
              <TrendingUp size={16} color="#2E7D32" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#2E7D32' }}>
              ₹{stats.income.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Gross Outflow (Costs)</Text>
              <TrendingDown size={16} color="#D32F2F" />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: '#D32F2F' }}>
              ₹{stats.expense.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 160, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(62,39,35,0.06)', shadowColor: '#3E2723', shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189' }}>Net Ecosystem</Text>
              <Wallet size={16} color={stats.net >= 0 ? '#2E7D32' : '#D32F2F'} />
            </View>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 24,
                color: stats.net >= 0 ? '#2E7D32' : '#D32F2F',
              }}
            >
              {stats.net >= 0 ? '+' : ''}₹{stats.net.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Search & Filter Toolbar */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(62,39,35,0.06)',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            shadowColor: '#3E2723',
            shadowOpacity: 0.03,
            shadowRadius: 6,
          }}
        >
          {/* Search Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F5F0',
              borderRadius: 12,
              paddingHorizontal: 14,
              height: 44,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.08)',
            }}
          >
            <Search size={18} color="#9E9189" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by category, description, user, or crop..."
              placeholderTextColor="#9E9189"
              style={{
                flex: 1,
                marginLeft: 10,
                fontFamily: 'Inter-Regular',
                fontSize: 14,
                color: '#3E2723',
                outline: 'none',
              }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X size={16} color="#9E9189" />
              </Pressable>
            )}
          </View>

          {/* Type Filter Tabs */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#9E9189', marginRight: 4 }}>
              Transaction Type:
            </Text>
            {[
              { label: 'All Transactions', value: '' },
              { label: 'Income Only (+)', value: 'income' },
              { label: 'Expenses Only (-)', value: 'expense' },
            ].map((tab) => {
              const active = typeFilter === tab.value;
              return (
                <Pressable
                  key={tab.label}
                  onPress={() => setTypeFilter(tab.value)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active
                      ? tab.value === 'expense'
                        ? '#D32F2F'
                        : '#2E7D32'
                      : '#F5F5F0',
                    borderWidth: 1,
                    borderColor: active ? 'transparent' : 'rgba(62,39,35,0.08)',
                  }}
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

        {/* Results Counter */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189' }}>
            Showing <Text style={{ fontFamily: 'Inter-Bold', color: '#3E2723' }}>{filteredTransactions.length}</Text> records
          </Text>
          {(search || typeFilter) && (
            <Pressable onPress={() => { setSearch(''); setTypeFilter(''); }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
                Reset Filters
              </Text>
            </Pressable>
          )}
        </View>

        {/* Transactions Responsive Grid */}
        {filteredTransactions.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Receipt size={26} color="#2E7D32" strokeWidth={1.8} />
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}>
              No transactions match your query
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189', marginTop: 4, textAlign: 'center', maxWidth: 340 }}>
              Try adjusting your search terms or selecting All Transactions.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -8 }}>
            {filteredTransactions.map((tx, i) => {
              const isIncome = tx.type === 'income';

              return (
                <Animated.View
                  key={tx.id}
                  entering={FadeInUp.delay(Math.min(i * 30, 240)).duration(300)}
                  style={{ width: cardWidth, padding: 8 }}
                >
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: 'rgba(62,39,35,0.06)',
                      padding: 18,
                      height: '100%',
                      minHeight: 190,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      shadowColor: '#3E2723',
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <View>
                      {/* Top Row: Type Icon, Category & Amount */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 14,
                              backgroundColor: isIncome ? '#E8F5E9' : '#FFEBEE',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 10,
                              borderWidth: 1,
                              borderColor: isIncome ? 'rgba(46,125,50,0.18)' : 'rgba(211,47,47,0.18)',
                            }}
                          >
                            {isIncome ? (
                              <TrendingUp size={22} color="#2E7D32" strokeWidth={2.4} />
                            ) : (
                              <TrendingDown size={22} color="#D32F2F" strokeWidth={2.4} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}
                              numberOfLines={1}
                            >
                              {tx.category}
                            </Text>
                            <Text
                              style={{
                                fontFamily: 'Inter-Bold',
                                fontSize: 18,
                                color: isIncome ? '#2E7D32' : '#D32F2F',
                                marginTop: 1,
                              }}
                            >
                              {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>

                        <Pressable
                          onPress={() => handleDeleteTransaction(tx)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            backgroundColor: '#FFEBEE',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          hitSlop={6}
                        >
                          <Trash2 size={15} color="#D32F2F" strokeWidth={2} />
                        </Pressable>
                      </View>

                      {/* Description (if any) */}
                      {tx.description && (
                        <View style={{ backgroundColor: '#F5F5F0', padding: 8, borderRadius: 8, marginTop: 4 }}>
                          <Text
                            style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#6D4C41' }}
                            numberOfLines={2}
                          >
                            {tx.description}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Footer: User, Linked Crop, Date */}
                    <View
                      style={{
                        paddingTop: 10,
                        marginTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(62,39,35,0.05)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, marginRight: 6 }}>
                        <User size={13} color="#9E9189" />
                        <Text
                          style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#6D4C41' }}
                          numberOfLines={1}
                        >
                          {tx.profiles?.full_name || 'Grower'}
                        </Text>
                        {tx.crops?.crop_name && (
                          <Text
                            style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}
                            numberOfLines={1}
                          >
                            • {tx.crops.crop_name}
                          </Text>
                        )}
                      </View>

                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                        {tx.transaction_date}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
