import { useState } from 'react';
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
import { ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const CATEGORY_OPTIONS = [
  { label: 'Vegetables', value: 'Vegetables' },
  { label: 'Fruits', value: 'Fruits' },
  { label: 'Grains', value: 'Grains' },
  { label: 'Pulses', value: 'Pulses' },
  { label: 'Spices', value: 'Spices' },
  { label: 'Other', value: 'Other' },
];

const UNIT_OPTIONS = [
  { label: 'Quintal (qtl)', value: 'quintal' },
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Ton', value: 'ton' },
  { label: 'Dozen', value: 'dozen' },
  { label: 'Piece', value: 'piece' },
];

function validate(form) {
  const errors = {};
  if (!form.crop_type.trim()) errors.crop_type = 'Crop name is required';
  if (!form.category) errors.category = 'Select a category';
  if (!form.price_per_unit || isNaN(Number(form.price_per_unit)) || Number(form.price_per_unit) <= 0)
    errors.price_per_unit = 'Enter a valid price';
  if (!form.quantity_available || isNaN(Number(form.quantity_available)) || Number(form.quantity_available) <= 0)
    errors.quantity_available = 'Enter a valid quantity';
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
    { label: 'Not linked', value: '' },
    ...(crops?.map((c) => ({ label: c.crop_name, value: c.id })) || []),
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

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-3 gap-3 md:max-w-3xl md:w-full md:self-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-soil/10"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#3E2723" strokeWidth={2} />
          </Pressable>
          <View>
            <Text
              className="text-soil text-xl"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              List a Crop
            </Text>
            <Text
              className="text-soil-muted text-xs"
              style={{ fontFamily: 'Inter-Regular' }}
            >
              Make your harvest visible to buyers
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-12 pt-2 md:max-w-3xl md:w-full md:self-center"
        >
          <Animated.View entering={FadeInUp.delay(80).duration(400)}>
            {/* Crop Details section */}
            <Text
              className="text-soil text-base mb-3"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Crop Details
            </Text>

            <Input
              label="Crop Name *"
              placeholder="e.g. Tomato, Wheat, Mango"
              value={form.crop_type}
              onChangeText={(v) => set('crop_type', v)}
              error={errors.crop_type}
              autoCapitalize="words"
            />

            <Select
              label="Category *"
              value={form.category}
              onValueChange={(v) => set('category', v)}
              options={CATEGORY_OPTIONS}
              placeholder="Select category"
              error={errors.category}
            />

            <Select
              label="Link to My Crop (optional)"
              value={form.linked_crop_id}
              onValueChange={(v) => set('linked_crop_id', v)}
              options={cropOptions}
              placeholder="Select a crop from your farm"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(160).duration(400)}>
            {/* Pricing section */}
            <Text
              className="text-soil text-base mb-3 mt-2"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Pricing &amp; Quantity
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Price per Unit (₹) *"
                  placeholder="0"
                  value={form.price_per_unit}
                  onChangeText={(v) => set('price_per_unit', v)}
                  keyboardType="numeric"
                  error={errors.price_per_unit}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Quantity Available *"
                  placeholder="0"
                  value={form.quantity_available}
                  onChangeText={(v) => set('quantity_available', v)}
                  keyboardType="numeric"
                  error={errors.quantity_available}
                />
              </View>
            </View>

            <Select
              label="Unit *"
              value={form.unit}
              onValueChange={(v) => set('unit', v)}
              options={UNIT_OPTIONS}
              placeholder="Select unit"
              error={errors.unit}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(240).duration(400)}>
            {/* Extra details */}
            <Text
              className="text-soil text-base mb-3 mt-2"
              style={{ fontFamily: 'Inter-Bold' }}
            >
              Additional Info
            </Text>

            <Input
              label="Harvest Date (optional)"
              placeholder="e.g. 2026-11-15"
              value={form.harvest_date}
              onChangeText={(v) => set('harvest_date', v)}
            />

            <Input
              label="Description (optional)"
              placeholder="Quality details, pickup location, organic certification…"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={4}
              className="min-h-[100px]"
              textAlignVertical="top"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            {createListing.isError && (
              <Text
                className="text-clay text-sm text-center mb-3"
                style={{ fontFamily: 'Inter-Regular' }}
              >
                Failed to create listing. Please try again.
              </Text>
            )}

            <Button
              label={
                createListing.isPending ? 'Publishing…' : 'Publish Listing'
              }
              onPress={handleSubmit}
              disabled={createListing.isPending}
              icon={
                createListing.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : null
              }
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
