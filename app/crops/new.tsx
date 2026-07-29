import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useCreateCrop } from '@/lib/api/crops';
import { useStore } from '@/lib/store';
import { ArrowLeft } from 'lucide-react-native';
import { useToast } from '@/components/ui/Toast';

const cropSchema = z.object({
  crop_name: z.string().min(1, 'Crop name is required'),
  variety: z.string().optional(),
  season: z.enum(['Kharif', 'Rabi', 'Zaid'], { required_error: 'Season is required' }),
  area_acres: z.string().optional(),
  sowing_date: z.string().min(1, 'Sowing date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  expected_harvest_date: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'Must be YYYY-MM-DD'),
  status: z.enum(['active', 'harvested', 'failed']),
  actual_harvest_date: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'Must be YYYY-MM-DD'),
  yield_quantity: z.string().optional(),
}).refine(data => {
  if (data.expected_harvest_date && data.sowing_date) {
    return new Date(data.expected_harvest_date) >= new Date(data.sowing_date);
  }
  return true;
}, {
  message: 'Expected harvest date cannot be earlier than sowing date',
  path: ['expected_harvest_date'],
}).refine(data => {
  if (data.status === 'harvested' && !data.actual_harvest_date) {
    return false;
  }
  return true;
}, {
  message: 'Actual harvest date is required when harvested',
  path: ['actual_harvest_date'],
}).refine(data => {
  if (data.status === 'harvested' && data.actual_harvest_date && data.sowing_date) {
    return new Date(data.actual_harvest_date) >= new Date(data.sowing_date);
  }
  return true;
}, {
  message: 'Actual harvest date cannot be earlier than sowing date',
  path: ['actual_harvest_date'],
});

type CropFormData = z.infer<typeof cropSchema>;

export default function AddCropScreen() {
  const router = useRouter();
  const { session } = useStore();
  const createCrop = useCreateCrop();
  const { showToast } = useToast();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<CropFormData>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      crop_name: '',
      variety: '',
      season: undefined,
      area_acres: '',
      sowing_date: new Date().toISOString().split('T')[0],
      expected_harvest_date: '',
      status: 'active',
      actual_harvest_date: '',
      yield_quantity: '',
    }
  });

  const watchStatus = watch('status');

  const onSubmit = (data: CropFormData) => {
    if (!session?.user) return;

    createCrop.mutate({
      user_id: session.user.id,
      crop_name: data.crop_name,
      variety: data.variety || undefined,
      season: data.season,
      area_acres: data.area_acres ? parseFloat(data.area_acres) : undefined,
      sowing_date: data.sowing_date,
      expected_harvest_date: data.expected_harvest_date || undefined,
      status: data.status,
      actual_harvest_date: data.status === 'harvested' ? (data.actual_harvest_date || undefined) : undefined,
      yield_quantity: data.status === 'harvested' && data.yield_quantity ? parseFloat(data.yield_quantity) : undefined,
      yield_unit: 'quintal',
    }, {
      onSuccess: () => {
        showToast('Crop added successfully', 'success');
        router.back();
      },
      onError: (err) => {
        showToast(err.message, 'error');
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-sand" edges={['top']}>
      <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-soil/5 md:max-w-2xl md:w-full md:self-center">
        <Button 
          variant="secondary" 
          label="" 
          icon={<ArrowLeft size={24} color="#3E2723" />} 
          onPress={() => router.back()}
          className="mr-3 w-12 h-12 p-0"
        />
        <Text className="text-soil text-2xl font-bold" style={{ fontFamily: 'Inter-Bold' }}>
          Add New Crop
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 pb-12 md:max-w-2xl md:w-full md:self-center md:py-8">
          <View className="bg-surface p-5 rounded-3xl border border-soil/5 mb-6">
            <Text className="text-soil text-lg font-bold mb-4" style={{ fontFamily: 'Inter-Bold' }}>
              Basic Info
            </Text>

            <Controller
              control={control}
              name="crop_name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Crop Name *"
                  placeholder="e.g. Wheat"
                  value={value}
                  onChangeText={onChange}
                  error={errors.crop_name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="variety"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Variety (Optional)"
                  placeholder="e.g. HD-2967"
                  value={value}
                  onChangeText={onChange}
                  error={errors.variety?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="season"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Season *"
                  value={value}
                  onValueChange={onChange}
                  options={[
                    { label: 'Kharif (Monsoon)', value: 'Kharif' },
                    { label: 'Rabi (Winter)', value: 'Rabi' },
                    { label: 'Zaid (Summer)', value: 'Zaid' },
                  ]}
                  error={errors.season?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="area_acres"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Area (Acres)"
                  placeholder="e.g. 2.5"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={errors.area_acres?.message}
                />
              )}
            />
          </View>

          <View className="bg-surface p-5 rounded-3xl border border-soil/5 mb-6">
            <Text className="text-soil text-lg font-bold mb-4" style={{ fontFamily: 'Inter-Bold' }}>
              Timeline & Status
            </Text>

            <Controller
              control={control}
              name="sowing_date"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Sowing Date (YYYY-MM-DD) *"
                  placeholder="2026-06-15"
                  value={value}
                  onChangeText={onChange}
                  error={errors.sowing_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="expected_harvest_date"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Expected Harvest Date (YYYY-MM-DD)"
                  placeholder="2026-10-15"
                  value={value}
                  onChangeText={onChange}
                  error={errors.expected_harvest_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Status *"
                  value={value}
                  onValueChange={onChange}
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Harvested', value: 'harvested' },
                    { label: 'Failed', value: 'failed' },
                  ]}
                  error={errors.status?.message}
                />
              )}
            />

            {watchStatus === 'harvested' && (
              <View className="mt-2 p-4 bg-harvest/10 rounded-2xl border border-harvest/30">
                <Text className="text-soil text-base font-bold mb-3" style={{ fontFamily: 'Inter-Bold' }}>
                  Harvest Details
                </Text>
                <Controller
                  control={control}
                  name="actual_harvest_date"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Actual Harvest Date (YYYY-MM-DD) *"
                      placeholder="2026-10-20"
                      value={value}
                      onChangeText={onChange}
                      error={errors.actual_harvest_date?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="yield_quantity"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Yield Quantity (quintal)"
                      placeholder="e.g. 25"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      error={errors.yield_quantity?.message}
                    />
                  )}
                />
              </View>
            )}
          </View>

          <Button 
            label={createCrop.isPending ? 'Saving...' : 'Save Crop'} 
            onPress={handleSubmit(onSubmit)} 
            disabled={createCrop.isPending}
            className="mb-6"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}