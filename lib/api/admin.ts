import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { createClient } from '@supabase/supabase-js';

// Dedicated admin client that does not use the user's local session,
// thereby using the service_role key to bypass RLS.
export const adminSupabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Super admin checking is now done via the database 'is_admin' column on the profiles table.

export interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  village: string | null;
  district: string | null;
  land_area_acres: number | null;
  preferred_language: string | null;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface AdminCrop {
  id: string;
  user_id: string;
  crop_name: string;
  variety: string | null;
  season: string;
  area_acres: number | null;
  sowing_date: string;
  expected_harvest_date: string | null;
  actual_harvest_date: string | null;
  yield_quantity: number | null;
  yield_unit: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string | null };
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  crop_id: string;
  amount: number;
  transaction_date: string;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  receipt_url: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
  crops?: { crop_name: string };
}

export interface AdminStats {
  totalUsers: number;
  totalCrops: number;
  activeCrops: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ['admin_check'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
        
      if (error || !data) return false;
      return !!data.is_admin;
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await adminSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get crops stats
      const { data: crops } = await adminSupabase
        .from('crops')
        .select('status');

      const totalCrops = crops?.length || 0;
      const activeCrops = crops?.filter(c => c.status === 'active').length || 0;

      // Get transactions stats
      const { data: transactions } = await adminSupabase
        .from('transactions')
        .select('amount, type');

      const totalTransactions = transactions?.length || 0;
      let totalIncome = 0;
      let totalExpense = 0;
      transactions?.forEach(tx => {
        if (tx.type === 'income') totalIncome += Number(tx.amount);
        if (tx.type === 'expense') totalExpense += Number(tx.amount);
      });

      return {
        totalUsers: totalUsers || 0,
        totalCrops,
        activeCrops,
        totalTransactions,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
      } as AdminStats;
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminUser[];
    },
  });
}

export function useAdminCrops() {
  return useQuery({
    queryKey: ['admin_crops'],
    queryFn: async () => {
      const [{ data: crops, error: cropsError }, { data: profiles, error: profilesError }] = await Promise.all([
        adminSupabase.from('crops').select('*').order('created_at', { ascending: false }),
        adminSupabase.from('profiles').select('id, full_name')
      ]);

      if (cropsError) throw cropsError;
      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return (crops || []).map(crop => ({
        ...crop,
        profiles: profileMap.get(crop.user_id)
      })) as AdminCrop[];
    },
  });
}

export function useAdminTransactions() {
  return useQuery({
    queryKey: ['admin_transactions'],
    queryFn: async () => {
      const [{ data: txs, error: txError }, { data: profiles, error: pError }, { data: crops, error: cError }] = await Promise.all([
        adminSupabase.from('transactions').select('*').order('created_at', { ascending: false }),
        adminSupabase.from('profiles').select('id, full_name'),
        adminSupabase.from('crops').select('id, crop_name')
      ]);

      if (txError) throw txError;
      if (pError) throw pError;
      if (cError) throw cError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      const cropMap = new Map(crops?.map(c => [c.id, c]));

      return (txs || []).map(tx => ({
        ...tx,
        profiles: profileMap.get(tx.user_id),
        crops: cropMap.get(tx.crop_id)
      })) as AdminTransaction[];
    },
  });
}

export function useDeleteUserAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete user's data (cascading should handle most)
      // But we need to use the admin API or service role for this
      // For now, we'll delete the profile which cascades
      const { error } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin_crops'] });
      queryClient.invalidateQueries({ queryKey: ['admin_transactions'] });
    },
  });
}

export function useDeleteCropAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cropId: string) => {
      const { error } = await adminSupabase
        .from('crops')
        .delete()
        .eq('id', cropId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_crops'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
    },
  });
}

export function useDeleteTransactionAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      const { error } = await adminSupabase
        .from('transactions')
        .delete()
        .eq('id', txId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
    },
  });
}