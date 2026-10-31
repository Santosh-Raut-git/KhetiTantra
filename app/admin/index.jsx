import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdminStats, useAdminTransactions } from '@/lib/api/admin';
import {
  Shield,
  Users,
  Sprout,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

function AdminMetricCard({ title, value, icon, iconBg, valueColor, subtitle, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flex: 1,
        minWidth: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(62,39,35,0.06)',
        shadowColor: '#3E2723',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: iconBg || '#E8F5E9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        {subtitle && (
          <View style={{ backgroundColor: 'rgba(62,39,35,0.04)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#9E9189' }}>
              {subtitle}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#9E9189', marginBottom: 4 }}>
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter-Bold',
          fontSize: 26,
          color: valueColor || '#3E2723',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const { data: stats, isLoading, refetch } = useAdminStats();
  const { data: transactions, refetch: refetchTx } = useAdminTransactions();
  const recentActivity = transactions?.slice(0, 6) || [];

  const onRefresh = () => {
    refetch();
    refetchTx();
  };

  const netProfit = stats?.netProfit || 0;

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, width: '100%' }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
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
            marginBottom: 26,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(62,39,35,0.06)',
          }}
        >
          <View>
            {isMobile && (
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(62,39,35,0.05)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <ArrowLeft size={14} color="#6D4C41" />
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#6D4C41', marginLeft: 4 }}>
                  Back to App
                </Text>
              </Pressable>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Text
                style={{ fontFamily: 'Inter-Bold', fontSize: isMobile ? 24 : 30, color: '#3E2723' }}
              >
                Super Admin Overview
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(46,125,50,0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 999,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32', marginRight: 5 }} />
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#2E7D32' }}>
                  Live Node
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189' }}>
              Real-time platform telemetry, multi-district farmer accounts, and ledger cashflow
            </Text>
          </View>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.12)',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              shadowColor: '#3E2723',
              shadowOpacity: 0.03,
              shadowRadius: 4,
            }}
          >
            <ExternalLink size={16} color="#3E2723" strokeWidth={2} />
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#3E2723', marginLeft: 8 }}>
              Open Farmer/Retailer View
            </Text>
          </Pressable>
        </View>

        {/* 4 Metric Cards Strip across the top (full-width) */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 30,
          }}
        >
          <AdminMetricCard
            title="Total Registered Users"
            value={(stats?.totalUsers || 0).toString()}
            icon={<Users size={20} color="#2E7D32" strokeWidth={2.2} />}
            iconBg="#E8F5E9"
            subtitle="Platform users"
            onPress={() => router.push('/admin/users')}
          />
          <AdminMetricCard
            title="Recorded Crop Batches"
            value={(stats?.totalCrops || 0).toString()}
            icon={<Sprout size={20} color="#2E7D32" strokeWidth={2.2} />}
            iconBg="#E8F5E9"
            subtitle="All seasons"
            onPress={() => router.push('/admin/crops')}
          />
          <AdminMetricCard
            title="Active Harvest Cycles"
            value={(stats?.activeCrops || 0).toString()}
            valueColor="#F57F17"
            icon={<Clock size={20} color="#F57F17" strokeWidth={2.2} />}
            iconBg="#FFF8E1"
            subtitle="In progress"
            onPress={() => router.push('/admin/crops')}
          />
          <AdminMetricCard
            title="Ledger Transactions"
            value={(stats?.totalTransactions || 0).toString()}
            valueColor="#1565C0"
            icon={<Wallet size={20} color="#1565C0" strokeWidth={2.2} />}
            iconBg="#E3F2FD"
            subtitle="Global movements"
            onPress={() => router.push('/admin/transactions')}
          />
        </View>

        {/* 2-Column Responsive SaaS Body */}
        <View
          style={{
            flexDirection: isDesktop ? 'row' : 'column',
            gap: 28,
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Financial Performance & Quick Control Panels */}
          <View style={{ flex: 1, width: isDesktop ? undefined : '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Global Financial Statement Card */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: 'rgba(62,39,35,0.06)',
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(62,39,35,0.06)' }}>
                <View>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: '#3E2723' }}>
                    Financial Summary & Platform Volume
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189', marginTop: 2 }}>
                    Consolidated cashflow aggregated across all farmer ledger books
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: netProfit >= 0 ? '#E8F5E9' : '#FFEBEE',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 12,
                      color: netProfit >= 0 ? '#2E7D32' : '#D32F2F',
                    }}
                  >
                    {netProfit >= 0 ? 'Net Surplus' : 'Net Deficit'}
                  </Text>
                </View>
              </View>

              {/* 3 Revenue Metric Blocks */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                <View
                  style={{
                    flex: 1,
                    minWidth: 140,
                    backgroundColor: '#F9FBE7',
                    borderWidth: 1,
                    borderColor: 'rgba(46,125,50,0.15)',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <TrendingUp size={16} color="#2E7D32" strokeWidth={2.4} />
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
                      Gross Income
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: '#2E7D32' }}>
                    ₹{(stats?.totalIncome || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    minWidth: 140,
                    backgroundColor: '#FBE9E7',
                    borderWidth: 1,
                    borderColor: 'rgba(211,47,47,0.15)',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <TrendingDown size={16} color="#D32F2F" strokeWidth={2.4} />
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#D32F2F' }}>
                      Gross Expenses
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: '#D32F2F' }}>
                    ₹{(stats?.totalExpense || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    minWidth: 140,
                    backgroundColor: netProfit >= 0 ? '#E8F5E9' : '#FFEBEE',
                    borderWidth: 1,
                    borderColor: netProfit >= 0 ? 'rgba(46,125,50,0.2)' : 'rgba(211,47,47,0.2)',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Wallet size={16} color={netProfit >= 0 ? '#2E7D32' : '#D32F2F'} strokeWidth={2.4} />
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: netProfit >= 0 ? '#2E7D32' : '#D32F2F' }}>
                      Net Ecosystem
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 20,
                      color: netProfit >= 0 ? '#2E7D32' : '#D32F2F',
                    }}
                  >
                    {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Cashflow Progress Bar */}
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189' }}>
                    Income vs Expenses Ratio
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: '#3E2723' }}>
                    {((stats?.totalIncome || 0) + (stats?.totalExpense || 0)) > 0
                      ? `${Math.round(((stats?.totalIncome || 0) / ((stats?.totalIncome || 0) + (stats?.totalExpense || 0))) * 100)}% Inflow`
                      : '0% Recorded'}
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#FFCDD2', borderRadius: 4, overflow: 'hidden', flexDirection: 'row' }}>
                  <View
                    style={{
                      width: `${((stats?.totalIncome || 0) + (stats?.totalExpense || 0)) > 0
                        ? Math.min(100, Math.round(((stats?.totalIncome || 0) / ((stats?.totalIncome || 0) + (stats?.totalExpense || 0))) * 100))
                        : 50}%`,
                      backgroundColor: '#2E7D32',
                      height: '100%',
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Quick Navigation Control Panels */}
            <View>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723', marginBottom: 12 }}>
                Management Modules
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                <Pressable
                  onPress={() => router.push('/admin/users')}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(62,39,35,0.06)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={18} color="#2E7D32" strokeWidth={2.2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
                        User Directory
                      </Text>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189' }}>
                        Manage farmer & retailer accounts
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#9E9189" />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/admin/crops')}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(62,39,35,0.06)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' }}>
                      <Sprout size={18} color="#2E7D32" strokeWidth={2.2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
                        Crop Oversight
                      </Text>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189' }}>
                        Monitor active harvests and acreages
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#9E9189" />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/admin/transactions')}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(62,39,35,0.06)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' }}>
                      <Wallet size={18} color="#1565C0" strokeWidth={2.2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: '#3E2723' }}>
                        Platform Ledger
                      </Text>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189' }}>
                        Audit all income & expense movements
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#9E9189" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Right Column: Recent Activity Feed */}
          <View
            style={{
              width: isDesktop ? 400 : '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.06)',
              shadowColor: '#3E2723',
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(62,39,35,0.05)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Activity size={18} color="#2E7D32" strokeWidth={2.2} />
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: '#3E2723' }}>
                  Live Ledger Activity
                </Text>
              </View>
              <Pressable onPress={() => router.push('/admin/transactions')}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: '#2E7D32' }}>
                  View All
                </Text>
              </Pressable>
            </View>

            {recentActivity.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#9E9189' }}>
                  No transactions recorded yet on the platform.
                </Text>
              </View>
            ) : (
              <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentActivity.map((tx) => (
                  <View
                    key={tx.id}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: '#F5F5F0',
                      borderWidth: 1,
                      borderColor: 'rgba(62,39,35,0.04)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: tx.type === 'income' ? '#E8F5E9' : '#FFEBEE',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                        }}
                      >
                        {tx.type === 'income' ? (
                          <TrendingUp size={16} color="#2E7D32" strokeWidth={2.4} />
                        ) : (
                          <TrendingDown size={16} color="#D32F2F" strokeWidth={2.4} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#3E2723' }} numberOfLines={1}>
                          {tx.profiles?.full_name || 'Kheti User'}
                        </Text>
                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: '#9E9189', marginTop: 1 }}>
                          {tx.category} • {tx.crops?.crop_name || 'General'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontFamily: 'Inter-Bold',
                          fontSize: 13,
                          color: tx.type === 'income' ? '#2E7D32' : '#D32F2F',
                        }}
                      >
                        {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 10, color: '#9E9189', marginTop: 1 }}>
                        {tx.transaction_date}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => router.push('/admin/transactions')}
              style={{
                marginTop: 16,
                backgroundColor: 'rgba(46,125,50,0.08)',
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: '#2E7D32' }}>
                Open Global Ledger (All Records)
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
