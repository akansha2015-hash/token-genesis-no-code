export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          merchant_id: string | null
          operation_type: string
          request_data: Json | null
          request_ip: string | null
          response_status: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          merchant_id?: string | null
          operation_type: string
          request_data?: Json | null
          request_ip?: string | null
          response_status?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          merchant_id?: string | null
          operation_type?: string
          request_data?: Json | null
          request_ip?: string | null
          response_status?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_brand: string | null
          created_at: string
          customer_id: string | null
          expiry_month: number
          expiry_year: number
          id: string
          issuer_id: string | null
          last_four: string
          pan_encrypted: string
          updated_at: string
        }
        Insert: {
          card_brand?: string | null
          created_at?: string
          customer_id?: string | null
          expiry_month: number
          expiry_year: number
          id?: string
          issuer_id?: string | null
          last_four: string
          pan_encrypted: string
          updated_at?: string
        }
        Update: {
          card_brand?: string | null
          created_at?: string
          customer_id?: string | null
          expiry_month?: number
          expiry_year?: number
          id?: string
          issuer_id?: string | null
          last_four?: string
          pan_encrypted?: string
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_model: string | null
          device_type: string | null
          id: string
          last_seen: string | null
          os_version: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_model?: string | null
          device_type?: string | null
          id?: string
          last_seen?: string | null
          os_version?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_model?: string | null
          device_type?: string | null
          id?: string
          last_seen?: string | null
          os_version?: string | null
        }
        Relationships: []
      }
      merchants: {
        Row: {
          api_key: string
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["merchant_status"]
          updated_at: string
        }
        Insert: {
          api_key?: string
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["risk_decision"]
          event_type: string
          id: string
          reason: string | null
          risk_score: number | null
          severity: string | null
          token_id: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["risk_decision"]
          event_type: string
          id?: string
          reason?: string | null
          risk_score?: number | null
          severity?: string | null
          token_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["risk_decision"]
          event_type?: string
          id?: string
          reason?: string | null
          risk_score?: number | null
          severity?: string | null
          token_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          card_id: string
          created_at: string
          device_id: string | null
          expires_at: string
          id: string
          merchant_id: string
          status: Database["public"]["Enums"]["token_status"]
          token_value: string
          updated_at: string
        }
        Insert: {
          card_id: string
          created_at?: string
          device_id?: string | null
          expires_at: string
          id?: string
          merchant_id: string
          status?: Database["public"]["Enums"]["token_status"]
          token_value?: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          device_id?: string | null
          expires_at?: string
          id?: string
          merchant_id?: string
          status?: Database["public"]["Enums"]["token_status"]
          token_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokens_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          merchant_id: string
          reference_number: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          token_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id: string
          reference_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          token_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          merchant_id?: string
          reference_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          token_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_pan: {
        Args: { encrypted_data: string; encryption_key: string }
        Returns: string
      }
      encrypt_pan: {
        Args: { encryption_key: string; pan_data: string }
        Returns: string
      }
    }
    Enums: {
      merchant_status: "active" | "pending" | "suspended" | "inactive"
      risk_decision: "approve" | "decline" | "review" | "challenge"
      token_status: "active" | "pending" | "expired" | "revoked" | "suspended"
      transaction_status:
        | "pending"
        | "approved"
        | "declined"
        | "failed"
        | "reversed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      merchant_status: ["active", "pending", "suspended", "inactive"],
      risk_decision: ["approve", "decline", "review", "challenge"],
      token_status: ["active", "pending", "expired", "revoked", "suspended"],
      transaction_status: [
        "pending",
        "approved",
        "declined",
        "failed",
        "reversed",
      ],
    },
  },
} as const
