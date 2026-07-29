import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface Crop {
  id: string;
  user_id: string;
  crop_name: string;
  variety?: string;
  season: 'Kharif' | 'Rabi' | 'Zaid';
  area_acres?: number;
  sowing_date: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  yield_quantity?: number;
  yield_unit: string;
  status: 'active' | 'harvested' | 'failed';
}

export interface CropProfit {
  crop_id: string;
  crop_name: string;
  season: string;
  total_income: number;
  total_expense: number;
  net_profit: number;
}

export function useCrops() {
  return useQuery({
    queryKey: ['crops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Crop[];
    },
  });
}

export function useCrop(id: string) {
  return useQuery({
    queryKey: ['crops', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Crop;
    },
  });
}

export function useCropProfits() {
  return useQuery({
    queryKey: ['crop_profits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crop_profits')
        .select('*');
        
      if (error) throw error;
      return data as CropProfit[];
    },
  });
}

export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCrop: Partial<Crop>) => {
      const { data, error } = await supabase
        .from('crops')
        .insert(newCrop)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}

export function useUpdateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Crop> & { id: string }) => {
      const { data, error } = await supabase
        .from('crops')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      queryClient.invalidateQueries({ queryKey: ['crops', data.id] });
    },
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}
