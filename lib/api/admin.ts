import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

// Super admin emails - add your admin email(s) here
const SUPER_ADMIN_EMAILS = [
  'admin@khetitantra.com',
  'santosh@khetitantra.com',
  'santosh@gmail.com',
  'sraut7106@gmail.com'
];

export interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  village: string | null;
  district: string | null;
  land_area_acres: number | null;
  preferred_language: string | null;
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
      const userEmail = (user.email || '').toLowerCase();
      console.log('Checking admin access for email:', userEmail);
      return SUPER_ADMIN_EMAILS.includes(userEmail);
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get crops stats
      const { data: crops } = await supabase
        .from('crops')
        .select('status');

      const totalCrops = crops?.length || 0;
      const activeCrops = crops?.filter(c => c.status === 'active').length || 0;

      // Get transactions stats
      const { data: transactions } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('crops')
        .select(`*, profiles(full_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminCrop[];
    },
  });
}

export function useAdminTransactions() {
  return useQuery({
    queryKey: ['admin_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, profiles(full_name), crops(crop_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminTransaction[];
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
      const { error } = await supabase
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
      const { error } = await supabase
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
      const { error } = await supabase
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