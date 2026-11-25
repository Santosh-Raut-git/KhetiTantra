import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { decode } from 'base64-arraybuffer';

/**
 * Upload crop scan image to Supabase storage receipts bucket
 */
export async function uploadScanImage(base64Image, userId) {
  if (!base64Image || !userId) return null;
  try {
    const fileName = `${userId}/scans_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, decode(base64Image), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.warn('Scan image upload notice:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn('Error uploading scan image:', err);
    return null;
  }
}

/**
 * Hook to retrieve user's historical crop diagnoses
 */
export function useCropDiagnoses({ cropId } = {}) {
  return useQuery({
    queryKey: ['crop_diagnoses', { cropId }],
    queryFn: async () => {
      let query = supabase
        .from('crop_diagnoses')
        .select(`
          *,
          crop:crops(crop_name, variety, season)
        `)
        .order('created_at', { ascending: false });

      if (cropId) {
        query = query.eq('crop_id', cropId);
      }

      const { data, error } = await query;
      if (error) {
        // Table may not have been created yet via migration
        console.warn('Crop diagnoses query notice:', error.message);
        return [];
      }
      return data || [];
    },
  });
}

/**
 * Hook to save a diagnosis result
 */
export function useSaveCropDiagnosis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cropId,
      cropName,
      diagnosis,
      notes,
      base64Image,
      localImageUri,
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to save crop diagnoses.');
      }

      // Try uploading image if base64 provided
      let remoteImageUrl = null;
      if (base64Image) {
        remoteImageUrl = await uploadScanImage(base64Image, user.id);
      }

      const payload = {
        user_id: user.id,
        crop_id: cropId || null,
        image_url: remoteImageUrl || localImageUri || null,
        crop_name: diagnosis.crop_name || cropName || 'General Crop',
        health_status: diagnosis.health_status || 'unknown',
        diagnosis_title: diagnosis.diagnosis_title || 'Plant Health Scan',
        scientific_name: diagnosis.scientific_name || null,
        severity: diagnosis.severity || 'low',
        confidence_score: diagnosis.confidence_score || null,
        urgency_message: diagnosis.urgency_message || null,
        symptoms: diagnosis.symptoms || [],
        cause: diagnosis.cause || null,
        treatments: diagnosis.treatments || {},
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from('crop_diagnoses')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn('Save diagnosis DB warning:', error.message);
        // Return local payload with generated id if remote table pending migration
        return { ...payload, id: 'local_' + Date.now(), created_at: new Date().toISOString() };
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop_diagnoses'] });
    },
  });
}

/**
 * Hook to delete a saved diagnosis
 */
export function useDeleteCropDiagnosis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (id.startsWith('local_')) return;
      const { error } = await supabase
        .from('crop_diagnoses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop_diagnoses'] });
    },
  });
}

