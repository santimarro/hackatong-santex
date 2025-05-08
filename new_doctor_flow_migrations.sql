-- Migration for New Doctor Flow (Share via Link & Invitations)

-- Add new columns to the 'consultations' table for sharing with doctors
ALTER TABLE public.consultations
ADD COLUMN IF NOT EXISTS doctor_email TEXT NULL,
ADD COLUMN IF NOT EXISTS shared_with_doctor_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS share_hash TEXT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS share_hash_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Create 'doctor_invitations' table
CREATE TABLE IF NOT EXISTS public.doctor_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_email TEXT NOT NULL,
    consultation_id UUID NULL REFERENCES public.consultations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending_invitation', -- e.g., 'pending_invitation', 'sent', 'link_opened', 'registered', 'declined', 'error_sending'
    invitation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_reminder_sent_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_invitation_per_consultation UNIQUE (doctor_email, consultation_id) -- Optional: prevent duplicate invites for the same consultation
    -- Consider if a patient can invite the same doctor multiple times for different consultations, or a general invite without consultation_id
);

-- Create or ensure the trigger function for updating 'updated_at' exists
-- This function is usually present from the initial supabase-schema.sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to 'doctor_invitations' table for 'updated_at'
CREATE TRIGGER update_doctor_invitations_updated_at
BEFORE UPDATE ON public.doctor_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for doctor_invitations
ALTER TABLE public.doctor_invitations ENABLE ROW LEVEL SECURITY;

-- Patients can manage (create, view, potentially delete) invitations they sent
CREATE POLICY "Patients can manage their own doctor invitations"
ON public.doctor_invitations
FOR ALL
USING (auth.uid() = patient_profile_id)
WITH CHECK (auth.uid() = patient_profile_id);

-- Doctors (once registered and identified by email) could potentially view invitations sent to them
-- This requires a way to link doctor_email to a profile.id after registration.
-- For now, keeping it simple: admin can see all.
CREATE POLICY "Admins can view all doctor invitations"
ON public.doctor_invitations
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
));


-- Indexes for 'doctor_invitations'
CREATE INDEX IF NOT EXISTS idx_doctor_invitations_patient_id ON public.doctor_invitations(patient_profile_id);
CREATE INDEX IF NOT EXISTS idx_doctor_invitations_doctor_email ON public.doctor_invitations(doctor_email);
CREATE INDEX IF NOT EXISTS idx_doctor_invitations_consultation_id ON public.doctor_invitations(consultation_id);
CREATE INDEX IF NOT EXISTS idx_doctor_invitations_status ON public.doctor_invitations(status);

COMMENT ON COLUMN public.consultations.doctor_email IS 'Email of the doctor this consultation was shared with via link, if not already a registered and linked doctor.';
COMMENT ON COLUMN public.consultations.shared_with_doctor_at IS 'Timestamp when the consultation was shared with an external doctor via a hash link.';
COMMENT ON COLUMN public.consultations.share_hash IS 'Secure hash for temporary doctor access to a specific consultation.';
COMMENT ON COLUMN public.consultations.share_hash_expires_at IS 'Expiry timestamp for the share_hash.';

COMMENT ON TABLE public.doctor_invitations IS 'Tracks invitations sent by patients to doctors to join Harvey or review specific consultations.';
COMMENT ON COLUMN public.doctor_invitations.status IS 'Status of the invitation (e.g., pending_invitation, sent, link_opened, registered, declined, error_sending).';
-- Note: The RLS policy for doctors viewing their invitations would be more complex:
-- It would likely involve a function that checks if the current user's email (from profiles) matches doctor_email in the invitations table.
-- e.g., USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.email = doctor_invitations.doctor_email AND profiles.is_doctor = TRUE))
-- However, Supabase auth.users table stores email, not profiles directly. We would need to ensure profile.email is reliably populated and used.
-- The 'profiles' table in the provided schema does not have an 'email' column, it uses 'id' from 'auth.users'.
-- So, a function to get auth.email for auth.uid() would be needed for such a policy.
-- For now, the admin policy provides visibility.

-- Reminder to integrate with `migration_doctor_review.sql`
-- The fields `review_status`, `reviewed_at`, `review_notes` in `consultations` table (from migration_doctor_review.sql)
-- and the `summaries` table changes (`reviewed`, `reviewed_at`, `reviewed_by`, `original_content`)
-- and the `summary_reviews` table are all highly relevant and should be used.
-- This current migration is additive for the "share via link" and "invitation tracking" aspects. 