import { supabase, uploadAudio } from './supabase';
import { Database } from '../types/supabase';
import { withCache, dataCache } from './utils';

type Consultation = Database['public']['Tables']['consultations']['Row'];
type ConsultationInsert = Database['public']['Tables']['consultations']['Insert'];
type Transcription = Database['public']['Tables']['transcriptions']['Row'];
type TranscriptionInsert = Database['public']['Tables']['transcriptions']['Insert'];
type Summary = Database['public']['Tables']['summaries']['Row'];
type SummaryInsert = Database['public']['Tables']['summaries']['Insert'];

// Cache TTL constants (in milliseconds)
const CONSULTATION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CONSULTATIONS_LIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const TRANSCRIPTION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const SUMMARIES_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function createConsultation(
  consultation: ConsultationInsert
): Promise<Consultation | null> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .insert(consultation)
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation:', error);
      throw error;
    }

    // Invalidate user consultations lists
    if (consultation.patient_id) {
      dataCache.invalidateByPrefix(`consultations:user:${consultation.patient_id}`);
    }
    if (consultation.doctor_id) {
      dataCache.invalidateByPrefix(`consultations:user:${consultation.doctor_id}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating consultation:', error);
    return null;
  }
}

// Original function for fetching a consultation
async function fetchConsultation(id: string): Promise<Consultation | null> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching consultation:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return null;
  }
}

// Cached version of getConsultation
export const getConsultation = withCache(
  fetchConsultation,
  (id: string) => `consultation:${id}`,
  CONSULTATION_CACHE_TTL
);

// Original function for fetching user consultations
async function fetchUserConsultations(userId: string): Promise<Consultation[]> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return [];
  }
}

// Cached version of getUserConsultations
export const getUserConsultations = withCache(
  fetchUserConsultations,
  (userId: string) => `consultations:user:${userId}`,
  CONSULTATIONS_LIST_CACHE_TTL
);

export async function updateConsultation(
  id: string,
  updates: Partial<Consultation>
): Promise<Consultation | null> {
  try {
    const { data, error } = await supabase
      .from('consultations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }

    // Invalidate specific consultation cache
    dataCache.invalidate(`consultation:${id}`);
    
    // Invalidate user consultation list caches
    // We need the consultation to get user IDs
    const consultation = await fetchConsultation(id);
    if (consultation) {
      if (consultation.patient_id) {
        dataCache.invalidateByPrefix(`consultations:user:${consultation.patient_id}`);
      }
      if (consultation.doctor_id) {
        dataCache.invalidateByPrefix(`consultations:user:${consultation.doctor_id}`);
      }
    }

    // Invalidate related data
    dataCache.invalidateByPrefix(`transcription:${id}`);
    dataCache.invalidateByPrefix(`summaries:${id}`);

    return data;
  } catch (error) {
    console.error('Error updating consultation:', error);
    return null;
  }
}

export async function uploadConsultationAudio(
  consultationId: string,
  file: File,
  userId: string
): Promise<{ filePath: string | null; error: Error | null }> {
  try {
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${consultationId}/audio-${Date.now()}.${fileExt}`;

    // Upload the file to storage
    const { error: uploadError } = await uploadAudio(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Update the consultation with the file path
    const { error: updateError } = await supabase
      .from('consultations')
      .update({
        audio_file_path: filePath,
        status: 'transcribing',
        updated_at: new Date().toISOString()
      })
      .eq('id', consultationId);

    if (updateError) {
      throw updateError;
    }

    // Invalidate consultation cache
    dataCache.invalidate(`consultation:${consultationId}`);
    dataCache.invalidateByPrefix(`consultations:user:${userId}`);

    return { filePath, error: null };
  } catch (error) {
    console.error('Error uploading consultation audio:', error);
    return { filePath: null, error: error as Error };
  }
}

export async function createTranscription(
  transcription: TranscriptionInsert
): Promise<Transcription | null> {
  try {
    const { data, error } = await supabase
      .from('transcriptions')
      .insert(transcription)
      .select()
      .single();

    if (error) {
      console.error('Error creating transcription:', error);
      throw error;
    }

    // Update consultation status
    await supabase
      .from('consultations')
      .update({
        status: 'summarizing',
        updated_at: new Date().toISOString()
      })
      .eq('id', transcription.consultation_id);

    // Invalidate consultation and transcription caches
    dataCache.invalidate(`consultation:${transcription.consultation_id}`);
    dataCache.invalidate(`transcription:${transcription.consultation_id}`);

    return data;
  } catch (error) {
    console.error('Error creating transcription:', error);
    return null;
  }
}

// Original function for fetching transcription
async function fetchTranscription(consultationId: string): Promise<Transcription | null> {
  try {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching transcription:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching transcription:', error);
    return null;
  }
}

// Cached version of getTranscription
export const getTranscription = withCache(
  fetchTranscription,
  (consultationId: string) => `transcription:${consultationId}`,
  TRANSCRIPTION_CACHE_TTL
);

export async function createSummary(
  summary: SummaryInsert
): Promise<Summary | null> {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .insert(summary)
      .select()
      .single();

    if (error) {
      console.error('Error creating summary:', error);
      throw error;
    }

    // If this is the first summary being created for this consultation,
    // don't update the status yet
    const { count } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('consultation_id', summary.consultation_id);

    // If we have both a patient and medical summary, update status to completed
    if (count && count >= 2) {
      await supabase
        .from('consultations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', summary.consultation_id);
        
      // Invalidate consultation cache
      dataCache.invalidate(`consultation:${summary.consultation_id}`);
    }

    // Invalidate summaries cache
    dataCache.invalidateByPrefix(`summaries:${summary.consultation_id}`);
    // Invalidate specific summary type cache
    dataCache.invalidate(`summary:${summary.consultation_id}:${summary.type}`);

    return data;
  } catch (error) {
    console.error('Error creating summary:', error);
    return null;
  }
}

// Original function for fetching summaries
async function fetchSummaries(consultationId: string): Promise<Summary[]> {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('consultation_id', consultationId);

    if (error) {
      console.error('Error fetching summaries:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching summaries:', error);
    return [];
  }
}

// Cached version of getSummaries
export const getSummaries = withCache(
  fetchSummaries,
  (consultationId: string) => `summaries:${consultationId}:all`,
  SUMMARIES_CACHE_TTL
);

// Original function for fetching summary by type
async function fetchSummaryByType(
  consultationId: string,
  type: string
): Promise<Summary | null> {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('consultation_id', consultationId)
      .eq('type', type)
      .single();

    if (error) {
      console.error(`Error fetching ${type} summary:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${type} summary:`, error);
    return null;
  }
}

// Cached version of getSummaryByType
export const getSummaryByType = withCache(
  fetchSummaryByType,
  (consultationId: string, type: string) => `summary:${consultationId}:${type}`,
  SUMMARIES_CACHE_TTL
);