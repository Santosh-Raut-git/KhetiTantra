import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { AppImagePicker } from '@/components/ui/ImagePicker';
import { useCreateTransaction, uploadReceipt } from '@/lib/api/transactions';
import { useCrops } from '@/lib/api/crops';
import { useStore } from '@/lib/store';
import { ArrowLeft } from 'lucide-react-native';
import { useToast } from '@/components/ui/Toast';

const transactionSchema = z.object({
  crop_id: z.string().min(1, 'Please select a crop'),
  type: z.enum(['income', 'expense'], { required_error: 'Type is required' }),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  transaction_date: z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const EXPENSE_CATEGORIES = [
  { label: 'Seeds', value: 'Seeds' },
  { label: 'Fertilizer', value: 'Fertilizer' },
  { label: 'Pesticides', value: 'Pesticides' },
  { label: 'Labor', value: 'Labor' },
  { label: 'Machinery', value: 'Machinery' },
  { label: 'Irrigation', value: 'Irrigation' },
  { label: 'Other Expense', value: 'Other' },
];

const INCOME_CATEGORIES = [
  { label: 'Crop Sale', value: 'Crop Sale' },
  { label: 'Byproduct Sale', value: 'Byproduct Sale' },
  { label: 'Subsidy', value: 'Subsidy' },
  { label: 'Other Income', value: 'Other' },
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { session } = useStore();
  
  const { data: crops, isLoading: cropsLoading } = useCrops();
  const createTransaction = useCreateTransaction();
  const { showToast } = useToast();
  
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      transaction_date: new Date().toISOString().split('T')[0],
    }
  });

  const watchType = watch('type');

  const cropOptions = useMemo(() => {
    return crops?.filter(c => c.status !== 'failed').map(crop => ({
      label: `${crop.crop_name} (${crop.season})`,
      value: crop.id
    })) || [];
  }, [crops]);

  const onSubmit = async (data: TransactionFormData) => {
    if (!session?.user) return;
    
    try {
      setIsUploading(true);
      let receiptUrl = undefined;
      
      if (receiptBase64) {
        receiptUrl = await uploadReceipt(receiptBase64, session.user.id);
      }

      await createTransaction.mutateAsync({
        user_id: session.user.id,
        crop_id: data.crop_id,
        type: data.type,
        category: data.category,
        amount: parseFloat(data.amount),
        transaction_date: data.transaction_date,
        description: data.description || undefined,
        receipt_url: receiptUrl,
      });

      showToast('Transaction saved', 'success');
      router.back();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save transaction', 'error');
    } finally {
      setIsUploading(false);
    }
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
          New Transaction
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5 md:max-w-2xl md:w-full md:self-center md:py-8">
          <View className="bg-surface p-5 rounded-3xl border border-soil/5 mb-6">
            
            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row mb-6 bg-sand rounded-xl p-1">
                  <Button 
                    label="Expense" 
                    onPress={() => onChange('expense')}
                    className={`flex-1 min-h-[40px] rounded-lg ${value === 'expense' ? 'bg-clay shadow-sm' : 'bg-transparent'}`}
                    variant={value === 'expense' ? 'danger' : 'secondary'}
                  />
                  <Button 
                    label="Income" 
                    onPress={() => onChange('income')}
                    className={`flex-1 min-h-[40px] rounded-lg ${value === 'income' ? 'bg-leaf shadow-sm' : 'bg-transparent'}`}
                    variant={value === 'income' ? 'primary' : 'secondary'}
                  />
                </View>
              )}
            />

            {cropsLoading ? (
              <ActivityIndicator color="#2E7D32" className="mb-4" />
            ) : (
              <Controller
                control={control}
                name="crop_id"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Related Crop *"
                    value={value}
                    onValueChange={onChange}
                    options={cropOptions}
                    placeholder="Select a crop"
                    error={errors.crop_id?.message}
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Category *"
                  value={value}
                  onValueChange={onChange}
                  options={watchType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES}
                  placeholder="Select category"
                  error={errors.category?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={`Amount (₹) *`}
                  placeholder="0.00"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={errors.amount?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="transaction_date"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Date (YYYY-MM-DD) *"
                  value={value}
                  onChangeText={onChange}
                  error={errors.transaction_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Description (Optional)"
                  placeholder="Additional details..."
                  value={value}
                  onChangeText={onChange}
                  error={errors.description?.message}
                />
              )}
            />

            <AppImagePicker
              label="Receipt Photo (Optional)"
              value={receiptUri || undefined}
              onImageSelected={(base64, uri) => {
                setReceiptBase64(base64);
                setReceiptUri(uri);
              }}
              onImageRemoved={() => {
                setReceiptBase64(null);
                setReceiptUri(null);
              }}
              isUploading={isUploading}
            />

            <Button 
              label={isUploading ? 'Uploading...' : 'Save Transaction'} 
              onPress={handleSubmit(onSubmit)} 
              disabled={isUploading}
              className="mt-4"
              variant={watchType === 'expense' ? 'danger' : 'primary'}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
