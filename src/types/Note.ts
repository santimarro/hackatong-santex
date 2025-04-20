// This legacy Note type is maintained for backward compatibility
// with existing components. New components should use the types
// from src/types/supabase.ts instead

import { Database } from './supabase';

export type Consultation = Database['public']['Tables']['consultations']['Row'];
export type Transcription = Database['public']['Tables']['transcriptions']['Row'];
export type Summary = Database['public']['Tables']['summaries']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];
export type EmailWhitelist = Database['public']['Tables']['email_whitelist']['Row'];

export interface Note {
  id: string;
  title: string;
  date: string;
  doctorName?: string;
  specialty?: string;
  location?: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  questions?: string[];
  audioBlob: Blob;
  transcription: string;
  patientSummary: string;
  medicalSummary: string;
  augmentedMedicalSummary?: string;
}

// Utility function to convert from Supabase types to legacy Note type
export function consultationToNote(
  consultation: Consultation,
  transcription?: Transcription | null,
  summaries?: Summary[]
): Note {
  // Find summaries by type
  const patientSummary = summaries?.find(s => s.type === 'patient');
  const medicalSummary = summaries?.find(s => s.type === 'medical');
  const comprehensiveSummary = summaries?.find(s => s.type === 'comprehensive');
  
  // Extract structured data from medical summary if available
  const extractedData = medicalSummary?.extracted_data as any || {};
  
  return {
    id: consultation.id,
    title: consultation.title,
    date: consultation.appointment_date || consultation.created_at,
    doctorName: extractedData.doctorName,
    specialty: extractedData.specialty,
    location: consultation.appointment_location,
    symptoms: extractedData.symptoms || [],
    diagnosis: extractedData.diagnosis,
    treatment: extractedData.treatment,
    followUp: extractedData.followUp,
    questions: extractedData.questions || [],
    // This is a placeholder as we can't store blobs in the database
    // The real audioBlob would need to be fetched from storage
    audioBlob: new Blob(),
    transcription: transcription?.content || '',
    patientSummary: patientSummary?.content || '',
    medicalSummary: medicalSummary?.content || '',
    augmentedMedicalSummary: comprehensiveSummary?.content || '',
  };
}