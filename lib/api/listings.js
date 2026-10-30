import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabasePublic } from '../supabase';

// ── Helper: fetch profiles for a set of user IDs and attach to listings ────
async function attachProfiles(listings) {
  if (!listings || listings.length === 0) return [];

  const userIds = [...new Set(listings.map((l) => l.user_id))];

  const { data: profiles } = await supabasePublic
    .from('profiles')
    .select('id, full_name, village, district')
    .in('id', userIds);

  const profileMap = {};
  (profiles || []).forEach((p) => {
    profileMap[p.id] = p;
  });

  return listings.map((l) => ({
    ...l,
    profiles: profileMap[l.user_id] || null,
  }));
}

// ── Fetch all active listings (public feed for retailers) ──────────────────
export function useListings({ cropType, minPrice, maxPrice } = {}) {
  return useQuery({
    queryKey: ['listings', { cropType, minPrice, maxPrice }],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (cropType) query = query.ilike('crop_type', `%${cropType}%`);
      if (minPrice) query = query.gte('price_per_unit', minPrice);
      if (maxPrice) query = query.lte('price_per_unit', maxPrice);

      const { data, error } = await query;
      if (error) throw error;
      return attachProfiles(data);
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
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      // Attach profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, village, district')
        .eq('id', data.user_id)
        .single();

      return { ...data, profiles: profile || null };
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

// ── Dashboard marketplace stats ────────────────────────────────────────────
export function useMarketplaceStats() {
  return useQuery({
    queryKey: ['marketplace_stats'],
    queryFn: async () => {
      // Fetch all active listings for marketplace-wide stats
      const { data: allActive, error: activeErr } = await supabase
        .from('listings')
        .select('id, crop_type, category, price_per_unit, unit, quantity_available, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (activeErr) throw activeErr;

      // Fetch current user's listings (all statuses)
      const { data: { user } } = await supabase.auth.getUser();
      const { data: myListings, error: myErr } = await supabase
        .from('listings')
        .select('id, status, price_per_unit, unit, quantity_available, created_at')
        .eq('user_id', user.id);
      if (myErr) throw myErr;

      const myActive = (myListings || []).filter((l) => l.status === 'active');
      const mySold = (myListings || []).filter((l) => l.status === 'sold');

      // Price trends — group active listings by category and compute avg price
      const categoryPrices = {};
      (allActive || []).forEach((l) => {
        if (!categoryPrices[l.category]) {
          categoryPrices[l.category] = { total: 0, count: 0 };
        }
        categoryPrices[l.category].total += Number(l.price_per_unit);
        categoryPrices[l.category].count += 1;
      });

      const priceTrends = Object.entries(categoryPrices)
        .map(([category, { total, count }]) => ({
          category,
          avgPrice: Math.round(total / count),
          listingCount: count,
        }))
        .sort((a, b) => b.listingCount - a.listingCount);

      // Recent listings (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCount = (allActive || []).filter(
        (l) => new Date(l.created_at) >= sevenDaysAgo,
      ).length;

      return {
        totalActive: (allActive || []).length,
        myActiveCount: myActive.length,
        mySoldCount: mySold.length,
        myTotalCount: (myListings || []).length,
        recentCount,
        priceTrends,
      };
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
