import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabasePublic } from '../supabase';

// ── Helper: Attach counterparty profiles (Farmer & Retailer) to orders ─────
async function attachCounterpartyProfiles(orders) {
  if (!orders || orders.length === 0) return [];

  const profileIds = [
    ...new Set(
      orders
        .flatMap((o) => [o.farmer_id, o.retailer_id])
        .filter(Boolean)
    ),
  ];

  if (profileIds.length === 0) return orders;

  const { data: profiles } = await supabasePublic
    .from('profiles')
    .select('id, full_name, phone, village, district, role')
    .in('id', profileIds);

  const profileMap = {};
  (profiles || []).forEach((p) => {
    profileMap[p.id] = p;
  });

  return orders.map((order) => ({
    ...order,
    farmer: profileMap[order.farmer_id] || null,
    retailer: profileMap[order.retailer_id] || null,
  }));
}

// ── Fetch orders for the current user (as buyer, seller, or both) ───────────
export function useOrders({ role, statusFilter } = {}) {
  return useQuery({
    queryKey: ['orders', { role, statusFilter }],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query = query.in('status', ['pending', 'confirmed', 'dispatched']);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      const { data, error } = await query;
      if (error) {
        // Graceful handling if orders table hasn't been created yet in user's remote DB
        console.warn('Orders query warning:', error.message);
        return [];
      }

      return attachCounterpartyProfiles(data || []);
    },
  });
}

// ── Fetch single order by ID ───────────────────────────────────────────────
export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      const [enriched] = await attachCounterpartyProfiles([data]);
      return enriched;
    },
    enabled: !!id,
  });
}

// ── Create a wholesale procurement order ───────────────────────────────────
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listing_id,
      farmer_id,
      retailer_id,
      crop_name,
      category,
      quantity,
      unit,
      unit_price,
      total_amount,
      delivery_address,
      delivery_phone,
      notes,
      linked_crop_id,
    }) => {
      // 1. Insert order record
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          listing_id: listing_id || null,
          farmer_id,
          retailer_id,
          crop_name,
          category,
          quantity: Number(quantity),
          unit,
          unit_price: Number(unit_price),
          total_amount: Number(total_amount),
          status: 'pending',
          delivery_address,
          delivery_phone: delivery_phone || null,
          notes: notes || null,
          linked_crop_id: linked_crop_id || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Adjust listing inventory if attached to an active listing
      if (listing_id) {
        try {
          const { data: currentListing } = await supabase
            .from('listings')
            .select('quantity_available')
            .eq('id', listing_id)
            .single();

          if (currentListing) {
            const remaining = Number(currentListing.quantity_available) - Number(quantity);
            if (remaining <= 0) {
              await supabase
                .from('listings')
                .update({ quantity_available: 0, status: 'sold' })
                .eq('id', listing_id);
            } else {
              await supabase
                .from('listings')
                .update({ quantity_available: remaining })
                .eq('id', listing_id);
            }
          }
        } catch (invErr) {
          console.warn('Inventory update notice:', invErr?.message);
        }
      }

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace_stats'] });
    },
  });
}

// ── Update order status (with auto-sync to farm ledger on delivery) ────────
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, nextStatus, currentOrder }) => {
      // 1. Update order status
      const updates = { status: nextStatus };

      // 2. If transitioning to delivered, sync with farmer's ledger
      if (nextStatus === 'delivered' && currentOrder && !currentOrder.ledger_transaction_id) {
        try {
          const transactionData = {
            user_id: currentOrder.farmer_id,
            amount: Number(currentOrder.total_amount),
            type: 'income',
            category: 'Crop Sale',
            description: `Wholesale Order Settlement: ${currentOrder.crop_name} (${currentOrder.quantity} ${currentOrder.unit}) - PO #${currentOrder.id.slice(0, 8)}`,
            transaction_date: new Date().toISOString().split('T')[0],
          };

          // Attach linked crop ID if present
          if (currentOrder.linked_crop_id) {
            transactionData.crop_id = currentOrder.linked_crop_id;
          }

          const { data: tx, error: txErr } = await supabase
            .from('transactions')
            .insert(transactionData)
            .select()
            .single();

          if (!txErr && tx) {
            updates.ledger_transaction_id = tx.id;
          } else {
            console.warn('Auto-ledger insert notice:', txErr?.message);
          }
        } catch (syncErr) {
          console.warn('Ledger sync notice:', syncErr?.message);
        }
      }

      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (updateErr) throw updateErr;
      return updatedOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['crop_profits'] });
      queryClient.invalidateQueries({ queryKey: ['farmer_stats'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

