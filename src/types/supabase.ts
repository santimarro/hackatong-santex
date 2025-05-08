export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          doctor_id: string | null
          id: string
          location: string | null
          notes: string | null
          patient_id: string
          scheduled_for: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id: string
          scheduled_for: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string
          scheduled_for?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          consultation_id: string
          created_at: string | null
          file_path: string
          id: string
          metadata: Json | null
          name: string
          size: number
          type: string
        }
        Insert: {
          consultation_id: string
          created_at?: string | null
          file_path: string
          id?: string
          metadata?: Json | null
          name: string
          size: number
          type: string
        }
        Update: {
          consultation_id?: string
          created_at?: string | null
          file_path?: string
          id?: string
          metadata?: Json | null
          name?: string
          size?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          appointment_date: string | null
          appointment_location: string | null
          audio_file_path: string | null
          created_at: string | null
          custom_notes: string | null
          doctor_email: string | null
          doctor_id: string | null
          id: string
          patient_id: string
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          share_hash: string | null
          share_hash_expires_at: string | null
          shared_with_doctor_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_location?: string | null
          audio_file_path?: string | null
          created_at?: string | null
          custom_notes?: string | null
          doctor_email?: string | null
          doctor_id?: string | null
          id?: string
          patient_id: string
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          share_hash?: string | null
          share_hash_expires_at?: string | null
          shared_with_doctor_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_location?: string | null
          audio_file_path?: string | null
          created_at?: string | null
          custom_notes?: string | null
          doctor_email?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          share_hash?: string | null
          share_hash_expires_at?: string | null
          shared_with_doctor_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_invitations: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          doctor_email: string
          id: string
          invitation_sent_at: string | null
          last_reminder_sent_at: string | null
          patient_profile_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_email: string
          id?: string
          invitation_sent_at?: string | null
          last_reminder_sent_at?: string | null
          patient_profile_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_email?: string
          id?: string
          invitation_sent_at?: string | null
          last_reminder_sent_at?: string | null
          patient_profile_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_invitations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_invitations_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_whitelist: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          notes: string | null
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          notes?: string | null
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          notes?: string | null
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_whitelist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          emergency_info: Json | null
          full_name: string | null
          id: string
          institution: string | null
          is_admin: boolean | null
          is_doctor: boolean | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          emergency_info?: Json | null
          full_name?: string | null
          id: string
          institution?: string | null
          is_admin?: boolean | null
          is_doctor?: boolean | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          emergency_info?: Json | null
          full_name?: string | null
          id?: string
          institution?: string | null
          is_admin?: boolean | null
          is_doctor?: boolean | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      summaries: {
        Row: {
          consultation_id: string
          content: string
          created_at: string | null
          extracted_data: Json | null
          id: string
          original_content: string | null
          provider: string | null
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          type: string
        }
        Insert: {
          consultation_id: string
          content: string
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          original_content?: string | null
          provider?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          type: string
        }
        Update: {
          consultation_id?: string
          content?: string
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          original_content?: string | null
          provider?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_reviews: {
        Row: {
          created_at: string | null
          doctor_id: string | null
          id: string
          previous_content: string | null
          review_notes: string | null
          summary_id: string
          updated_content: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          previous_content?: string | null
          review_notes?: string | null
          summary_id: string
          updated_content?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          previous_content?: string | null
          review_notes?: string | null
          summary_id?: string
          updated_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summary_reviews_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          confidence_score: number | null
          consultation_id: string
          content: string
          created_at: string | null
          id: string
          language: string | null
          provider: string | null
          speaker_labels: Json | null
        }
        Insert: {
          confidence_score?: number | null
          consultation_id: string
          content: string
          created_at?: string | null
          id?: string
          language?: string | null
          provider?: string | null
          speaker_labels?: Json | null
        }
        Update: {
          confidence_score?: number | null
          consultation_id?: string
          content?: string
          created_at?: string | null
          id?: string
          language?: string | null
          provider?: string | null
          speaker_labels?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: { user_id: string; user_full_name: string }
        Returns: boolean
      }
      get_consultation_details_by_share_hash: {
        Args: { p_share_hash: string }
        Returns: {
          consultation_id: string
          consultation_title: string
          consultation_status: string
          consultation_review_status: string
          patient_full_name: string
          appointment_date: string
          summary_id: string
          summary_content: string
          summary_type: string
          summary_original_content: string
          summary_is_reviewed: boolean
          summary_reviewed_at: string
          summary_reviewed_by_doctor_name: string
          consultation_current_doctor_id: string
          consultation_shared_to_email: string
        }[]
      }
      get_doctor_pending_reviews: {
        Args: { doctor_id: string }
        Returns: {
          id: string
          consultation_id: string
          title: string
          patient_name: string
          patient_id: string
          date: string
          summary_id: string
          summary_type: string
          review_status: string
          reviewed_at: string
        }[]
      }
      is_email_whitelisted: {
        Args: { signup_email: string }
        Returns: boolean
      }
      submit_summary_review: {
        Args: {
          p_doctor_id: string
          p_summary_id: string
          p_consultation_id: string
          p_decision: string
          p_original_content: string
          p_updated_content: string
          p_review_notes: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
