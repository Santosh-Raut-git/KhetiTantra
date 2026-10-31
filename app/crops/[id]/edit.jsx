import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useCrop, useUpdateCrop } from '@/lib/api/crops';
import { ArrowLeft, Sprout, Calendar, Sparkles, CheckCircle2, Layers } from 'lucide-react-native';
import { useToast } from '@/components/ui/Toast';
import { getStatusColor, getStatusBg } from '@/lib/utils';

const cropEditSchema = z
  .object({
    crop_name: z.string().min(1, 'Crop name is required'),
    variety: z.string().optional(),
    season: z.enum(['Kharif', 'Rabi', 'Zaid'], {
      required_error: 'Season is required',
    }),
    area_acres: z.string().optional(),
    sowing_date: z
      .string()
      .min(1, 'Sowing date is required')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    expected_harvest_date: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        'Must be YYYY-MM-DD',
      ),
    status: z.enum(['active', 'harvested', 'failed']),
    actual_harvest_date: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        'Must be YYYY-MM-DD',
      ),
    yield_quantity: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.expected_harvest_date && data.sowing_date) {
        return (
          new Date(data.expected_harvest_date) >= new Date(data.sowing_date)
        );
      }
      return true;
    },
    {
      message: 'Expected harvest date cannot be earlier than sowing date',
      path: ['expected_harvest_date'],
    },
  )
  .refine(
    (data) => {
      if (data.status === 'harvested' && !data.actual_harvest_date) {
        return false;
      }
      return true;
    },
    {
      message: 'Actual harvest date is required when harvested',
      path: ['actual_harvest_date'],
    },
  )
  .refine(
    (data) => {
      if (
        data.status === 'harvested' &&
        data.actual_harvest_date &&
        data.sowing_date
      ) {
        return new Date(data.actual_harvest_date) >= new Date(data.sowing_date);
      }
      return true;
    },
    {
      message: 'Actual harvest date cannot be earlier than sowing date',
      path: ['actual_harvest_date'],
    },
  );

export default function EditCropScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { data: crop, isLoading: isCropLoading } = useCrop(id);
  const updateCrop = useUpdateCrop();
  const [isReady, setIsReady] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(cropEditSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const watchStatus = watch('status');
  const watchCropName = watch('crop_name');
  const watchSeason = watch('season');
  const watchVariety = watch('variety');
  const watchArea = watch('area_acres');
  const watchYield = watch('yield_quantity');

  useEffect(() => {
    if (crop && !isReady) {
      reset({
        crop_name: crop.crop_name,
        variety: crop.variety || '',
        season: crop.season,
        area_acres: crop.area_acres ? crop.area_acres.toString() : '',
        sowing_date: crop.sowing_date,
        expected_harvest_date: crop.expected_harvest_date || '',
        status: crop.status,
        actual_harvest_date: crop.actual_harvest_date || '',
        yield_quantity: crop.yield_quantity
          ? crop.yield_quantity.toString()
          : '',
      });
      setIsReady(true);
    }
  }, [crop, reset, isReady]);

  const onSubmit = (data) => {
    updateCrop.mutate(
      {
        id,
        crop_name: data.crop_name,
        variety: data.variety || undefined,
        season: data.season,
        area_acres: data.area_acres ? parseFloat(data.area_acres) : undefined,
        sowing_date: data.sowing_date,
        expected_harvest_date: data.expected_harvest_date || undefined,
        status: data.status,
        actual_harvest_date:
          data.status === 'harvested'
            ? data.actual_harvest_date || undefined
            : undefined,
        yield_quantity:
          data.status === 'harvested' && data.yield_quantity
            ? parseFloat(data.yield_quantity)
            : undefined,
      },
      {
        onSuccess: () => {
          showToast('Crop updated successfully', 'success');
          router.back();
        },
        onError: (err) => {
          showToast(err.message, 'error');
        },
      },
    );
  };

  if (isCropLoading || !isReady) {
    return (
      <SafeAreaView className="flex-1 bg-sand justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
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
                  Edit Crop Cycle
                </Text>
                <Text
                  className="text-soil-muted text-xs lg:text-sm mt-0.5"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  Update botanical variety, acreage, lifecycle stage, and harvest yield records
                </Text>
              </View>
            </View>
          </View>

          {/* 2-Column Responsive SaaS Body */}
          <View className="flex-col lg:flex-row gap-8 items-start">
            {/* Left Column: Form Cards */}
            <View className="flex-1 w-full flex-col gap-6">
              {/* Card 1: Botanical & Plot Info */}
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
                      Crop Identification & Field Size
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Edit crop species, cultivar/variety, and cultivated area
                    </Text>
                  </View>
                </View>

                <View className="flex-col gap-4">
                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="crop_name"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Crop Name *"
                            value={value}
                            onChangeText={onChange}
                            error={errors.crop_name?.message}
                          />
                        )}
                      />
                    </View>
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="variety"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Variety / Hybrid (Optional)"
                            value={value}
                            onChangeText={onChange}
                            error={errors.variety?.message}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="season"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            label="Sowing Season *"
                            value={value}
                            onValueChange={onChange}
                            options={[
                              { label: 'Kharif (Monsoon Cycle)', value: 'Kharif' },
                              { label: 'Rabi (Winter Cycle)', value: 'Rabi' },
                              { label: 'Zaid (Summer Cycle)', value: 'Zaid' },
                            ]}
                            error={errors.season?.message}
                          />
                        )}
                      />
                    </View>
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="area_acres"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Area (Acres)"
                            value={value}
                            onChangeText={onChange}
                            keyboardType="numeric"
                            error={errors.area_acres?.message}
                          />
                        )}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: Lifecycle Schedule & Harvest Results */}
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
                    <Calendar size={20} color="#F57F17" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      Timeline & Crop Status
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Update sowing date, expected timeline, and record final harvest data
                    </Text>
                  </View>
                </View>

                <View className="flex-col gap-4">
                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="sowing_date"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Sowing Date (YYYY-MM-DD) *"
                            value={value}
                            onChangeText={onChange}
                            error={errors.sowing_date?.message}
                          />
                        )}
                      />
                    </View>
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="expected_harvest_date"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Expected Harvest (YYYY-MM-DD)"
                            value={value}
                            onChangeText={onChange}
                            error={errors.expected_harvest_date?.message}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <Controller
                    control={control}
                    name="status"
                    render={({ field: { onChange, value } }) => (
                      <Select
                        label="Lifecycle Status *"
                        value={value}
                        onValueChange={onChange}
                        options={[
                          { label: 'Active (Currently Growing)', value: 'active' },
                          { label: 'Harvested (Cycle Completed)', value: 'harvested' },
                          { label: 'Failed / Crop Loss', value: 'failed' },
                        ]}
                        error={errors.status?.message}
                      />
                    )}
                  />

                  {watchStatus === 'harvested' && (
                    <View className="mt-2 p-5 bg-harvest/10 rounded-2xl border border-harvest/25 flex-col gap-4">
                      <View className="flex-row items-center gap-2">
                        <CheckCircle2 size={18} color="#F57F17" />
                        <Text
                          className="text-soil text-base font-bold"
                          style={{ fontFamily: 'Inter-Bold' }}
                        >
                          Harvest & Yield Records
                        </Text>
                      </View>
                      <View className="flex-col sm:flex-row gap-4">
                        <View className="flex-1">
                          <Controller
                            control={control}
                            name="actual_harvest_date"
                            render={({ field: { onChange, value } }) => (
                              <Input
                                label="Actual Harvest Date (YYYY-MM-DD) *"
                                value={value}
                                onChangeText={onChange}
                                error={errors.actual_harvest_date?.message}
                              />
                            )}
                          />
                        </View>
                        <View className="flex-1">
                          <Controller
                            control={control}
                            name="yield_quantity"
                            render={({ field: { onChange, value } }) => (
                              <Input
                                label={`Yield Quantity (${crop?.yield_unit || 'quintal'})`}
                                value={value}
                                onChangeText={onChange}
                                keyboardType="numeric"
                                error={errors.yield_quantity?.message}
                              />
                            )}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Form Actions Row */}
              <View className="flex-row items-center justify-end gap-3 pt-2">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  className="px-6"
                />
                <Button
                  label={updateCrop.isPending ? 'Saving...' : 'Save Changes'}
                  onPress={handleSubmit(onSubmit)}
                  disabled={updateCrop.isPending}
                  className="px-8 shadow-sm"
                />
              </View>
            </View>

            {/* Right Column: Live Card Preview & Batch Information (~360px) */}
            <View className="w-full lg:w-92 shrink-0 flex-col gap-6">
              {/* Live Preview Card */}
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
                    Live Preview
                  </Text>
                  <View className={`px-2.5 py-0.5 rounded-full ${getStatusBg(watchStatus)}`}>
                    <Text className={`text-xs capitalize font-bold ${getStatusColor(watchStatus)}`} style={{ fontFamily: 'Inter-Bold' }}>
                      {watchStatus}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 mb-4">
                  <View className="w-12 h-12 rounded-2xl bg-leaf/10 items-center justify-center border border-leaf/20">
                    <Sprout size={24} color="#2E7D32" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-soil text-lg font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      {watchCropName || crop?.crop_name || 'Crop Name'}
                    </Text>
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      {watchSeason} Season {watchVariety ? `• ${watchVariety}` : ''}
                    </Text>
                  </View>
                </View>

                <View className="bg-sand/60 rounded-xl p-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-soil-muted text-[11px]" style={{ fontFamily: 'Inter-Regular' }}>
                      Field Area
                    </Text>
                    <Text className="text-soil text-sm font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      {watchArea ? `${watchArea} Acres` : 'Not set'}
                    </Text>
                  </View>
                  {watchStatus === 'harvested' && watchYield ? (
                    <View className="items-end">
                      <Text className="text-soil-muted text-[11px]" style={{ fontFamily: 'Inter-Regular' }}>
                        Harvest Yield
                      </Text>
                      <Text className="text-leaf text-sm font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                        {watchYield} {crop?.yield_unit || 'quintals'}
                      </Text>
                    </View>
                  ) : (
                    <View className="items-end">
                      <Text className="text-soil-muted text-[11px]" style={{ fontFamily: 'Inter-Regular' }}>
                        Financial Sync
                      </Text>
                      <Text className="text-leaf text-sm font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                        Auto-Linked
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Informational Guidance Callout */}
              <View className="bg-leaf/5 border border-leaf/15 rounded-2xl p-5 flex-col gap-3">
                <View className="flex-row items-center gap-2">
                  <Sparkles size={16} color="#2E7D32" />
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    Crop Batch Management
                  </Text>
                </View>
                <Text className="text-soil-muted text-xs leading-5" style={{ fontFamily: 'Inter-Regular' }}>
                  Updating the sowing season or harvest metrics helps maintain an accurate historical record of your farm's productivity and ensures financial profit margins reflect real farm cycles.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
