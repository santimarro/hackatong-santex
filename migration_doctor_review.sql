-- Migration for Doctor Review Feature

-- Phase 1.1: Update summaries table
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS original_content TEXT;

-- Phase 1.2: Update consultations table
-- Add new status value to CHECK constraint (requires dropping and recreating constraint, handle with care in production)
-- ALTER TABLE public.consultations DROP CONSTRAINT consultations_status_check;
-- ALTER TABLE public.consultations ADD CONSTRAINT consultations_status_check CHECK (status IN ('pending', 'transcribing', 'summarizing', 'completed', 'pending_review', 'reviewed', 'rejected'));
-- Instead of modifying the check constraint directly which can be risky, let's add the fields first.
-- Consider how to manage the status transition carefully in the application logic.
ALTER TABLE public.consultations
ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending_review', 'reviewed', 'rejected')),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Phase 1.3: Create summary_reviews table
CREATE TABLE IF NOT EXISTS public.summary_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    summary_id UUID NOT NULL REFERENCES public.summaries(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    previous_content TEXT,
    updated_content TEXT,
    review_notes TEXT
);

-- Phase 1.4: Update Indexes
CREATE INDEX IF NOT EXISTS idx_summaries_reviewed ON public.summaries(reviewed);
CREATE INDEX IF NOT EXISTS idx_summaries_reviewed_by ON public.summaries(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_consultations_review_status ON public.consultations(review_status);
CREATE INDEX IF NOT EXISTS idx_summary_reviews_summary_id ON public.summary_reviews(summary_id);
CREATE INDEX IF NOT EXISTS idx_summary_reviews_doctor_id ON public.summary_reviews(doctor_id);

-- Phase 1.4: RLS Policies (Additions/Updates needed)
-- NOTE: Existing RLS policies might need adjustment. These are new policies for the review table.
-- Policy for doctors to view reviews related to summaries they can access
CREATE POLICY "Doctors can view reviews for summaries they have access to"
    ON public.summary_reviews FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.summaries s
        JOIN public.consultations c ON s.consultation_id = c.id
        WHERE s.id = summary_reviews.summary_id
        AND (c.doctor_id = auth.uid() OR c.patient_id = auth.uid()) -- Allow patients to see their reviews too
    ));

-- Policy for doctors to insert reviews for summaries they are assigned to review
CREATE POLICY "Doctors can insert reviews for summaries they are assigned to"
    ON public.summary_reviews FOR INSERT
    WITH CHECK (doctor_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.summaries s
        JOIN public.consultations c ON s.consultation_id = c.id
        WHERE s.id = summary_reviews.summary_id
        AND c.doctor_id = auth.uid() -- Ensure the doctor is assigned to the consultation
    ));

-- NOTE: You'll need to carefully apply this migration to your Supabase instance.
-- Specifically, modifying CHECK constraints often requires careful planning or downtime.
-- Consider adding the new 'review_status' values to the existing 'status' CHECK constraint
-- or managing the review lifecycle primarily through the `review_status` column. 