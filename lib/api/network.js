import { useQuery } from '@tanstack/react-query';
import { supabase, supabasePublic } from '../supabase';

export function useGrowers() {
  return useQuery({
    queryKey: ['growers_network'],
    queryFn: async () => {
      // 1. Fetch farmer profiles using supabasePublic to bypass recursive authenticated RLS loops
      const { data: profiles, error: profileErr } = await supabasePublic
        .from('profiles')
        .select('*')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false });

      if (profileErr) throw profileErr;

      // 2. Fetch active listings to cross-reference with growers
      let activeListings = [];
      try {
        const { data: listings } = await supabasePublic
          .from('listings')
          .select('*')
          .eq('status', 'active');
        if (listings) activeListings = listings;
      } catch (e) {
        console.warn('Could not fetch listings for network:', e);
      }

      // 3. Process and enrich grower objects
      const growers = (profiles || []).map((farmer) => {
        const farmerListings = activeListings.filter((l) => l.user_id === farmer.id);
        const acres = Number(farmer.land_area_acres) || 0;

        let scale = 'Smallholder';
        if (acres > 20) scale = 'Commercial';
        else if (acres >= 5) scale = 'Medium Scale';

        return {
          ...farmer,
          displayName: farmer.full_name || `Farmer ${farmer.id.slice(0, 5)}`,
          acres,
          scale,
          activeListings: farmerListings,
          activeLotsCount: farmerListings.length,
          hasDetails: Boolean(farmer.full_name || farmer.district || farmer.village),
        };
      });

      // Sort: farmers with filled names & locations first
      growers.sort((a, b) => {
        if (a.hasDetails && !b.hasDetails) return -1;
        if (!a.hasDetails && b.hasDetails) return 1;
        return b.acres - a.acres;
      });

      // 4. Calculate network statistics
      const totalAcreage = growers.reduce((sum, g) => sum + g.acres, 0);
      const districts = Array.from(
        new Set(growers.map((g) => g.district).filter(Boolean)),
      );
      const totalLots = activeListings.length;

      return {
        growers,
        totalAcreage,
        districts,
        totalGrowers: growers.length,
        totalLots,
      };
    },
  });
}
