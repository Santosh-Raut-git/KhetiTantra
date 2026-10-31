import React, { useState, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { AppImagePicker } from '@/components/ui/ImagePicker';
import { useCreateTransaction, uploadReceipt } from '@/lib/api/transactions';
import { analyzeReceiptImage } from '@/lib/api/vision';
import { useCrops } from '@/lib/api/crops';
import { useStore } from '@/lib/store';
import {
  ArrowLeft,
  Receipt,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Tag,
  Calendar,
} from 'lucide-react-native';
import { useToast } from '@/components/ui/Toast';

const transactionSchema = z.object({
  crop_id: z.string().min(1, 'Please select a crop'),
  type: z.enum(['income', 'expense'], { required_error: 'Type is required' }),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  transaction_date: z
    .string()
    .min(1, 'Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  description: z.string().optional(),
});

const EXPENSE_CATEGORIES = [
  { label: 'Seeds & Saplings', value: 'Seeds' },
  { label: 'Fertilizer & Nutrients', value: 'Fertilizer' },
  { label: 'Pesticides & Crop Protection', value: 'Pesticides' },
  { label: 'Labor & Farm Hands', value: 'Labor' },
  { label: 'Machinery & Fuel Rental', value: 'Machinery' },
  { label: 'Irrigation & Electricity', value: 'Irrigation' },
  { label: 'Other Operational Expense', value: 'Other' },
];

const INCOME_CATEGORIES = [
  { label: 'Crop Wholesale Sale', value: 'Crop Sale' },
  { label: 'Byproduct & Fodder Sale', value: 'Byproduct Sale' },
  { label: 'Government Subsidy / Scheme', value: 'Subsidy' },
  { label: 'Other Farm Income', value: 'Other' },
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { session } = useStore();
  const { data: crops, isLoading: cropsLoading } = useCrops();
  const createTransaction = useCreateTransaction();
  const { showToast } = useToast();

  const [receiptBase64, setReceiptBase64] = useState(null);
  const [receiptUri, setReceiptUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      crop_id: '',
      category: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const watchType = watch('type');
  const watchAmount = watch('amount');
  const watchCategory = watch('category');
  const watchCropId = watch('crop_id');
  const watchDate = watch('transaction_date');

  const cropOptions = useMemo(() => {
    return (
      crops
        ?.filter((c) => c.status !== 'failed')
        .map((crop) => ({
          label: `${crop.crop_name} (${crop.season})`,
          value: crop.id,
        })) || []
    );
  }, [crops]);

  const selectedCropName = useMemo(() => {
    const found = crops?.find((c) => c.id === watchCropId);
    return found ? `${found.crop_name} (${found.season})` : 'Unassigned';
  }, [crops, watchCropId]);

  const onSubmit = async (data) => {
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
      showToast('Transaction registered in farm ledger!', 'success');
      router.back();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to save transaction',
        'error',
      );
    } finally {
      setIsUploading(false);
    }
  };

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
          {/* Top Breadcrumb Header */}
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
                  Record Farm Transaction
                </Text>
                <Text
                  className="text-soil-muted text-xs lg:text-sm mt-0.5"
                  style={{ fontFamily: 'Inter-Regular' }}
                >
                  Log production costs, seed procurement, and harvest revenue
                </Text>
              </View>
            </View>
          </View>

          {/* 2-Column Responsive Desktop Layout */}
          <View className="flex-col lg:flex-row gap-8 items-start">
            {/* Left Column: Transaction Data Forms */}
            <View className="flex-1 w-full flex-col gap-6">
              <View
                className="bg-surface rounded-2xl p-6 md:p-8 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                {/* Income / Expense Switcher Pills */}
                <Controller
                  control={control}
                  name="type"
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row w-full mb-6 bg-sand/80 p-1.5 rounded-2xl border border-soil/5 gap-2">
                      <Pressable
                        onPress={() => onChange('expense')}
                        className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 transition-all ${
                          value === 'expense'
                            ? 'bg-clay shadow-sm'
                            : 'bg-transparent hover:bg-soil/5'
                        }`}
                      >
                        <TrendingDown
                          size={18}
                          color={value === 'expense' ? '#FFFFFF' : '#3E2723'}
                          strokeWidth={2.4}
                        />
                        <Text
                          className={`font-bold text-sm ${
                            value === 'expense' ? 'text-white' : 'text-soil'
                          }`}
                          style={{ fontFamily: 'Inter-Bold' }}
                        >
                          Farm Expense (Debit)
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => onChange('income')}
                        className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 transition-all ${
                          value === 'income'
                            ? 'bg-leaf shadow-sm'
                            : 'bg-transparent hover:bg-soil/5'
                        }`}
                      >
                        <TrendingUp
                          size={18}
                          color={value === 'income' ? '#FFFFFF' : '#3E2723'}
                          strokeWidth={2.4}
                        />
                        <Text
                          className={`font-bold text-sm ${
                            value === 'income' ? 'text-white' : 'text-soil'
                          }`}
                          style={{ fontFamily: 'Inter-Bold' }}
                        >
                          Farm Income (Credit)
                        </Text>
                      </Pressable>
                    </View>
                  )}
                />

                {/* Form Inputs Grid */}
                <View className="flex-col gap-4">
                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      {cropsLoading ? (
                        <ActivityIndicator color="#2E7D32" className="my-3" />
                      ) : (
                        <Controller
                          control={control}
                          name="crop_id"
                          render={({ field: { onChange, value } }) => (
                            <Select
                              label="Related Crop Batch *"
                              value={value}
                              onValueChange={onChange}
                              options={cropOptions}
                              placeholder="Select crop batch"
                              error={errors.crop_id?.message}
                            />
                          )}
                        />
                      )}
                    </View>

                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="category"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            label="Transaction Category *"
                            value={value}
                            onValueChange={onChange}
                            options={
                              watchType === 'expense'
                                ? EXPENSE_CATEGORIES
                                : INCOME_CATEGORIES
                            }
                            placeholder="Select category"
                            error={errors.category?.message}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <View className="flex-col sm:flex-row gap-4">
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="amount"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Amount (₹) *"
                            placeholder="e.g. 4500"
                            value={value}
                            onChangeText={onChange}
                            keyboardType="numeric"
                            error={errors.amount?.message}
                          />
                        )}
                      />
                    </View>

                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="transaction_date"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Transaction Date (YYYY-MM-DD) *"
                            placeholder="YYYY-MM-DD"
                            value={value}
                            onChangeText={onChange}
                            error={errors.transaction_date?.message}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Description / Merchant / Notes (Optional)"
                        placeholder="e.g. Purchased 2 bags of DAP from Kishan Seva Kendra"
                        value={value}
                        onChangeText={onChange}
                        error={errors.description?.message}
                        multiline
                        numberOfLines={3}
                        className="min-h-[80px]"
                        textAlignVertical="top"
                      />
                    )}
                  />
                </View>

                {/* Form Buttons */}
                <View className="flex-row items-center justify-end gap-3 pt-6 mt-4 border-t border-soil/5">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => router.back()}
                    className="px-6"
                  />
                  <Button
                    label={isUploading ? 'Registering...' : 'Save Transaction'}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isUploading || isAnalyzing}
                    className="px-8 shadow-sm"
                    variant={watchType === 'expense' ? 'danger' : 'primary'}
                  />
                </View>
              </View>
            </View>

            {/* Right Column: AI OCR Scanner & Live Voucher (~380px) */}
            <View className="w-full lg:w-96 shrink-0 flex-col gap-6">
              {/* Smart Receipt Scanner Card */}
              <View
                className="bg-surface rounded-2xl p-6 border border-soil/5 shadow-sm"
                style={{
                  shadowColor: '#3E2723',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-soil/5">
                  <View className="flex-row items-center gap-2">
                    <Receipt size={18} color="#2E7D32" strokeWidth={2.2} />
                    <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                      Smart Receipt Scanner
                    </Text>
                  </View>
                  <View className="bg-leaf/10 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                    <Sparkles size={11} color="#2E7D32" />
                    <Text className="text-leaf text-[11px] font-bold" style={{ fontFamily: 'Inter-Bold' }}>
                      AI OCR
                    </Text>
                  </View>
                </View>

                <Text className="text-soil-muted text-xs mb-3 leading-4" style={{ fontFamily: 'Inter-Regular' }}>
                  Upload a photo of an invoice or bill. Gemini Vision will read merchant, date, and amount to auto-populate your ledger form.
                </Text>

                <AppImagePicker
                  label=""
                  value={receiptUri || undefined}
                  onImageSelected={async (base64, uri) => {
                    setReceiptBase64(base64);
                    setReceiptUri(uri);
                    if (base64) {
                      try {
                        setIsAnalyzing(true);
                        showToast('Scanning bill with Gemini Vision...', 'success');
                        const details = await analyzeReceiptImage(base64);
                        if (details.type) setValue('type', details.type);
                        if (details.category) setValue('category', details.category);
                        if (details.amount) setValue('amount', details.amount.toString());
                        if (details.transaction_date)
                          setValue('transaction_date', details.transaction_date);
                        if (details.description)
                          setValue('description', details.description);
                        showToast('Receipt scanned & fields populated!', 'success');
                      } catch (e) {
                        console.error(e);
                        showToast('Could not parse receipt automatically', 'error');
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }
                  }}
                  onImageRemoved={() => {
                    setReceiptBase64(null);
                    setReceiptUri(null);
                  }}
                  isUploading={isUploading || isAnalyzing}
                />
              </View>

              {/* Live Voucher Preview Card */}
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
                    Voucher Preview
                  </Text>
                  <View
                    className={`px-2.5 py-0.5 rounded-full ${
                      watchType === 'income' ? 'bg-leaf/10' : 'bg-clay/10'
                    }`}
                  >
                    <Text
                      className={`text-xs capitalize font-bold ${
                        watchType === 'income' ? 'text-leaf' : 'text-clay'
                      }`}
                      style={{ fontFamily: 'Inter-Bold' }}
                    >
                      {watchType}
                    </Text>
                  </View>
                </View>

                <View className="items-center py-2">
                  <Text
                    className={`text-3xl font-bold mb-1 ${
                      watchType === 'income' ? 'text-leaf' : 'text-clay'
                    }`}
                    style={{ fontFamily: 'Inter-Bold' }}
                  >
                    {watchType === 'income' ? '+' : '-'}₹
                    {watchAmount ? Number(watchAmount).toLocaleString('en-IN') : '0'}
                  </Text>
                  <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                    {watchDate || 'Date pending'}
                  </Text>
                </View>

                <View className="bg-sand/60 rounded-xl p-3 mt-3 flex-col gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Linked Crop
                    </Text>
                    <Text className="text-soil text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      {selectedCropName}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-soil-muted text-xs" style={{ fontFamily: 'Inter-Regular' }}>
                      Category
                    </Text>
                    <Text className="text-soil text-xs font-semibold" style={{ fontFamily: 'Inter-Medium' }}>
                      {watchCategory || 'None selected'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Accounting & Tax Audit Callout */}
              <View className="bg-leaf/5 border border-leaf/15 rounded-2xl p-5 flex-col gap-2.5">
                <View className="flex-row items-center gap-2">
                  <ShieldCheck size={16} color="#2E7D32" />
                  <Text className="text-soil font-bold text-sm" style={{ fontFamily: 'Inter-Bold' }}>
                    Batch Financial Auditing
                  </Text>
                </View>
                <Text className="text-soil-muted text-xs leading-5" style={{ fontFamily: 'Inter-Regular' }}>
                  Transactions saved here automatically deduct or add to the specific crop batch profitability metric, keeping your farm accounts ready for seasonal review and credit applications.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
