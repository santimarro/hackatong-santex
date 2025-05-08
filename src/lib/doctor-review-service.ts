import { supabase } from './supabase';

export interface Review {
  id: string;
  consultation_id: string;
  title: string;
  patient_name: string;
  patient_id: string;
  date: string;
  summary_id: string;
  summary_type: string;
  review_status: string | null;
  reviewed_at: string | null;
}

export interface PatientReviews {
  patient_name: string;
  reviews: Review[];
}

export interface ReviewFeed {
  patients: Record<string, PatientReviews>;
}

export type ReviewDecision = 'approve' | 'reject' | 'edit';

export interface SubmitReviewParams {
  doctor_id: string;
  summary_id: string;
  decision: ReviewDecision;
  updated_content?: string;
  review_notes?: string;
}

export interface SubmitReviewResponse {
  success: boolean;
  message: string;
  transaction_id: string;
}

/**
 * Get the review feed for a doctor
 * @param doctorId The UUID of the doctor
 * @returns A promise that resolves to the doctor's review feed
 */
export async function getDoctorReviewFeed(doctorId: string): Promise<ReviewFeed> {
  try {
    const { data, error } = await supabase.functions.invoke('get-doctor-review-feed', {
      method: 'POST',
      body: { doctor_id: doctorId }
    });

    if (error) {
      throw new Error(`Error getting doctor review feed: ${error.message}`);
    }

    return data as ReviewFeed;
  } catch (error) {
    console.error('Error in getDoctorReviewFeed:', error);
    throw error;
  }
}

/**
 * Submit a review decision for a summary
 * @param params Review parameters including doctor_id, summary_id, and decision
 * @returns A promise that resolves to the review submission response
 */
export async function submitSummaryReview(params: SubmitReviewParams): Promise<SubmitReviewResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('submit-summary-review', {
      method: 'POST',
      body: params
    });

    if (error) {
      throw new Error(`Error submitting summary review: ${error.message}`);
    }

    return data as SubmitReviewResponse;
  } catch (error) {
    console.error('Error in submitSummaryReview:', error);
    throw error;
  }
}

/**
 * Get a specific summary with its consultation details
 * @param summaryId The UUID of the summary
 * @returns A promise that resolves to the summary and its related consultation
 */
export async function getSummaryForReview(summaryId: string) {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .select(`
        id,
        type,
        content,
        provider,
        created_at,
        reviewed,
        reviewed_at,
        reviewed_by,
        original_content,
        extracted_data,
        consultation_id,
        consultations (
          id,
          title,
          patient_id,
          doctor_id,
          created_at,
          appointment_date,
          appointment_location,
          status,
          review_status,
          review_notes,
          profiles:patient_id (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', summaryId)
      .single();

    if (error) {
      throw new Error(`Error getting summary for review: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getSummaryForReview:', error);
    throw error;
  }
}

/**
 * Check if the current user can review a specific summary
 * @param summaryId The UUID of the summary
 * @param userId The UUID of the current user
 * @returns A promise that resolves to a boolean indicating if the user can review the summary
 */
export async function canReviewSummary(summaryId: string, userId: string): Promise<boolean> {
  try {
    // First, check if user is a doctor
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('is_doctor')
      .eq('id', userId)
      .single();

    if (userError || !userProfile || !userProfile.is_doctor) {
      return false;
    }

    // Then, check if this doctor is assigned to the consultation
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('consultation_id')
      .eq('id', summaryId)
      .single();

    if (summaryError || !summary) {
      return false;
    }

    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('doctor_id')
      .eq('id', summary.consultation_id)
      .single();

    if (consultationError || !consultation) {
      return false;
    }

    // Return true if this doctor is assigned to the consultation
    return consultation.doctor_id === userId;
  } catch (error) {
    console.error('Error in canReviewSummary:', error);
    return false;
  }
} 