-- Create tables & extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    avatar_url TEXT,
    emergency_info JSONB,
    is_doctor BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    specialty TEXT,
    institution TEXT
);

-- Create consultations table
CREATE TABLE public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    title TEXT NOT NULL,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    appointment_date TIMESTAMP WITH TIME ZONE,
    appointment_location TEXT,
    audio_file_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'transcribing', 'summarizing', 'completed')),
    custom_notes TEXT,
    tags TEXT[]
);

-- Create transcriptions table
CREATE TABLE public.transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    provider TEXT,
    confidence_score FLOAT,
    language TEXT,
    speaker_labels JSONB
);

-- Create summaries table
CREATE TABLE public.summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('patient', 'medical', 'comprehensive', 'reminders')),
    content TEXT NOT NULL,
    provider TEXT,
    extracted_data JSONB
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL
);

-- Create attachments table
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    metadata JSONB
);

-- Create email whitelist table
CREATE TABLE public.email_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    notes TEXT,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_profiles_id ON public.profiles(id);
CREATE INDEX idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX idx_transcriptions_consultation_id ON public.transcriptions(consultation_id);
CREATE INDEX idx_summaries_consultation_id ON public.summaries(consultation_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_scheduled_for ON public.appointments(scheduled_for);
CREATE INDEX idx_email_whitelist_email ON public.email_whitelist(email);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Consultations policies
CREATE POLICY "Patients can view their consultations"
    ON public.consultations FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view consultations they're involved in"
    ON public.consultations FOR SELECT
    USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can create their consultations"
    ON public.consultations FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their consultations"
    ON public.consultations FOR UPDATE
    USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update consultations they're involved in"
    ON public.consultations FOR UPDATE
    USING (auth.uid() = doctor_id);

-- Transcriptions policies
CREATE POLICY "Patients can view their transcriptions"
    ON public.transcriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.consultations
        WHERE consultations.id = transcriptions.consultation_id
        AND consultations.patient_id = auth.uid()
    ));

CREATE POLICY "Doctors can view transcriptions of their consultations"
    ON public.transcriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.consultations
        WHERE consultations.id = transcriptions.consultation_id
        AND consultations.doctor_id = auth.uid()
    ));

-- Summaries policies
CREATE POLICY "Patients can view their summaries"
    ON public.summaries FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.consultations
        WHERE consultations.id = summaries.consultation_id
        AND consultations.patient_id = auth.uid()
    ));

CREATE POLICY "Doctors can view summaries of their consultations"
    ON public.summaries FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.consultations
        WHERE consultations.id = summaries.consultation_id
        AND consultations.doctor_id = auth.uid()
    ));

-- Appointments policies
CREATE POLICY "Patients can view their appointments"
    ON public.appointments FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view appointments they're involved in"
    ON public.appointments FOR SELECT
    USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can create their appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their appointments"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update appointments they're involved in"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = doctor_id);

-- Attachments policies
CREATE POLICY "Patients can view their attachments"
    ON public.attachments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.consultations
        WHERE consultations.id = attachments.consultation_id
        AND consultations.patient_id = auth.uid()
    ));

CREATE POLICY "Doctors can view attachments of their consultations"
    ON public.attachments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.consultations
        WHERE consultations.id = attachments.consultation_id
        AND consultations.doctor_id = auth.uid()
    ));

-- Create storage buckets
-- These will need to be created through the Supabase dashboard or CLI
-- audio_files
-- attachments
-- profile_images

-- Create trigger for updating the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON public.consultations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for creating a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, is_doctor)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NULL, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();