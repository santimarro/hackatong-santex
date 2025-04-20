# Supabase Setup Guide for Harvey

This guide walks through setting up Supabase for the Harvey application.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Note your Supabase URL and anon key from the API settings

## Environment Setup

1. Copy `.env.template` to `.env`
2. Fill in your Supabase URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` from this repository
3. Execute the SQL to create all necessary tables and security policies

## Storage Buckets

Create the following storage buckets in your Supabase dashboard:

1. **audio_files**:
   - Security: Private (authenticated users only)
   - File size limit: 50MB
   - Allowed file types: audio/*

2. **attachments**:
   - Security: Private (authenticated users only)
   - File size limit: 20MB
   - Allowed file types: image/*, application/pdf, text/*

3. **profile_images**:
   - Security: Private (authenticated users only)
   - File size limit: 5MB
   - Allowed file types: image/*

## Authentication Setup

1. Navigate to Authentication settings in your Supabase dashboard
2. Configure Email authentication:
   - Set up any required email templates
   - Enable "Confirm email" if desired

## Row Level Security (RLS)

The SQL script includes RLS policies that ensure:

1. Users can only access their own profile information
2. Patients can only view/edit their own consultations and appointments
3. Doctors can only view consultations and appointments where they are involved
4. Related resources (transcriptions, summaries) inherit permissions from their parent consultation

## Testing Your Setup

1. Run the application locally with `npm run dev`
2. Navigate to `/auth` to register a test account
3. Verify you can create and retrieve data based on the RLS policies

## Common Issues

- **CORS errors**: Ensure your site URL is added to the allowed origins in Supabase
- **Auth issues**: Check if email confirmation is required
- **Storage access denied**: Verify your storage bucket policies