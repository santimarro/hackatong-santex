# Harvey - Database Schema

This document outlines the database schema for the Harvey application using Supabase PostgreSQL database. The schema is designed to support user authentication, data storage for consultations, transcriptions, summaries, and audio file storage.

## Tables

### profiles
Stores extended user information beyond the default auth.users table.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users.id |
| created_at | timestamp | Timestamp of profile creation |
| updated_at | timestamp | Timestamp of profile update |
| full_name | text | User's full name |
| avatar_url | text | URL to user's avatar image |
| emergency_info | jsonb | Emergency information (blood type, allergies, conditions, etc.) |
| is_doctor | boolean | Whether the user is a doctor |
| specialty | text | Doctor's specialty (if applicable) |
| institution | text | Doctor's institution (if applicable) |

### consultations
The main table for medical consultations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Timestamp of consultation creation |
| updated_at | timestamp | Timestamp of consultation update |
| title | text | Title of the consultation |
| patient_id | uuid | References profiles.id |
| doctor_id | uuid | References profiles.id |
| appointment_date | timestamp | When the appointment occurred |
| appointment_location | text | Where the appointment occurred |
| audio_file_path | text | Path to the audio file in storage |
| status | text | Status of the consultation ('pending', 'transcribing', 'summarizing', 'completed') |
| custom_notes | text | Any additional notes added by the user |
| tags | text[] | Tags for categorizing consultations |

### transcriptions
Stores the raw transcriptions of audio files.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Timestamp of transcription creation |
| consultation_id | uuid | References consultations.id |
| content | text | The full transcription content |
| provider | text | Provider used for transcription (e.g., 'deepgram') |
| confidence_score | float | Overall confidence score of the transcription |
| language | text | Detected language |
| speaker_labels | jsonb | Speaker identification data (if available) |

### summaries
Stores the AI-generated summaries of consultations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Timestamp of summary creation |
| consultation_id | uuid | References consultations.id |
| type | text | Type of summary ('patient', 'medical', 'comprehensive') |
| content | text | The summary content |
| provider | text | AI provider used for summarization (e.g., 'gemini') |
| extracted_data | jsonb | Structured data extracted from the consultation (symptoms, diagnoses, medications, etc.) |

### appointments
Stores upcoming and past appointments.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Timestamp of appointment creation |
| updated_at | timestamp | Timestamp of appointment update |
| patient_id | uuid | References profiles.id |
| doctor_id | uuid | References profiles.id |
| title | text | Title of the appointment |
| scheduled_for | timestamp | When the appointment is scheduled |
| location | text | Appointment location |
| status | text | Status ('scheduled', 'completed', 'cancelled') |
| notes | text | Notes for the appointment |
| consultation_id | uuid | References consultations.id (populated after consultation happens) |

### attachments
Stores information about files attached to consultations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Timestamp of attachment creation |
| consultation_id | uuid | References consultations.id |
| name | text | File name |
| type | text | File type/MIME type |
| size | integer | File size in bytes |
| file_path | text | Path to the file in storage |
| metadata | jsonb | Additional metadata about the file |

## Relationships

- Each user (in profiles) can have multiple consultations as a patient or doctor
- Each consultation is linked to one audio file and can have multiple attachments
- Each consultation has one transcription and multiple summaries (patient, medical)
- Each appointment can be linked to a consultation (after it occurs)

## Storage Buckets

### audio-files
Stores the raw audio recordings from consultations.
- Access: Private, authenticated users only
- File expiration: Configurable retention period

### attachments
Stores files attached to consultations.
- Access: Private, authenticated users only

### profile-images
Stores user profile images.
- Access: Controlled, authorized users only

## Security Policies

The following Row Level Security (RLS) policies should be implemented:

1. Users can only access their own profile information and consultations
2. Doctors can access consultations where they are the doctor_id
3. Shared consultations are accessible by both the patient and the doctor

## Indexes

Add indexes for:
- profiles.id
- consultations.patient_id
- consultations.doctor_id
- transcriptions.consultation_id
- summaries.consultation_id
- appointments.patient_id
- appointments.doctor_id

## Data Lifecycle Management

1. When a consultation is created, first create an entry in the consultations table with status 'pending'
2. When audio is uploaded, update the consultations table with the audio_file_path and set status to 'transcribing'
3. After successful transcription, create an entry in the transcriptions table and update consultation status to 'summarizing'
4. After generating summaries, create entries in the summaries table and update consultation status to 'completed'