-- Admin system for Harvey - Email whitelist and access control

-- 1. Add is_admin field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT TRUE;

-- 2. Create email whitelist table
CREATE TABLE IF NOT EXISTS public.email_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    notes TEXT,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create index on email column
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON public.email_whitelist(email);

-- 4. Enable Row Level Security for whitelist table
ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for email_whitelist table
-- Only admins can view the whitelist
CREATE POLICY "Admins can view email whitelist"
    ON public.email_whitelist FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    ));

-- Only admins can add emails to whitelist
CREATE POLICY "Admins can add to email whitelist"
    ON public.email_whitelist FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    ));

-- Only admins can update whitelist entries
CREATE POLICY "Admins can update email whitelist"
    ON public.email_whitelist FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    ));

-- Only admins can delete from whitelist
CREATE POLICY "Admins can delete from email whitelist"
    ON public.email_whitelist FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    ));

-- 6. Create function to check if email is in whitelist
CREATE OR REPLACE FUNCTION public.is_email_whitelisted(signup_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.email_whitelist
        WHERE email = signup_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to mark whitelist entry as used when a user signs up
CREATE OR REPLACE FUNCTION public.mark_email_as_used()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.email_whitelist
    SET used = TRUE, used_at = NOW()
    WHERE email = NEW.email AND used = FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to mark whitelist entry as used on signup
CREATE OR REPLACE TRIGGER mark_email_as_used_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.mark_email_as_used();