import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useListing, useUpdateListing, useDeleteListing } from '@/lib/api/listings';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

  const isOwner = listing?.user_id === session?.user?.id;

  const handleMarkSold = () => {
    Alert.alert(
      'Mark as Sold',
      'This will remove your listing from the marketplace. Continue?',
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
  };

  const handleDelete = () => {
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
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-soil/5 md:max-w-2xl md:w-full md:self-center">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-soil/10"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#3E2723" strokeWidth={2} />
          </Pressable>
          <Text
            className="text-soil text-xl"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            Listing Detail
          </Text>
        </View>
        {isOwner && (
          <Pressable
            onPress={handleDelete}
            className="w-10 h-10 rounded-full bg-clay/10 items-center justify-center"
            hitSlop={8}
          >
            <Trash2 size={18} color="#D32F2F" strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-16 md:max-w-2xl md:w-full md:self-center md:py-8"
      >
        {/* Hero card */}
        <Animated.View entering={FadeInUp.delay(80).duration(400)}>
          <Card className="mb-5 items-center py-8">
            <View className="w-20 h-20 rounded-full bg-leaf/10 items-center justify-center mb-4">
              <Sprout size={40} color="#2E7D32" strokeWidth={1.5} />
            </View>
            <Text
              className="text-soil text-2xl mb-1"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              {listing.crop_type}
            </Text>
            <View className="flex-row items-center gap-2 mb-4">
              <View className="bg-soil/5 px-3 py-1 rounded-full">
                <Text
                  className="text-soil-muted text-sm"
                  style={{ fontFamily: 'Inter-Medium' }}
                >
                  {listing.category}
                </Text>
              </View>
              {isSold ? (
                <View className="bg-clay/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                  <XCircle size={12} color="#D32F2F" />
                  <Text
                    className="text-clay text-sm"
                    style={{ fontFamily: 'Inter-Medium' }}
                  >
                    Sold
                  </Text>
                </View>
              ) : (
                <View className="bg-leaf/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                  <CheckCircle size={12} color="#2E7D32" />
                  <Text
                    className="text-leaf text-sm"
                    style={{ fontFamily: 'Inter-Medium' }}
                  >
                    Active
                  </Text>
                </View>
              )}
            </View>

            {/* Price block */}
            <View className="flex-row gap-6">
              <View className="items-center">
                <Text
                  className="text-soil-muted text-xs mb-0.5"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  Price / {unitLabel}
                </Text>
                <Text
                  className="text-leaf"
                  style={{ fontFamily: 'Inter-Bold', fontSize: 22 }}
                >
                  ₹{Number(listing.price_per_unit).toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="w-px bg-soil/10" />
              <View className="items-center">
                <Text
                  className="text-soil-muted text-xs mb-0.5"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  Available
                </Text>
                <Text
                  className="text-soil"
                  style={{ fontFamily: 'Inter-Bold', fontSize: 22 }}
                >
                  {Number(listing.quantity_available).toLocaleString('en-IN')}{' '}
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14 }}>
                    {unitLabel}
                  </Text>
                </Text>
              </View>
            </View>

            {totalValue > 0 && (
              <View className="mt-4 bg-leaf/5 border border-leaf/15 rounded-xl px-5 py-2">
                <Text
                  className="text-soil-muted text-xs text-center"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  Estimated total value
                </Text>
                <Text
                  className="text-leaf text-center"
                  style={{ fontFamily: 'Inter-Bold', fontSize: 18 }}
                >
                  ₹{totalValue.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInUp.delay(160).duration(400)}>
          <Text
            className="text-soil text-base mb-3 px-1"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            Listing Info
          </Text>
          <Card className="mb-5">
            <DetailRow
              icon={<Tag size={16} color="#9E9189" strokeWidth={2} />}
              label="Category"
              value={listing.category}
            />
            <DetailRow
              icon={<Package size={16} color="#9E9189" strokeWidth={2} />}
              label="Quantity"
              value={`${Number(listing.quantity_available).toLocaleString('en-IN')} ${unitLabel}`}
            />
            <DetailRow
              icon={<Calendar size={16} color="#9E9189" strokeWidth={2} />}
              label="Harvest Date"
              value={listing.harvest_date}
            />
            <DetailRow
              icon={<FileText size={16} color="#9E9189" strokeWidth={2} />}
              label="Description"
              value={listing.description}
            />
          </Card>
        </Animated.View>

        {/* Seller info */}
        <Animated.View entering={FadeInUp.delay(240).duration(400)}>
          <Text
            className="text-soil text-base mb-3 px-1"
            style={{ fontFamily: 'Inter-Bold' }}
          >
            Seller
          </Text>
          <Card className="mb-6">
            <DetailRow
              icon={<User size={16} color="#9E9189" strokeWidth={2} />}
              label="Name"
              value={listing.profiles?.full_name}
            />
            <DetailRow
              icon={<MapPin size={16} color="#9E9189" strokeWidth={2} />}
              label="Location"
              value={
                listing.profiles?.village
                  ? `${listing.profiles.village}, ${listing.profiles.district}`
                  : listing.profiles?.district
              }
            />
            <DetailRow
              icon={<Phone size={16} color="#9E9189" strokeWidth={2} />}
              label="Phone"
              value={listing.profiles?.phone}
            />
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} className="gap-3">
          {/* Contact seller — visible to non-owners */}
          {!isOwner && listing.profiles?.phone && (
            <Button label="Call Seller" onPress={handleCall} />
          )}

          {/* Owner actions */}
          {isOwner && !isSold && (
            <Button
              label={updateListing.isPending ? 'Updating…' : 'Mark as Sold'}
              variant="secondary"
              onPress={handleMarkSold}
              disabled={updateListing.isPending}
            />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
