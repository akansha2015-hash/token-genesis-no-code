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
      api_performance_metrics: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          merchant_id: string | null
          method: string
          response_time_ms: number
          status_code: number
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          merchant_id?: string | null
          method: string
          response_time_ms: number
          status_code: number
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          merchant_id?: string | null
          method?: string
          response_time_ms?: number
          status_code?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          accessed_fields: string[] | null
          compliance_flags: Json | null
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
          accessed_fields?: string[] | null
          compliance_flags?: Json | null
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
          accessed_fields?: string[] | null
          compliance_flags?: Json | null
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
      compliance_logs: {
        Row: {
          check_result: string
          check_type: string
          created_at: string
          details: Json | null
          id: string
          remediation_status: string | null
          severity: string
        }
        Insert: {
          check_result: string
          check_type: string
          created_at?: string
          details?: Json | null
          id?: string
          remediation_status?: string | null
          severity?: string
        }
        Update: {
          check_result?: string
          check_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          remediation_status?: string | null
          severity?: string
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
      encryption_keys: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_version: number
          rotated_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_version: number
          rotated_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_version?: number
          rotated_by?: string | null
        }
        Relationships: []
      }
      feature_backlog: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          estimated_effort: number | null
          id: string
          performance_impact: Json | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_effort?: number | null
          id?: string
          performance_impact?: Json | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_effort?: number | null
          id?: string
          performance_impact?: Json | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
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
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          merchant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          merchant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          merchant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          last_request: string
          merchant_id: string
          request_count: number
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          last_request?: string
          merchant_id: string
          request_count?: number
          window_start?: string
        }
        Update: {
          endpoint?: string
          id?: string
          last_request?: string
          merchant_id?: string
          request_count?: number
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
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
      user_feedback: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          merchant_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          merchant_id: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          merchant_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
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
      get_user_merchant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "merchant" | "auditor"
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
      app_role: ["admin", "merchant", "auditor"],
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
