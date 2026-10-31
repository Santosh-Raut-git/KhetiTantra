import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useListing, useUpdateListing, useDeleteListing } from '@/lib/api/listings';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Trash2,
  Sprout,
  MapPin,
  Phone,
  User,
  Tag,
  Package,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Calculator,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const UNIT_LABELS = {
  quintal: 'quintal',
  kg: 'kg',
  ton: 'ton',
  dozen: 'dozen',
  piece: 'piece',
};

function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start py-3.5 border-b border-soil/5">
      <View className="w-8 items-center mt-0.5 mr-3">{icon}</View>
      <View className="flex-1">
        <Text
          className="text-soil-muted text-xs mb-0.5"
          style={{ fontFamily: 'Inter-Regular' }}
        >
          {label}
        </Text>
        <Text
          className="text-soil text-base"
          style={{ fontFamily: 'Inter-Medium' }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useStore();

  const { data: listing, isLoading } = useListing(id);
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const [procureQty, setProcureQty] = useState('');

  const isOwner = listing?.user_id === session?.user?.id;

  const handleMarkSold = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'This will mark your listing as sold and remove it from the active marketplace feed. Continue?',
      );
      if (confirmed) {
        updateListing.mutate(
          { id, status: 'sold' },
          { onSuccess: () => router.back() },
        );
      }
    } else {
      Alert.alert(
        'Mark as Sold',
        'This will mark your listing as sold and remove it from the active marketplace feed. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Sold',
            onPress: () =>
              updateListing.mutate(
                { id, status: 'sold' },
                { onSuccess: () => router.back() },
              ),
          },
        ],
      );
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to permanently delete this produce listing?',
      );
      if (confirmed) {
        deleteListing.mutate(id, {
          onSuccess: () => router.back(),
          onError: (err) => alert('Error deleting listing: ' + err.message),
        });
      }
    } else {
      Alert.alert(
        'Delete Listing',
        'Are you sure you want to permanently delete this listing?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () =>
              deleteListing.mutate(id, {
                onSuccess: () => router.back(),
                onError: (err) => Alert.alert('Error', err.message),
              }),
          },
        ],
      );
    }
  };

  const handleCall = () => {
    const phone = listing?.profiles?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (isLoading || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  const unitLabel = UNIT_LABELS[listing.unit] || listing.unit;
  const totalValue =
    Number(listing.price_per_unit) * Number(listing.quantity_available);
  const isSold = listing.status === 'sold';

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
                  {listing.crop_type}
                </Text>
                {isSold ? (
                  <View className="bg-clay/10 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                    <XCircle size={13} color="#D32F2F" />
                    <Text className="text-clay text-xs font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      Lot Sold
                    </Text>
                  </View>
                ) : (
                  <View className="bg-leaf/10 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                    <CheckCircle size={13} color="#2E7D32" />
                    <Text className="text-leaf text-xs font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      Active Lot
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="text-soil-muted text-xs lg:text-sm mt-0.5"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                Wholesale Lot #{id.slice(0, 8)} • Category: {listing.category}
              </Text>
            </View>
          </View>

          {isOwner && (
            <View className="flex-row items-center gap-3">
              {!isSold && (
                <Pressable
                  onPress={handleMarkSold}
                  className="flex-row items-center bg-sand/80 border border-soil/15 px-4 py-2.5 rounded-xl hover:bg-sand"
                  style={{ minHeight: 40 }}
                >
                  <CheckCircle2 size={16} color="#3E2723" strokeWidth={2} />
                  <Text className="text-soil font-bold ml-2 text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    Mark as Sold
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleDelete}
                className="flex-row items-center bg-clay/10 border border-clay/20 px-4 py-2.5 rounded-xl hover:bg-clay/20"
                style={{ minHeight: 40 }}
              >
                <Trash2 size={16} color="#D32F2F" strokeWidth={2} />
                <Text className="text-clay font-bold ml-2 text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 2-Column Responsive Body */}
        <View className="flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Lot Hero & Specifications */}
          <View className="flex-1 w-full flex-col gap-6">
            {/* Hero Commercial Card */}
            <Animated.View entering={FadeInUp.duration(400)}>
              <View
                className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center gap-4 mb-6 pb-6 border-b border-soil/5">
                  <View className="w-16 h-16 rounded-2xl bg-leaf/10 items-center justify-center border border-leaf/20">
                    <Sprout size={32} color="#2E7D32" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      {listing.crop_type}
                    </Text>
                    <Text className="text-soil-muted text-sm mt-0.5" style={{ fontFamily: 'Inter-Regular' }}>
                      Category: {listing.category}
                    </Text>
                  </View>
                </View>

                {/* Price & Quantity Large Metrics */}
                <View className="flex-row flex-wrap gap-4 mb-6">
                  <View className="flex-1 min-w-[150px] bg-sand/60 rounded-xl p-4 border border-soil/5">
                    <Text className="text-soil-muted text-xs mb-1" style={{ fontFamily: 'Inter-Regular' }}>
                      Wholesale Price
                    </Text>
                    <Text className="text-leaf text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      ₹{Number(listing.price_per_unit).toLocaleString('en-IN')}
                      <Text className="text-soil-muted text-xs font-normal"> /{unitLabel}</Text>
                    </Text>
                  </View>

                  <View className="flex-1 min-w-[150px] bg-sand/60 rounded-xl p-4 border border-soil/5">
                    <Text className="text-soil-muted text-xs mb-1" style={{ fontFamily: 'Inter-Regular' }}>
                      Available Quantity
                    </Text>
                    <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      {Number(listing.quantity_available).toLocaleString('en-IN')}{' '}
                      <Text className="text-soil-muted text-sm font-normal">{unitLabel}</Text>
                    </Text>
                  </View>

                  {totalValue > 0 && (
                    <View className="flex-1 min-w-[150px] bg-leaf/10 rounded-xl p-4 border border-leaf/20">
                      <Text className="text-leaf text-xs mb-1 font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                        Gross Lot Valuation
                      </Text>
                      <Text className="text-leaf text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                        ₹{totalValue.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Detailed Information Grid */}
                <Text className="text-soil text-base font-bold mb-3" style={{ fontFamily: 'Inter-Bold' }}>
                  Batch Parameters & Harvesting
                </Text>

                <View className="bg-sand/40 rounded-xl border border-soil/5 divide-y divide-soil/5">
                  <DetailRow
                    icon={<Tag size={16} color="#9E9189" strokeWidth={2} />}
                    label="Commodity Category"
                    value={listing.category}
                  />
                  <DetailRow
                    icon={<Package size={16} color="#9E9189" strokeWidth={2} />}
                    label="Volume"
                    value={`${Number(listing.quantity_available).toLocaleString('en-IN')} ${unitLabel}`}
                  />
                  <DetailRow
                    icon={<Calendar size={16} color="#9E9189" strokeWidth={2} />}
                    label="Harvest Timestamp"
                    value={listing.harvest_date || 'Harvest ready on order'}
                  />
                  <DetailRow
                    icon={<FileText size={16} color="#9E9189" strokeWidth={2} />}
                    label="Description & Pickup Terms"
                    value={listing.description || 'No special pickup conditions specified. Standard farm gate handover.'}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Right Column: Seller Profile & Wholesale Trade Action (~380px) */}
          <View className="w-full lg:w-96 shrink-0 flex-col gap-6">
            {/* Seller Contact Card */}
            <View
              className="bg-surface rounded-2xl p-6 border border-soil/5 shadow-sm"
              style={{
                shadowColor: '#3E2723',
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <Text className="text-soil-muted text-xs uppercase tracking-wider font-semibold mb-4 pb-3 border-b border-soil/5" style={{ fontFamily: 'Inter-Medium' }}>
                Verified Producer
              </Text>

              <View className="flex-row items-center gap-3 mb-5">
                <View className="w-12 h-12 rounded-full bg-sand items-center justify-center border border-soil/10">
                  <User size={22} color="#3E2723" />
                </View>
                <View className="flex-1">
                  <Text className="text-soil text-base font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                    {listing.profiles?.full_name || 'Farmer'}
                  </Text>
                  <Text className="text-soil-muted text-xs flex-row items-center" style={{ fontFamily: 'Inter-Regular' }}>
                    <MapPin size={12} color="#9E9189" />{' '}
                    {listing.profiles?.village
                      ? `${listing.profiles.village}, ${listing.profiles.district}`
                      : listing.profiles?.district || 'Location shared upon inquiry'}
                  </Text>
                </View>
              </View>

              {!isOwner && (
                <View className="pt-2">
                  {listing.profiles?.phone ? (
                    <Button
                      label={`Call Seller (${listing.profiles.phone})`}
                      icon={<Phone size={16} color="#FFFFFF" />}
                      onPress={handleCall}
                      className="w-full"
                    />
                  ) : (
                    <View className="bg-sand/60 p-3 rounded-xl border border-soil/10">
                      <Text className="text-soil-muted text-xs text-center" style={{ fontFamily: 'Inter-Regular' }}>
                        Seller phone contact not publicly published.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Wholesale Trade Assurance Callout */}
            <View className="bg-leaf/5 border border-leaf/15 rounded-2xl p-5 flex-col gap-2.5">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={16} color="#2E7D32" />
                <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                  Direct Farm Trading
                </Text>
              </View>
              <Text className="text-soil-muted text-xs leading-5" style={{ fontFamily: 'Inter-Regular' }}>
                All listings represent physical crops held by registered growers. Inspect produce samples on-site before executing final wire transfer or mandi settlement.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
