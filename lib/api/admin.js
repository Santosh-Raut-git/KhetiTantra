import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export function useIsAdmin() {
  return useQuery({
    queryKey: ['admin_check'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: crops } = await supabase
        .from('crops')
        .select('status');
      const totalCrops = crops?.length || 0;
      const activeCrops =
        crops?.filter((c) => c.status === 'active').length || 0;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type');
      const totalTransactions = transactions?.length || 0;
      let totalIncome = 0;
      let totalExpense = 0;
      transactions?.forEach((tx) => {
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
      };
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
      return data;
    },
  });
}

export function useAdminCrops() {
  return useQuery({
    queryKey: ['admin_crops'],
    queryFn: async () => {
      const [
        { data: crops, error: cropsError },
        { data: profiles, error: profilesError },
      ] = await Promise.all([
        supabase
          .from('crops')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name'),
      ]);
      if (cropsError) throw cropsError;
      if (profilesError) throw profilesError;
      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      return (crops || []).map((crop) => ({
        ...crop,
        profiles: profileMap.get(crop.user_id),
      }));
    },
  });
}

export function useAdminTransactions() {
  return useQuery({
    queryKey: ['admin_transactions'],
    queryFn: async () => {
      const [
        { data: txs, error: txError },
        { data: profiles, error: pError },
        { data: crops, error: cError },
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('crops').select('id, crop_name'),
      ]);
      if (txError) throw txError;
      if (pError) throw pError;
      if (cError) throw cError;
      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      const cropMap = new Map(crops?.map((c) => [c.id, c]));
      return (txs || []).map((tx) => ({
        ...tx,
        profiles: profileMap.get(tx.user_id),
        crops: cropMap.get(tx.crop_id),
      }));
    },
  });
}

export function useDeleteUserAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
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
    mutationFn: async (cropId) => {
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
    mutationFn: async (txId) => {
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
