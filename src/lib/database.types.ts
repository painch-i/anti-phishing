import type { SubmissionStatus, Verdict } from "@/lib/domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string;
          submitted_by: string | null;
          intake_completed_at: string | null;
          public_reference: string;
          response_email: string;
          submitted_text: string | null;
          submitted_urls: Json;
          context: string | null;
          status: SubmissionStatus;
          verdict: Verdict | null;
          verdict_explanation: string | null;
          reviewed_at: string | null;
          email_sent_at: string | null;
          email_last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          intake_completed_at?: string | null;
          public_reference: string;
          response_email: string;
          submitted_text?: string | null;
          submitted_urls?: Json;
          context?: string | null;
          status?: SubmissionStatus;
          verdict?: Verdict | null;
          verdict_explanation?: string | null;
          reviewed_at?: string | null;
          email_sent_at?: string | null;
          email_last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          intake_completed_at?: string | null;
          public_reference?: string;
          response_email?: string;
          submitted_text?: string | null;
          submitted_urls?: Json;
          context?: string | null;
          status?: SubmissionStatus;
          verdict?: Verdict | null;
          verdict_explanation?: string | null;
          reviewed_at?: string | null;
          email_sent_at?: string | null;
          email_last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      submission_assets: {
        Row: {
          id: string;
          submission_id: string;
          file_name: string;
          content_type: string;
          size_bytes: number;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          file_name: string;
          content_type: string;
          size_bytes: number;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          file_name?: string;
          content_type?: string;
          size_bytes?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submission_assets_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      complete_submission: { Args: { submission_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
export type SubmissionAssetRow = Database["public"]["Tables"]["submission_assets"]["Row"];
