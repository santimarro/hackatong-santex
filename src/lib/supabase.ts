import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Log a warning if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables', { 
    supabaseUrl: supabaseUrl || 'MISSING', 
    supabaseAnonKey: supabaseAnonKey ? 'PROVIDED BUT HIDDEN' : 'MISSING' 
  });
}

// Create the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Admin functions for email whitelist
export const isEmailWhitelisted = async (email: string) => {
  const { data, error } = await supabase
    .rpc('is_email_whitelisted', { signup_email: email });
  
  if (error) {
    console.error('Error checking if email is whitelisted:', error);
    return false;
  }
  
  return data;
};

export const addEmailToWhitelist = async (email: string, notes?: string) => {
  return await supabase
    .from('email_whitelist')
    .insert({
      email,
      notes,
      created_by: (await getCurrentUser()).data.user?.id
    });
};

export const removeEmailFromWhitelist = async (id: string) => {
  return await supabase
    .from('email_whitelist')
    .delete()
    .eq('id', id);
};

export const getWhitelistedEmails = async () => {
  return await supabase
    .from('email_whitelist')
    .select('*')
    .order('created_at', { ascending: false });
};

// Auth functions
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

// Session management
export const getSession = async () => {
  return await supabase.auth.getSession();
};

// Check if user is admin
export const isUserAdmin = async () => {
  const { data: { user } } = await getCurrentUser();
  
  if (!user) return false;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  if (error || !data) {
    console.error('Error checking if user is admin:', error);
    return false;
  }
  
  return data.is_admin;
};

// Storage functions
export const uploadAudio = async (filePath: string, file: File) => {
  return await supabase.storage
    .from('audio-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
};

export const getAudioUrl = (filePath: string) => {
  return supabase.storage.from('audio-files').getPublicUrl(filePath).data.publicUrl;
};

export const uploadAttachment = async (filePath: string, file: File) => {
  return await supabase.storage
    .from('attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
};

export const getAttachmentUrl = (filePath: string) => {
  return supabase.storage.from('attachments').getPublicUrl(filePath).data.publicUrl;
};

export const uploadProfileImage = async (filePath: string, file: File) => {
  return await supabase.storage
    .from('profile-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });
};

export const getProfileImageUrl = (filePath: string) => {
  return supabase.storage.from('profile-images').getPublicUrl(filePath).data.publicUrl;
};