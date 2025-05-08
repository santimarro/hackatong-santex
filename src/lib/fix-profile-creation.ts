import { supabase, getCurrentUser } from './supabase';

/**
 * Attempts to create a user profile if one doesn't exist
 * This can be used as a fallback if the automatic profile creation fails
 */
export const ensureUserProfile = async (): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await getCurrentUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return false;
    }
    
    // Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error('Error checking profile existence:', profileCheckError);
    }
    
    // If profile already exists, no need to create one
    if (existingProfile) {
      console.log('User profile already exists');
      return true;
    }
    
    // Get user metadata to extract name
    const fullName = user.user_metadata?.full_name || 'User';
    
    // Try direct insert
    console.log('Attempting profile creation...');
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName,
        created_at: new Date().toISOString(),
        is_doctor: false,
        is_admin: false,
        emergency_info: {
          allergies: [],
          conditions: [],
          medications: [],
          bloodType: '',
          medicationReminders: []
        }
      });
    
    if (insertError) {
      console.error('Error with profile creation:', insertError);
      return false;
    }
    
    console.log('Profile created successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error creating profile:', error);
    return false;
  }
}; 