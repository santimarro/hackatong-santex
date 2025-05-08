-- Migration for RPC function to get consultation by share hash

CREATE OR REPLACE FUNCTION public.get_consultation_details_by_share_hash(p_share_hash TEXT)
RETURNS TABLE (
    consultation_id UUID,
    consultation_title TEXT,
    consultation_status TEXT,
    consultation_review_status TEXT, -- The doctor-facing review status from migration_doctor_review
    patient_full_name TEXT,    -- Consider if full name is appropriate or if a partial/alias is better
    appointment_date TIMESTAMP WITH TIME ZONE,
    summary_id UUID,
    summary_content TEXT,            -- This should be the current content of the summary
    summary_type TEXT,
    summary_original_content TEXT, -- The original content before any edits (from migration_doctor_review)
    summary_is_reviewed BOOLEAN,       -- reviewed flag from summaries table
    summary_reviewed_at TIMESTAMP WITH TIME ZONE,
    summary_reviewed_by_doctor_name TEXT, -- Name of the doctor who reviewed it, if available
    consultation_current_doctor_id UUID, -- The doctor_id currently linked to the consultation (if any)
    consultation_shared_to_email TEXT -- The email this specific share link was intended for (from consultations.doctor_email)
)
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial: Allows the function to bypass RLS for this specific, controlled query
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS consultation_id,
        c.title AS consultation_title,
        c.status AS consultation_status,
        c.review_status AS consultation_review_status,
        p_patient.full_name AS patient_full_name,
        c.appointment_date,
        s.id AS summary_id,
        s.content AS summary_content,
        s.type AS summary_type,
        s.original_content AS summary_original_content,
        s.reviewed AS summary_is_reviewed,
        s.reviewed_at AS summary_reviewed_at,
        p_doctor_reviewer.full_name AS summary_reviewed_by_doctor_name,
        c.doctor_id AS consultation_current_doctor_id,
        c.doctor_email AS consultation_shared_to_email
    FROM
        public.consultations c
    JOIN
        public.profiles p_patient ON c.patient_id = p_patient.id
    LEFT JOIN -- We need to pick the most relevant summary for the doctor, e.g., 'medical' or 'comprehensive'
        public.summaries s ON c.id = s.consultation_id AND s.type IN ('medical', 'comprehensive', 'patient') -- Allow patient summary if others not found
    LEFT JOIN
        public.profiles p_doctor_reviewer ON s.reviewed_by = p_doctor_reviewer.id
    WHERE
        c.share_hash = p_share_hash
        AND c.share_hash_expires_at > NOW()
    ORDER BY
        CASE s.type            WHEN 'medical' THEN 1            WHEN 'comprehensive' THEN 2            WHEN 'patient' THEN 3            ELSE 4        END,
        s.created_at DESC -- If multiple of same best type, take newest
    LIMIT 1; -- Expecting one consultation for a valid hash, and we pick one most relevant summary
END;
$$;

-- Grant execute to anon and authenticated roles so it can be called publicly via RPC
GRANT EXECUTE ON FUNCTION public.get_consultation_details_by_share_hash(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_consultation_details_by_share_hash(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_consultation_details_by_share_hash(TEXT) IS 'Retrieves specific consultation and summary details for a doctor using a secure share hash, respecting expiry. SECURITY DEFINER is used to bypass RLS for this controlled data exposure.'; 