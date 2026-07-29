import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { decode } from 'base64-arraybuffer';

export interface Transaction {
  id: string;
  user_id: string;
  crop_id: string;
  amount: number;
  transaction_date: string;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  receipt_url?: string;
  created_at?: string;
}

export function useTransactions(cropId?: string) {
  return useQuery({
    queryKey: ['transactions', { cropId }],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          crops (
            crop_name
          )
        `)
        .order('transaction_date', { ascending: false });

      if (cropId) {
        query = query.eq('crop_id', cropId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, crops(crop_name)`)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });
}

export async function uploadReceipt(base64Image: string, userId: string): Promise<string> {
  const fileName = `${userId}/${Date.now()}.jpg`;
  
  // React Native Expo Image Picker returns base64. We decode to arraybuffer for Supabase Storage
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, decode(base64Image), {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTx: Partial<Transaction>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTx)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['crop_profits'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', data.id] });
      queryClient.invalidateQueries({ queryKey: ['crop_profits'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['crop_profits'] });
    },
  });
}
