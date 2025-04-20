# Admin System Setup and Usage

## Introduction

Harvey now includes an admin system for controlling user registration through an email whitelist. This prevents unauthorized users from signing up and ensures only approved individuals can access the application.

## Features

- Admin dashboard to manage whitelisted emails
- Email whitelist for access control
- Admin users can add, view, and remove emails from the whitelist
- Sign-up process checks against the whitelist
- Access restricted areas for admin users only

## Setup Instructions

### 1. Apply the Database Schema Changes

Run the SQL commands in the `admin-system.sql` file against your Supabase database. This will:

- Add an `is_admin` field to the `profiles` table
- Create a new `email_whitelist` table
- Set up the necessary indexes and Row Level Security (RLS) policies
- Create functions to check and track email usage

```sql
-- Run the admin-system.sql file in your Supabase SQL editor
```

### 2. Promote an Existing User to Admin

To create your first admin user, run the following SQL query in the Supabase SQL editor, replacing `[USER_EMAIL]` with the email of the user you want to make an admin:

```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = '[USER_EMAIL]'
);
```

### 3. Add Initial Whitelisted Emails

To add your first whitelisted emails, run this SQL query:

```sql
INSERT INTO public.email_whitelist (email, notes)
VALUES
  ('user1@example.com', 'First user'),
  ('user2@example.com', 'Second user');
```

## Usage

### Admin Dashboard

Once you've set up an admin user, they can access the Admin Dashboard by:

1. Logging in with their credentials
2. An "Admin Dashboard" section will appear on their Dashboard page
3. Clicking the "Access Admin Panel" button to navigate to `/admin`

### Managing Whitelisted Emails

In the Admin Dashboard:

- View all whitelisted emails and their status (used/unused)
- Add new emails to the whitelist (with optional notes)
- Remove emails from the whitelist

### User Sign-up Process

The sign-up process has been modified to:

1. Check if the email is in the whitelist before allowing registration
2. Display a clear error message if the email is not authorized
3. Track when a whitelisted email has been used

## Security Considerations

- Only admin users can access the admin dashboard
- Row Level Security policies ensure only admins can read/write to the whitelist table
- Regular users cannot see or access any admin functionality

## Troubleshooting

If you encounter issues:

1. Ensure the SQL scripts ran successfully
2. Check that you've promoted at least one user to admin
3. Make sure the whitelisted emails are correctly entered
4. Look for any errors in the browser console or server logs

## Future Improvements

Potential enhancements for this admin system:

- Bulk import/export of whitelisted emails
- Admin user management (promote/demote admins)
- Audit logs for admin actions
- More granular permissions system