import { Note } from '@/types/Note';
import { supabase } from './supabase';

/**
 * Gets the review status as a human-readable string
 * @param status The review status from the database
 * @returns A display-friendly status string
 */
export function getReviewStatusText(status: string | null | undefined): string {
  if (!status) return 'Pending';
  
  switch (status) {
    case 'reviewed':
      return 'Verified';
    case 'rejected':
      return 'Rejected';
    case 'pending_review':
      return 'Pending Review';
    default:
      return 'Pending';
  }
}

/**
 * Gets the color class for a given review status
 * @param status The review status from the database
 * @returns A CSS color class
 */
export function getReviewStatusColor(status: string | null | undefined): string {
  if (!status) return 'text-amber-500';
  
  switch (status) {
    case 'reviewed':
      return 'text-green-500';
    case 'rejected':
      return 'text-red-500';
    case 'pending_review':
      return 'text-amber-500';
    default:
      return 'text-amber-500';
  }
}

/**
 * Check if a note has been modified by a doctor
 * @param note The note to check
 * @returns True if the note has been edited by a doctor
 */
export function isNoteEdited(note: Note): boolean {
  return note.reviewStatus === 'reviewed' && 
         note.original_content !== null && 
         note.original_content !== undefined &&
         note.original_content !== note.medicalSummary;
}

/**
 * Fetch the doctor's name who reviewed a note
 * @param reviewedBy UUID of the doctor who reviewed the note
 * @returns Promise resolving to the doctor's name or null
 */
export async function getReviewerName(reviewedBy: string | null | undefined): Promise<string | null> {
  if (!reviewedBy) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', reviewedBy)
      .single();
    
    if (error || !data) return null;
    
    return data.full_name;
  } catch (error) {
    console.error('Error fetching reviewer name:', error);
    return null;
  }
}

/**
 * Format a timestamp in a user-friendly way
 * @param timestamp ISO timestamp string
 * @returns Formatted date and time string
 */
export function formatReviewDate(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
} 