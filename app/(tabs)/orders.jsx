import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Sprout,
  Store,
  ChevronRight,
} from 'lucide-react-native';
import { useOrders, useUpdateOrderStatus } from '@/lib/api/orders';
import { useStore } from '@/lib/store';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Confirmation',
    bg: '#FFF8E1',
    text: '#B45309',
    icon: Clock,
    iconColor: '#B45309',
    step: 1,
  },
  confirmed: {
    label: 'Confirmed & Packing',
    bg: '#E3F2FD',
    text: '#1565C0',
    icon: Package,
    iconColor: '#1565C0',
    step: 2,
  },
  dispatched: {
    label: 'In Transit / Dispatched',
    bg: '#F3E8FF',
    text: '#6B21A8',
    icon: Truck,
    iconColor: '#6B21A8',
    step: 3,
  },
  delivered: {
    label: 'Delivered & Settled',
    bg: '#E8F5E9',
    text: '#2E7D32',
    icon: CheckCircle2,
    iconColor: '#2E7D32',
    step: 4,
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#FFEBEE',
    text: '#D32F2F',
    icon: XCircle,
    iconColor: '#D32F2F',
    step: 0,
  },
};

const FILTER_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active Pipeline' },
  { id: 'dispatched', label: 'In Transit' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

// ── Standard Metric Card matching Crops & Ledger ──────────────────────────
function MetricCard({ title, value, icon, iconBg, isMobile }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: isMobile ? 14 : 16,
        padding: isMobile ? 12 : 20,
        borderWidth: 1,
        borderColor: 'rgba(62,39,35,0.06)',
        shadowColor: '#3E2723',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        width: isMobile ? '47%' : undefined,
        flex: isMobile ? 1 : 1,
        minWidth: isMobile ? '45%' : 160,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? 4 : 8,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: isMobile ? 11 : 12,
            color: '#9E9189',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View
          style={{
            width: isMobile ? 28 : 32,
            height: isMobile ? 28 : 32,
            borderRadius: 8,
            backgroundColor: iconBg || '#E8F5E9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      </View>
      <Text
        style={{
          fontFamily: 'Inter-Bold',
          fontSize: isMobile ? 18 : 24,
          color: '#3E2723',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Progress Stepper Visual ────────────────────────────────────────────────
function OrderProgressStepper({ currentStatus }) {
  const steps = [
    { key: 'pending', title: 'Placed' },
    { key: 'confirmed', title: 'Confirmed' },
    { key: 'dispatched', title: 'Dispatched' },
    { key: 'delivered', title: 'Delivered' },
  ];

  if (currentStatus === 'cancelled') {
    return (
      <View
        style={{
          backgroundColor: '#FFEBEE',
          borderWidth: 1,
          borderColor: 'rgba(211,47,47,0.25)',
          borderRadius: 12,
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginVertical: 10,
        }}
      >
        <XCircle size={14} color="#D32F2F" />
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 12,
            color: '#D32F2F',
          }}
        >
          This wholesale procurement order has been cancelled.
        </Text>
      </View>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <View
      style={{
        backgroundColor: '#F5F5F0',
        borderRadius: 12,
        padding: 12,
        marginVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {steps.map((step, idx) => {
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={step.key}>
              <View style={{ alignItems: 'center', minWidth: 55 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: isDone ? '#2E7D32' : '#E8E4DF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={12} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#9E9189',
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: isCurrent ? 'Inter-Bold' : 'Inter-Medium',
                    fontSize: 10,
                    color: isCurrent ? '#2E7D32' : isDone ? '#3E2723' : '#9E9189',
                  }}
                >
                  {step.title}
                </Text>
              </View>

              {idx < steps.length - 1 && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: idx < activeIndex ? '#2E7D32' : '#E8E4DF',
                    marginBottom: 14,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ── Individual Order Card matching KhetiTantra design language ────────────
function OrderItemCard({ order, isRetailer, onUpdateStatus, isUpdating, cardWidth, index }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const counterpartyName = isRetailer
    ? order.farmer?.full_name || 'Grower'
    : order.retailer?.full_name || 'Wholesale Buyer';

  const counterpartyPhone = isRetailer
    ? order.farmer?.phone
    : order.retailer?.phone || order.delivery_phone;

  const counterpartyLocation = isRetailer
    ? [order.farmer?.village, order.farmer?.district].filter(Boolean).join(', ')
    : order.delivery_address;

  const handleCall = () => {
    if (counterpartyPhone) {
      const clean = counterpartyPhone.replace(/[^0-9+]/g, '');
      if (Platform.OS === 'web') {
        window.open(`tel:${clean}`);
      } else {
        Linking.openURL(`tel:${clean}`);
      }
    } else {
      if (Platform.OS === 'web') alert('Phone contact is not available.');
      else Alert.alert('Notice', 'Phone contact is not available.');
    }
  };

  const handleFarmerDeliver = () => {
    const confirmDeliver = () => {
      onUpdateStatus({
        orderId: order.id,
        nextStatus: 'delivered',
        currentOrder: order,
      });
    };

    const confirmMsg = `Confirming delivery of ${order.quantity} ${order.unit} ${order.crop_name}.\n\nThis will automatically record ₹${Number(order.total_amount).toLocaleString('en-IN')} as income in your Farm Ledger!`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) confirmDeliver();
    } else {
      Alert.alert('Confirm Produce Delivery', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm & Record Income', onPress: confirmDeliver },
      ]);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 30, 240)).duration(300)}
      style={{ width: cardWidth, padding: 8 }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(62,39,35,0.06)',
          padding: 20,
          shadowColor: '#3E2723',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <View>
          {/* Top Row: Ref ID, Date, and Status Pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 12,
                  color: '#9E9189',
                  letterSpacing: 0.5,
                }}
              >
                #ORD-{order.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={{ fontSize: 12, color: '#9E9189' }}>•</Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#9E9189' }}>
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: cfg.bg,
                paddingHorizontal: 9,
                paddingVertical: 3.5,
                borderRadius: 999,
                gap: 5,
              }}
            >
              <StatusIcon size={12} color={cfg.text} />
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 11,
                  color: cfg.text,
                }}
              >
                {cfg.label}
              </Text>
            </View>
          </View>

          {/* Produce & Financial Metrics */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(62,39,35,0.05)',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#E8F5E9',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(46,125,50,0.15)',
              }}
            >
              <Sprout size={22} color="#2E7D32" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 17,
                  color: '#3E2723',
                }}
                numberOfLines={1}
              >
                {order.crop_name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 12,
                  color: '#9E9189',
                  marginTop: 1,
                }}
              >
                {order.category} • {order.quantity} {order.unit} @ ₹
                {Number(order.unit_price).toLocaleString('en-IN')}/{order.unit}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 18,
                  color: '#2E7D32',
                }}
              >
                ₹{Number(order.total_amount).toLocaleString('en-IN')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 10,
                  color: '#9E9189',
                }}
              >
                Wholesale Value
              </Text>
            </View>
          </View>

          {/* Stepper */}
          <OrderProgressStepper currentStatus={order.status} />

          {/* Counterparty & Logistics Row */}
          <View
            style={{
              backgroundColor: '#F5F5F0',
              borderRadius: 14,
              padding: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: 'rgba(62,39,35,0.04)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 11,
                  color: '#9E9189',
                }}
              >
                {isRetailer ? 'Farmer / Grower:' : 'Buyer / Retailer:'}
              </Text>
              {counterpartyPhone && (
                <Pressable
                  onPress={handleCall}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#E8F5E9',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    gap: 4,
                  }}
                >
                  <Phone size={11} color="#2E7D32" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 11,
                      color: '#2E7D32',
                    }}
                  >
                    Call
                  </Text>
                </Pressable>
              )}
            </View>

            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 14,
                color: '#3E2723',
              }}
            >
              {counterpartyName}
            </Text>

            {counterpartyLocation ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <MapPin size={12} color="#9E9189" />
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 12,
                    color: '#6D4C41',
                    flex: 1,
                  }}
                  numberOfLines={2}
                >
                  {counterpartyLocation}
                </Text>
              </View>
            ) : null}

            {order.notes ? (
              <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(62,39,35,0.06)' }}>
                <Text
                  style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 11,
                    color: '#9E9189',
                    fontStyle: 'italic',
                  }}
                >
                  “{order.notes}”
                </Text>
              </View>
            ) : null}
          </View>

          {/* Ledger Sync Notice if Delivered */}
          {order.status === 'delivered' && (
            <View
              style={{
                backgroundColor: '#E8F5E9',
                borderRadius: 10,
                padding: 10,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: 'rgba(46,125,50,0.15)',
              }}
            >
              <CheckCircle2 size={15} color="#2E7D32" />
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 11,
                  color: '#2E7D32',
                  flex: 1,
                }}
              >
                {isRetailer
                  ? 'Wholesale procurement settled successfully.'
                  : 'Payment auto-synced to your Farm Ledger under Income.'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Controls */}
        <View style={{ paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Farmer Workflow */}
          {!isRetailer && (
            <>
              {order.status === 'pending' && (
                <>
                  <Pressable
                    onPress={() =>
                      onUpdateStatus({
                        orderId: order.id,
                        nextStatus: 'cancelled',
                        currentOrder: order,
                      })
                    }
                    disabled={isUpdating}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: '#FFEBEE',
                      borderWidth: 1,
                      borderColor: 'rgba(211,47,47,0.25)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter-Bold',
                        fontSize: 12,
                        color: '#D32F2F',
                      }}
                    >
                      Decline
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      onUpdateStatus({
                        orderId: order.id,
                        nextStatus: 'confirmed',
                        currentOrder: order,
                      })
                    }
                    disabled={isUpdating}
                    style={{
                      flex: 2,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: '#2E7D32',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#2E7D32',
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter-Bold',
                        fontSize: 12,
                        color: '#FFFFFF',
                      }}
                    >
                      Accept & Confirm
                    </Text>
                  </Pressable>
                </>
              )}

              {order.status === 'confirmed' && (
                <Pressable
                  onPress={() =>
                    onUpdateStatus({
                      orderId: order.id,
                      nextStatus: 'dispatched',
                      currentOrder: order,
                    })
                  }
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: '#1565C0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Truck size={15} color="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 12,
                      color: '#FFFFFF',
                    }}
                  >
                    Dispatch Lot (Mark In Transit)
                  </Text>
                </Pressable>
              )}

              {order.status === 'dispatched' && (
                <Pressable
                  onPress={handleFarmerDeliver}
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: '#2E7D32',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    shadowColor: '#2E7D32',
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                  }}
                >
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 12,
                      color: '#FFFFFF',
                    }}
                  >
                    Mark Delivered & Sync to Ledger
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {/* Retailer Workflow */}
          {isRetailer && (
            <>
              {order.status === 'pending' && (
                <Pressable
                  onPress={() =>
                    onUpdateStatus({
                      orderId: order.id,
                      nextStatus: 'cancelled',
                      currentOrder: order,
                    })
                  }
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: '#FFEBEE',
                    borderWidth: 1,
                    borderColor: 'rgba(211,47,47,0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 12,
                      color: '#D32F2F',
                    }}
                  >
                    Cancel Purchase Order
                  </Text>
                </Pressable>
              )}

              {order.status === 'dispatched' && (
                <Pressable
                  onPress={() =>
                    onUpdateStatus({
                      orderId: order.id,
                      nextStatus: 'delivered',
                      currentOrder: order,
                    })
                  }
                  disabled={isUpdating}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: '#2E7D32',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    shadowColor: '#2E7D32',
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                  }}
                >
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: 'Inter-Bold',
                      fontSize: 12,
                      color: '#FFFFFF',
                    }}
                  >
                    Confirm Delivery Received
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main Orders Screen ─────────────────────────────────────────────────────
export default function OrdersScreen() {
  const router = useRouter();
  const { session, profile } = useStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  const role = profile?.role || session?.user?.user_metadata?.role || 'farmer';
  const isRetailer = role === 'retailer';

  const [activeTab, setActiveTab] = useState('all');

  const { data: orders = [], isLoading, refetch, isRefetching } = useOrders({
    role,
    statusFilter: activeTab,
  });

  const updateOrderStatus = useUpdateOrderStatus();

  // Metrics calculation across all user orders
  const { data: allUserOrders = [] } = useOrders({ role, statusFilter: 'all' });

  const metrics = useMemo(() => {
    const total = allUserOrders.length;
    const pending = allUserOrders.filter((o) => o.status === 'pending').length;
    const inTransit = allUserOrders.filter((o) => o.status === 'dispatched').length;
    const delivered = allUserOrders.filter((o) => o.status === 'delivered').length;
    return { total, pending, inTransit, delivered };
  }, [allUserOrders]);

  const numColumns = width >= 1200 ? 2 : 1;
  const cardWidth = `${100 / numColumns}%`;

  const handleUpdateStatus = ({ orderId, nextStatus, currentOrder }) => {
    updateOrderStatus.mutate({ orderId, nextStatus, currentOrder });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 80,
          paddingHorizontal: width >= 768 ? 32 : 16,
          paddingTop: 20,
          flexGrow: 1,
        }}
        contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Header Banner - Standardized with My Crops & Farm Ledger */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 28,
            paddingBottom: 22,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(62,39,35,0.06)',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 30,
                color: '#3E2723',
              }}
            >
              {isRetailer ? 'Supply Chain Orders' : 'Produce Sales & Orders'}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 14,
                color: '#9E9189',
                marginTop: 3,
              }}
            >
              {isRetailer
                ? 'Track direct farm-to-store deliveries, supplier contracts, and payment releases'
                : 'Fulfill wholesale purchase orders from regional buyers and sync sales to your farm ledger'}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/marketplace')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#2E7D32',
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 12,
              shadowColor: '#2E7D32',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              gap: 8,
            }}
          >
            <Store size={18} color="#FFFFFF" strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                color: '#FFFFFF',
                fontSize: 14,
              }}
            >
              Browse Marketplace
            </Text>
          </Pressable>
        </View>

        {/* 4 Overview Metric Cards - Standardized with My Crops & Farm Ledger */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: isMobile ? 10 : 16,
            marginBottom: isMobile ? 20 : 32,
          }}
        >
          <MetricCard
            title="Total Orders"
            value={metrics.total.toString()}
            icon={<Package size={isMobile ? 14 : 16} color="#2E7D32" strokeWidth={2} />}
            iconBg="#E8F5E9"
            isMobile={isMobile}
          />
          <MetricCard
            title="Pending Action"
            value={metrics.pending.toString()}
            icon={<Clock size={isMobile ? 14 : 16} color="#F57F17" strokeWidth={2} />}
            iconBg="#FFF8E1"
            isMobile={isMobile}
          />
          <MetricCard
            title="In Transit"
            value={metrics.inTransit.toString()}
            icon={<Truck size={isMobile ? 14 : 16} color="#1565C0" strokeWidth={2} />}
            iconBg="#E3F2FD"
            isMobile={isMobile}
          />
          <MetricCard
            title="Delivered"
            value={metrics.delivered.toString()}
            icon={<CheckCircle2 size={isMobile ? 14 : 16} color="#2E7D32" strokeWidth={2} />}
            iconBg="#E8F5E9"
            isMobile={isMobile}
          />
        </View>

        {/* Filter Chips - Standardized with KhetiTantra Category Chips */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
          }}
        >
          {FILTER_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: active ? '#2E7D32' : '#FFFFFF',
                  borderColor: active ? '#2E7D32' : 'rgba(62,39,35,0.1)',
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

        {/* Order Cards Grid or Empty State */}
        {isLoading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 12,
                color: '#9E9189',
                marginTop: 12,
              }}
            >
              Loading supply chain orders...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package size={36} color="#2E7D32" strokeWidth={1.8} />}
            title={
              activeTab === 'all'
                ? 'No orders found'
                : `No ${activeTab} orders`
            }
            description={
              isRetailer
                ? 'Browse active crop listings on the marketplace to connect directly with farmers and initiate wholesale supply contracts.'
                : 'Publish produce listings on the marketplace to receive wholesale purchase orders directly from verified regional buyers.'
            }
            actionLabel={
              isRetailer ? 'Explore Marketplace' : 'List Harvest Produce'
            }
            onAction={() =>
              router.push(
                isRetailer ? '/(tabs)/marketplace' : '/marketplace/new',
              )
            }
          />
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -8,
            }}
          >
            {orders.map((order, idx) => (
              <OrderItemCard
                key={order.id}
                order={order}
                index={idx}
                cardWidth={cardWidth}
                isRetailer={isRetailer}
                onUpdateStatus={handleUpdateStatus}
                isUpdating={updateOrderStatus.isPending}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
