import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCreateListing } from '@/lib/api/listings';
import { useCrops } from '@/lib/api/crops';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Sprout,
  DollarSign,
  Package,
  Calendar,
  Sparkles,
  ShoppingBag,
  Info,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const CATEGORY_OPTIONS = [
  { label: 'Vegetables', value: 'Vegetables' },
  { label: 'Fruits', value: 'Fruits' },
  { label: 'Grains & Cereals', value: 'Grains' },
  { label: 'Pulses & Legumes', value: 'Pulses' },
  { label: 'Spices & Condiments', value: 'Spices' },
  { label: 'Other Farm Produce', value: 'Other' },
];

const UNIT_OPTIONS = [
  { label: 'Quintal (qtl)', value: 'quintal' },
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Metric Ton', value: 'ton' },
  { label: 'Dozen', value: 'dozen' },
  { label: 'Piece', value: 'piece' },
];

function validate(form) {
  const errors = {};
  if (!form.crop_type.trim()) errors.crop_type = 'Crop name is required';
  if (!form.category) errors.category = 'Select a category';
  if (
    !form.price_per_unit ||
    isNaN(Number(form.price_per_unit)) ||
    Number(form.price_per_unit) <= 0
  )
    errors.price_per_unit = 'Enter a valid positive price';
  if (
    !form.quantity_available ||
    isNaN(Number(form.quantity_available)) ||
    Number(form.quantity_available) <= 0
  )
    errors.quantity_available = 'Enter a valid available quantity';
  if (!form.unit) errors.unit = 'Select a unit';
  return errors;
}

export default function NewListingScreen() {
  const router = useRouter();
  const { session } = useStore();
  const { data: crops } = useCrops();
  const createListing = useCreateListing();

  const [form, setForm] = useState({
    crop_type: '',
    category: '',
    price_per_unit: '',
    quantity_available: '',
    unit: 'quintal',
    description: '',
    harvest_date: '',
    linked_crop_id: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (submitted) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const cropOptions = [
    { label: 'Not linked to farm cycle', value: '' },
    ...(crops?.map((c) => ({ label: `${c.crop_name} (${c.season})`, value: c.id })) || []),
  ];

  const handleSubmit = async () => {
    setSubmitted(true);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      await createListing.mutateAsync({
        user_id: session.user.id,
        crop_type: form.crop_type.trim(),
        category: form.category,
        price_per_unit: Number(form.price_per_unit),
        quantity_available: Number(form.quantity_available),
        unit: form.unit,
        description: form.description.trim() || null,
        harvest_date: form.harvest_date.trim() || null,
        linked_crop_id: form.linked_crop_id || null,
        status: 'active',
      });
      router.back();
    } catch (err) {
      console.error('Create listing error:', err);
    }
  };

  const totalLotValue =
    Number(form.price_per_unit || 0) * Number(form.quantity_available || 0);

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60, width: '100%' }}
          contentContainerClassName="w-full px-5 md:px-8 lg:px-10 xl:px-12 pt-6"
        >
          {/* Top Breadcrumb Navigation */}
          <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-soil/5">
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-xl bg-surface items-center justify-center border border-soil/10 hover:bg-surface/80"
                hitSlop={8}
              >
                <ArrowLeft size={18} color="#3E2723" strokeWidth={2.2} />
              </Pressable>
              <View>
                <Text
                  className="text-soil text-2xl lg:text-3xl font-bold"
                  style={{ fontFamily: 'Inter-Bold' }}
                >
                  Publish Produce Listing
                </Text>
                <Text
                  className="text-soil-muted text-xs lg:text-sm mt-0.5"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  Make your farm lot visible to agricultural buyers, aggregators, and mandis
                </Text>
              </View>
            </View>
          </View>

          {/* 2-Column Responsive SaaS Body */}
          <View className="flex-col lg:flex-row gap-8 items-start">
            {/* Left Column: Lot Setup Forms */}
            <View className="flex-1 w-full flex-col gap-6">
              {/* Card 1: Crop Identity */}
              <View
                className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center gap-3 mb-6 pb-4 border-b border-soil/5">
                  <View className="w-10 h-10 rounded-xl bg-leaf/10 items-center justify-center border border-leaf/15">
                    <Sprout size={20} color="#2E7D32" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      Produce Specifications
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Identify your crop and associate it with your farm batch
                    </Text>
                  </View>
                </View>

                <View className="flex-col gap-4">
                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Input
                        label="Crop Name *"
                        placeholder="e.g. Basmati Paddy, Hybrid Tomato"
                        value={form.crop_type}
                        onChangeText={(v) => set('crop_type', v)}
                        error={errors.crop_type}
                        autoCapitalize="words"
                      />
                    </View>
                    <View className="flex-1">
                      <Select
                        label="Category *"
                        value={form.category}
                        onValueChange={(v) => set('category', v)}
                        options={CATEGORY_OPTIONS}
                        placeholder="Select commodity category"
                        error={errors.category}
                      />
                    </View>
                  </View>

                  <Select
                    label="Link to My Farm Crop (Optional)"
                    value={form.linked_crop_id}
                    onValueChange={(v) => set('linked_crop_id', v)}
                    options={cropOptions}
                    placeholder="Link to an active batch in your farm"
                  />
                </View>
              </View>

              {/* Card 2: Pricing & Volume */}
              <View
                className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center gap-3 mb-6 pb-4 border-b border-soil/5">
                  <View className="w-10 h-10 rounded-xl bg-harvest/10 items-center justify-center border border-harvest/15">
                    <DollarSign size={20} color="#F57F17" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      Pricing & Commercial Volume
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Set your wholesale ask price and available inventory
                    </Text>
                  </View>
                </View>

                <View className="flex-col gap-4">
                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Input
                        label="Price per Unit (₹) *"
                        placeholder="e.g. 2400"
                        value={form.price_per_unit}
                        onChangeText={(v) => set('price_per_unit', v)}
                        keyboardType="numeric"
                        error={errors.price_per_unit}
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        label="Quantity Available *"
                        placeholder="e.g. 50"
                        value={form.quantity_available}
                        onChangeText={(v) => set('quantity_available', v)}
                        keyboardType="numeric"
                        error={errors.quantity_available}
                      />
                    </View>
                    <View className="flex-1">
                      <Select
                        label="Measurement Unit *"
                        value={form.unit}
                        onValueChange={(v) => set('unit', v)}
                        options={UNIT_OPTIONS}
                        placeholder="Select unit"
                        error={errors.unit}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 3: Logistics & Notes */}
              <View
                className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center gap-3 mb-6 pb-4 border-b border-soil/5">
                  <View className="w-10 h-10 rounded-xl bg-soil/10 items-center justify-center border border-soil/15">
                    <Calendar size={20} color="#3E2723" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      Harvest Timing & Quality Details
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Pickup instructions, moisture grading, and organic certifications
                    </Text>
                  </View>
                </View>

                <View className="flex-col gap-4">
                  <Input
                    label="Harvest Date (YYYY-MM-DD, Optional)"
                    placeholder="e.g. 2026-11-15"
                    value={form.harvest_date}
                    onChangeText={(v) => set('harvest_date', v)}
                  />

                  <Input
                    label="Description & Pickup Terms (Optional)"
                    placeholder="Detail quality attributes, packaging, farm gate loading, or mandi delivery terms..."
                    value={form.description}
                    onChangeText={(v) => set('description', v)}
                    multiline
                    numberOfLines={4}
                    className="min-h-[90px]"
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Form Action Buttons */}
              <View className="flex-row items-center justify-end gap-3 pt-2">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  className="px-6"
                />
                <Button
                  label={createListing.isPending ? 'Publishing...' : 'Publish Produce Listing'}
                  onPress={handleSubmit}
                  disabled={createListing.isPending}
                  className="px-8 shadow-sm"
                />
              </View>
            </View>

            {/* Right Column: Live Marketplace Listing Preview (~380px) */}
            <View className="w-full lg:w-96 shrink-0 flex-col gap-6">
              {/* Live Marketplace Card */}
              <View
                className="bg-surface rounded-2xl p-6 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-soil/5">
                  <Text className="text-soil-muted text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                    Buyer Card Preview
                  </Text>
                  <View className="bg-leaf/10 px-2.5 py-0.5 rounded-full">
                    <Text className="text-leaf text-xs font-semibold capitalize" style={{ fontFamily: 'Inter-Medium' }}>
                      Active Listing
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 mb-4">
                  <View className="w-12 h-12 rounded-2xl bg-leaf/10 items-center justify-center border border-leaf/20">
                    <Sprout size={24} color="#2E7D32" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      {form.crop_type || 'Fresh Crop Name'}
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      {form.category || 'Category pending'}
                    </Text>
                  </View>
                </View>

                {/* Price & Quantity Grid */}
                <View className="bg-sand/60 rounded-xl p-4 flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-soil-muted text-[11px] mb-0.5" style={{ fontFamily: 'Inter-Regular' }}>
                      Ask Price
                    </Text>
                    <Text className="text-leaf text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      ₹{form.price_per_unit ? Number(form.price_per_unit).toLocaleString('en-IN') : '0'}
                      <Text className="text-soil-muted text-xs font-normal"> /{form.unit}</Text>
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-soil-muted text-[11px] mb-0.5" style={{ fontFamily: 'Inter-Regular' }}>
                      Available Lot
                    </Text>
                    <Text className="text-soil text-base font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      {form.quantity_available || '0'} {form.unit}
                    </Text>
                  </View>
                </View>

                {/* Estimated Lot Gross Value */}
                {totalLotValue > 0 && (
                  <View className="bg-leaf/5 border border-leaf/20 rounded-xl p-3 flex-row items-center justify-between">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Gross Lot Value
                    </Text>
                    <Text className="text-leaf text-base font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      ₹{totalLotValue.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Direct Marketplace Perks Callout */}
              <View className="bg-leaf/5 border border-leaf/15 rounded-2xl p-5 flex-col gap-2.5">
                <View className="flex-row items-center gap-2">
                  <Sparkles size={16} color="#2E7D32" />
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    0% Intermediary Fee
                  </Text>
                </View>
                <Text className="text-soil-muted text-xs leading-5" style={{ fontFamily: 'Inter-Regular' }}>
                  Listings on KhetiTantra connect you directly with verified regional buyers. Inquiries come straight to your phone with zero commission deducted from your harvest proceeds.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
