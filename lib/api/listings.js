import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

// ── Fetch all active listings (public feed for retailers) ──────────────────
export function useListings({ cropType, minPrice, maxPrice } = {}) {
  return useQuery({
    queryKey: ['listings', { cropType, minPrice, maxPrice }],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select(
          `
          *,
          profiles (
            full_name,
            village,
            district
          )
        `,
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (cropType) query = query.ilike('crop_type', `%${cropType}%`);
      if (minPrice) query = query.gte('price_per_unit', minPrice);
      if (maxPrice) query = query.lte('price_per_unit', maxPrice);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ── Fetch a single listing ─────────────────────────────────────────────────
export function useListing(id) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          *,
          profiles (
            full_name,
            village,
            district
          )
        `,
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// ── Fetch listings belonging to the current farmer ─────────────────────────
export function useMyListings() {
  return useQuery({
    queryKey: ['my_listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ── Create listing ─────────────────────────────────────────────────────────
export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newListing) => {
      const { data, error } = await supabase
        .from('listings')
        .insert(newListing)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my_listings'] });
    },
  });
}

// ── Update listing (e.g., mark as sold / change price) ────────────────────
export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings', data.id] });
      queryClient.invalidateQueries({ queryKey: ['my_listings'] });
    },
  });
}

// ── Delete listing ─────────────────────────────────────────────────────────
export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my_listings'] });
    },
  });
}
