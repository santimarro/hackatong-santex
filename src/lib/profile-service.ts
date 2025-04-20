import { supabase } from './supabase';
import { Database } from '../types/supabase';
import { withCache, dataCache } from './utils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Cache TTL constants (in milliseconds)
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const EMERGENCY_INFO_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Original function implementation for getProfile
async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Cached version of getProfile
export const getProfile = withCache(
  fetchProfile,
  (userId: string) => `profile:${userId}`,
  PROFILE_CACHE_TTL
);

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    // Invalidate cache after update
    dataCache.invalidateByPrefix(`profile:${userId}`);
    
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

export async function updateEmergencyInfo(
  userId: string, 
  emergencyInfo: any
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        emergency_info: emergencyInfo,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating emergency info:', error);
      throw error;
    }

    // Invalidate cache after update
    dataCache.invalidateByPrefix(`profile:${userId}`);
    
    return data;
  } catch (error) {
    console.error('Error updating emergency info:', error);
    return null;
  }
}

export async function updateProfileImage(
  userId: string,
  file: File
): Promise<{ avatarUrl: string | null; error: Error | null }> {
  try {
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/profile-${Date.now()}.${fileExt}`;

    // Upload the file to storage
    const { error: uploadError } = await supabase.storage
      .from('profile_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('profile_images')
      .getPublicUrl(filePath);

    // Update the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Invalidate profile cache on image update
    dataCache.invalidateByPrefix(`profile:${userId}`);
    
    return { avatarUrl: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error updating profile image:', error);
    return { avatarUrl: null, error: error as Error };
  }
}