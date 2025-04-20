export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          full_name: string | null
          avatar_url: string | null
          emergency_info: Json | null
          is_doctor: boolean
          is_admin: boolean
          specialty: string | null
          institution: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          emergency_info?: Json | null
          is_doctor?: boolean
          is_admin?: boolean
          specialty?: string | null
          institution?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          full_name?: string | null
          avatar_url?: string | null
          emergency_info?: Json | null
          is_doctor?: boolean
          is_admin?: boolean
          specialty?: string | null
          institution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      consultations: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          title: string
          patient_id: string
          doctor_id: string | null
          appointment_date: string | null
          appointment_location: string | null
          audio_file_path: string | null
          status: string
          custom_notes: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title: string
          patient_id: string
          doctor_id?: string | null
          appointment_date?: string | null
          appointment_location?: string | null
          audio_file_path?: string | null
          status?: string
          custom_notes?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title?: string
          patient_id?: string
          doctor_id?: string | null
          appointment_date?: string | null
          appointment_location?: string | null
          audio_file_path?: string | null
          status?: string
          custom_notes?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      transcriptions: {
        Row: {
          id: string
          created_at: string
          consultation_id: string
          content: string
          provider: string | null
          confidence_score: number | null
          language: string | null
          speaker_labels: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          consultation_id: string
          content: string
          provider?: string | null
          confidence_score?: number | null
          language?: string | null
          speaker_labels?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          consultation_id?: string
          content?: string
          provider?: string | null
          confidence_score?: number | null
          language?: string | null
          speaker_labels?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          }
        ]
      }
      summaries: {
        Row: {
          id: string
          created_at: string
          consultation_id: string
          type: string
          content: string
          provider: string | null
          extracted_data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          consultation_id: string
          type: string
          content: string
          provider?: string | null
          extracted_data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          consultation_id?: string
          type?: string
          content?: string
          provider?: string | null
          extracted_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "summaries_consultation_id_fkey"
            columns: ["consultation_id"]
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          patient_id: string
          doctor_id: string | null
          title: string
          scheduled_for: string
          location: string | null
          status: string
          notes: string | null
          consultation_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          patient_id: string
          doctor_id?: string | null
          title: string
          scheduled_for: string
          location?: string | null
          status?: string
          notes?: string | null
          consultation_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          patient_id?: string
          doctor_id?: string | null
          title?: string
          scheduled_for?: string
          location?: string | null
          status?: string
          notes?: string | null
          consultation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_consultation_id_fkey"
            columns: ["consultation_id"]
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          }
        ]
      }
      attachments: {
        Row: {
          id: string
          created_at: string
          consultation_id: string
          name: string
          type: string
          size: number
          file_path: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          consultation_id: string
          name: string
          type: string
          size: number
          file_path: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          consultation_id?: string
          name?: string
          type?: string
          size?: number
          file_path?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_consultation_id_fkey"
            columns: ["consultation_id"]
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          }
        ]
      }
      email_whitelist: {
        Row: {
          id: string
          created_at: string
          created_by: string | null
          email: string
          notes: string | null
          used: boolean
          used_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          created_by?: string | null
          email: string
          notes?: string | null
          used?: boolean
          used_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          notes?: string | null
          used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_whitelist_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_email_whitelisted: {
        Args: {
          signup_email: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}