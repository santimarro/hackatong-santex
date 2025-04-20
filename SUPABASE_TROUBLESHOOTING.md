# Supabase Troubleshooting Guide

This guide covers common issues and solutions for Supabase integration in the Harvey   I am app.

## Connection Issues

### "Failed to fetch" Error

If you're seeing a "Failed to fetch" error, try these solutions:

1. **Check Environment Variables**:
   - Verify that `.env` has correct values for:
     - `VITE_SUPABASE_URL` (should be like `https://your-project-id.supabase.co`)
     - `VITE_SUPABASE_ANON_KEY` (should be a long JWT token)
   - Ensure there are no extra spaces or quotes
   - Restart your development server after changes

2. **Network Connectivity**:
   - Check if your network can reach the Supabase URL
   - Try the URL tester in the Debug page
   - Verify the URL is correctly formatted

3. **Bucket Names**:
   - Create these storage buckets in Supabase:
     - `audio_files` (not `audio-files`)
     - `attachments`
     - `profile_images` (not `profile-images`)
   - Bucket names must match exactly, including underscores

### Authentication Issues

1. **Enable Email Authentication**:
   - Check Supabase dashboard → Authentication → Providers
   - Ensure Email authentication is enabled

2. **Check CORS Configuration**:
   - Go to Supabase dashboard → API → Settings → API Settings
   - Add your app's URL to the "Additional allowed CORS origins"
   - For local development, add `http://localhost:8080`

3. **Check API Keys**:
   - Verify your anon key hasn't expired
   - Ensure you're using the anon key, not the service key

## Database Connection Problems

1. **Check RLS Policies**:
   - The SQL initialization script creates RLS policies
   - Verify these are set up correctly in Supabase dashboard → Database → Policies

2. **Check Table Structure**:
   - Compare your actual table structure with the schema.sql file
   - Ensure all tables have the required columns and relationships

## Storage Issues

1. **Bucket Configuration**:
   - Ensure buckets have correct permissions:
     - Authentication required
     - RLS enabled
     - Appropriate file size limits

2. **Verify Storage API**:
   - Try the Storage Bucket Test in the Debug page
   - Check console for specific errors

## Debug Tools Usage

1. Visit `/debug` in your application
2. Use the various tools to diagnose specific issues:
   - URL Tester: Verify network connectivity
   - Supabase Test: Test the database connection
   - Storage Bucket Test: Verify storage buckets

## Complete Reset

If all else fails, try these steps:

1. **Clear Browser Storage**:
   - Use the browser storage tools in the Debug page
   - Or manually clear localStorage and sessionStorage

2. **Recreate Tables**:
   - Run the SQL script again to reset all tables
   - Caution: This will delete all data

3. **Reinstall Dependencies**:
   ```
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

4. **Try a Different Browser**:
   - Sometimes browser extensions or settings can interfere