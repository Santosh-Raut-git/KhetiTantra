import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
export function useCrops() {
  return useQuery({
    queryKey: ['crops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
export function useCrop(id) {
  return useQuery({
    queryKey: ['crops', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
export function useCropProfits() {
  return useQuery({
    queryKey: ['crop_profits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('crop_profits').select('*');
      if (error) throw error;
      return data;
    },
  });
}
export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCrop) => {
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
    mutationFn: async ({ id, ...updates }) => {
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
    mutationFn: async (id) => {
      const { error } = await supabase.from('crops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}
