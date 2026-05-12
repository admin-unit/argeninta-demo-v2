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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          area_id: string | null
          created_at: string
          description: string | null
          event_type: string
          id: number
          ip_address: unknown
          metadata: Json
          solicitud_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          solicitud_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          solicitud_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "internal_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "v_solicitudes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expediente_sequence: {
        Row: {
          last_number: number
          organism_short_name: string
          year: number
        }
        Insert: {
          last_number?: number
          organism_short_name: string
          year: number
        }
        Update: {
          last_number?: number
          organism_short_name?: string
          year?: number
        }
        Relationships: []
      }
      internal_area_members: {
        Row: {
          added_at: string
          added_by: string | null
          area_id: string
          is_primary: boolean
          role: Database["public"]["Enums"]["area_role"]
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          area_id: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["area_role"]
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          area_id?: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["area_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_area_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_area_members_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "internal_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_area_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_areas: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          odoo_department_id: number | null
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          odoo_department_id?: number | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          odoo_department_id?: number | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "internal_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      odoo_accounts: {
        Row: {
          account_type: string | null
          code: string
          name: string
          odoo_id: number
          raw_data: Json | null
          synced_at: string
        }
        Insert: {
          account_type?: string | null
          code: string
          name: string
          odoo_id: number
          raw_data?: Json | null
          synced_at?: string
        }
        Update: {
          account_type?: string | null
          code?: string
          name?: string
          odoo_id?: number
          raw_data?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      odoo_analytic_accounts: {
        Row: {
          active: boolean
          balance: number | null
          code: string | null
          name: string
          odoo_id: number
          partner_odoo_id: number | null
          plan_id: number | null
          plan_name: string | null
          raw_data: Json | null
          synced_at: string
        }
        Insert: {
          active?: boolean
          balance?: number | null
          code?: string | null
          name: string
          odoo_id: number
          partner_odoo_id?: number | null
          plan_id?: number | null
          plan_name?: string | null
          raw_data?: Json | null
          synced_at?: string
        }
        Update: {
          active?: boolean
          balance?: number | null
          code?: string | null
          name?: string
          odoo_id?: number
          partner_odoo_id?: number | null
          plan_id?: number | null
          plan_name?: string | null
          raw_data?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      odoo_doc_types: {
        Row: {
          code: string | null
          country_code: string | null
          doc_code_prefix: string | null
          internal_type: string | null
          name: string
          odoo_id: number
          raw_data: Json | null
          synced_at: string
        }
        Insert: {
          code?: string | null
          country_code?: string | null
          doc_code_prefix?: string | null
          internal_type?: string | null
          name: string
          odoo_id: number
          raw_data?: Json | null
          synced_at?: string
        }
        Update: {
          code?: string | null
          country_code?: string | null
          doc_code_prefix?: string | null
          internal_type?: string | null
          name?: string
          odoo_id?: number
          raw_data?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      odoo_journals: {
        Row: {
          active: boolean
          code: string | null
          currency_code: string | null
          default_account_id: number | null
          default_account_name: string | null
          journal_type: string | null
          name: string
          odoo_id: number
          raw_data: Json | null
          synced_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          currency_code?: string | null
          default_account_id?: number | null
          default_account_name?: string | null
          journal_type?: string | null
          name: string
          odoo_id: number
          raw_data?: Json | null
          synced_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          currency_code?: string | null
          default_account_id?: number | null
          default_account_name?: string | null
          journal_type?: string | null
          name?: string
          odoo_id?: number
          raw_data?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      odoo_partners: {
        Row: {
          active: boolean
          country_code: string | null
          customer_rank: number | null
          email: string | null
          is_company: boolean
          name: string
          odoo_id: number
          parent_id: number | null
          phone: string | null
          raw_data: Json | null
          supplier_rank: number | null
          synced_at: string
          vat: string | null
        }
        Insert: {
          active?: boolean
          country_code?: string | null
          customer_rank?: number | null
          email?: string | null
          is_company?: boolean
          name: string
          odoo_id: number
          parent_id?: number | null
          phone?: string | null
          raw_data?: Json | null
          supplier_rank?: number | null
          synced_at?: string
          vat?: string | null
        }
        Update: {
          active?: boolean
          country_code?: string | null
          customer_rank?: number | null
          email?: string | null
          is_company?: boolean
          name?: string
          odoo_id?: number
          parent_id?: number | null
          phone?: string | null
          raw_data?: Json | null
          supplier_rank?: number | null
          synced_at?: string
          vat?: string | null
        }
        Relationships: []
      }
      odoo_products: {
        Row: {
          categ_id: number | null
          categ_name: string | null
          default_code: string | null
          list_price: number | null
          name: string
          odoo_id: number
          product_type: string | null
          purchase_ok: boolean | null
          raw_data: Json | null
          synced_at: string
        }
        Insert: {
          categ_id?: number | null
          categ_name?: string | null
          default_code?: string | null
          list_price?: number | null
          name: string
          odoo_id: number
          product_type?: string | null
          purchase_ok?: boolean | null
          raw_data?: Json | null
          synced_at?: string
        }
        Update: {
          categ_id?: number | null
          categ_name?: string | null
          default_code?: string | null
          list_price?: number | null
          name?: string
          odoo_id?: number
          product_type?: string | null
          purchase_ok?: boolean | null
          raw_data?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      odoo_sync_log: {
        Row: {
          duration_ms: number | null
          entity: string
          error_message: string | null
          finished_at: string | null
          id: number
          records_synced: number | null
          started_at: string
          status: string | null
        }
        Insert: {
          duration_ms?: number | null
          entity: string
          error_message?: string | null
          finished_at?: string | null
          id?: number
          records_synced?: number | null
          started_at: string
          status?: string | null
        }
        Update: {
          duration_ms?: number | null
          entity?: string
          error_message?: string | null
          finished_at?: string | null
          id?: number
          records_synced?: number | null
          started_at?: string
          status?: string | null
        }
        Relationships: []
      }
      organism_convenios: {
        Row: {
          added_at: string
          code: string | null
          display_alias: string | null
          fuente_financiamiento: string | null
          name: string | null
          odoo_analytic_account_id: number
          organism_id: string
          visible: boolean
        }
        Insert: {
          added_at?: string
          code?: string | null
          display_alias?: string | null
          fuente_financiamiento?: string | null
          name?: string | null
          odoo_analytic_account_id: number
          organism_id: string
          visible?: boolean
        }
        Update: {
          added_at?: string
          code?: string | null
          display_alias?: string | null
          fuente_financiamiento?: string | null
          name?: string | null
          odoo_analytic_account_id?: number
          organism_id?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organism_convenios_organism_id_fkey"
            columns: ["organism_id"]
            isOneToOne: false
            referencedRelation: "organisms"
            referencedColumns: ["id"]
          },
        ]
      }
      organism_members: {
        Row: {
          added_at: string
          added_by: string | null
          organism_id: string
          role: Database["public"]["Enums"]["organism_role"]
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          organism_id: string
          role?: Database["public"]["Enums"]["organism_role"]
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          organism_id?: string
          role?: Database["public"]["Enums"]["organism_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organism_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organism_members_organism_id_fkey"
            columns: ["organism_id"]
            isOneToOne: false
            referencedRelation: "organisms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organism_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisms: {
        Row: {
          active: boolean
          contact_email: string | null
          created_at: string
          cuit: string | null
          email_domain: string | null
          id: string
          name: string
          notes: string | null
          odoo_partner_id: number | null
          short_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          contact_email?: string | null
          created_at?: string
          cuit?: string | null
          email_domain?: string | null
          id?: string
          name: string
          notes?: string | null
          odoo_partner_id?: number | null
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          contact_email?: string | null
          created_at?: string
          cuit?: string | null
          email_domain?: string | null
          id?: string
          name?: string
          notes?: string | null
          odoo_partner_id?: number | null
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean
          last_seen_at: string | null
          odoo_employee_id: number | null
          odoo_user_id: number | null
          phone: string | null
          position: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          last_seen_at?: string | null
          odoo_employee_id?: number | null
          odoo_user_id?: number | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          last_seen_at?: string | null
          odoo_employee_id?: number | null
          odoo_user_id?: number | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      reporting_cache: {
        Row: {
          cache_key: string
          cached_at: string
          data: Json
          expires_at: string
        }
        Insert: {
          cache_key: string
          cached_at?: string
          data: Json
          expires_at: string
        }
        Update: {
          cache_key?: string
          cached_at?: string
          data?: Json
          expires_at?: string
        }
        Relationships: []
      }
      solicitud_attachments: {
        Row: {
          filename_normalized: string | null
          filename_original: string
          id: string
          mime_type: string | null
          odoo_attachment_id: number | null
          size_bytes: number | null
          solicitud_id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          filename_normalized?: string | null
          filename_original: string
          id?: string
          mime_type?: string | null
          odoo_attachment_id?: number | null
          size_bytes?: number | null
          solicitud_id: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          filename_normalized?: string | null
          filename_original?: string
          id?: string
          mime_type?: string | null
          odoo_attachment_id?: number | null
          size_bytes?: number | null
          solicitud_id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitud_attachments_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_attachments_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "v_solicitudes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes: {
        Row: {
          assigned_user_id: string | null
          closed_at: string | null
          concepto: string | null
          created_at: string
          created_by_user_id: string
          current_area_id: string | null
          data: Json
          id: string
          importe: number | null
          moneda: string | null
          numero_expediente: string | null
          odoo_analytic_account_id: number | null
          odoo_move_id: number | null
          odoo_partner_id: number | null
          odoo_payment_id: number | null
          organism_id: string | null
          posted_at: string | null
          status: Database["public"]["Enums"]["solicitud_status"]
          submitted_at: string | null
          tipo_gestion_id: string
          updated_at: string
          urgency: Database["public"]["Enums"]["solicitud_urgency"]
        }
        Insert: {
          assigned_user_id?: string | null
          closed_at?: string | null
          concepto?: string | null
          created_at?: string
          created_by_user_id: string
          current_area_id?: string | null
          data?: Json
          id?: string
          importe?: number | null
          moneda?: string | null
          numero_expediente?: string | null
          odoo_analytic_account_id?: number | null
          odoo_move_id?: number | null
          odoo_partner_id?: number | null
          odoo_payment_id?: number | null
          organism_id?: string | null
          posted_at?: string | null
          status?: Database["public"]["Enums"]["solicitud_status"]
          submitted_at?: string | null
          tipo_gestion_id: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["solicitud_urgency"]
        }
        Update: {
          assigned_user_id?: string | null
          closed_at?: string | null
          concepto?: string | null
          created_at?: string
          created_by_user_id?: string
          current_area_id?: string | null
          data?: Json
          id?: string
          importe?: number | null
          moneda?: string | null
          numero_expediente?: string | null
          odoo_analytic_account_id?: number | null
          odoo_move_id?: number | null
          odoo_partner_id?: number | null
          odoo_payment_id?: number | null
          organism_id?: string | null
          posted_at?: string | null
          status?: Database["public"]["Enums"]["solicitud_status"]
          submitted_at?: string | null
          tipo_gestion_id?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["solicitud_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_current_area_id_fkey"
            columns: ["current_area_id"]
            isOneToOne: false
            referencedRelation: "internal_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_organism_id_fkey"
            columns: ["organism_id"]
            isOneToOne: false
            referencedRelation: "organisms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_tipo_gestion_id_fkey"
            columns: ["tipo_gestion_id"]
            isOneToOne: false
            referencedRelation: "tipos_gestion"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_gestion: {
        Row: {
          active: boolean
          admin_fields_schema: Json
          created_at: string
          description: string | null
          fields_schema: Json
          icon: string | null
          id: string
          name: string
          odoo_mapping: Json
          slug: Database["public"]["Enums"]["tipo_gestion_slug"]
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          admin_fields_schema?: Json
          created_at?: string
          description?: string | null
          fields_schema?: Json
          icon?: string | null
          id?: string
          name: string
          odoo_mapping?: Json
          slug: Database["public"]["Enums"]["tipo_gestion_slug"]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          admin_fields_schema?: Json
          created_at?: string
          description?: string | null
          fields_schema?: Json
          icon?: string | null
          id?: string
          name?: string
          odoo_mapping?: Json
          slug?: Database["public"]["Enums"]["tipo_gestion_slug"]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_saved_views: {
        Row: {
          area_id: string | null
          created_at: string
          filters_json: Json
          id: string
          is_shared: boolean
          name: string
          sort_json: Json
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          filters_json?: Json
          id?: string
          is_shared?: boolean
          name: string
          sort_json?: Json
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          filters_json?: Json
          id?: string
          is_shared?: boolean
          name?: string
          sort_json?: Json
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_views_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "internal_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_solicitudes_full: {
        Row: {
          assigned_user_id: string | null
          assigned_user_name: string | null
          closed_at: string | null
          concepto: string | null
          created_at: string | null
          created_by_name: string | null
          created_by_user_id: string | null
          current_area_id: string | null
          current_area_name: string | null
          data: Json | null
          id: string | null
          importe: number | null
          moneda: string | null
          numero_expediente: string | null
          odoo_analytic_account_id: number | null
          odoo_move_id: number | null
          odoo_partner_id: number | null
          odoo_payment_id: number | null
          organism_id: string | null
          organism_name: string | null
          organism_short_name: string | null
          posted_at: string | null
          status: Database["public"]["Enums"]["solicitud_status"] | null
          submitted_at: string | null
          tipo_gestion_id: string | null
          tipo_name: string | null
          tipo_slug: Database["public"]["Enums"]["tipo_gestion_slug"] | null
          updated_at: string | null
          urgency: Database["public"]["Enums"]["solicitud_urgency"] | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_current_area_id_fkey"
            columns: ["current_area_id"]
            isOneToOne: false
            referencedRelation: "internal_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_organism_id_fkey"
            columns: ["organism_id"]
            isOneToOne: false
            referencedRelation: "organisms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_tipo_gestion_id_fkey"
            columns: ["tipo_gestion_id"]
            isOneToOne: false
            referencedRelation: "tipos_gestion"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      areas_administradas_por: {
        Args: { p_user_id: string }
        Returns: {
          area_id: string
        }[]
      }
      areas_de_usuario: {
        Args: { p_user_id: string }
        Returns: {
          area_id: string
        }[]
      }
      is_internal: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      next_expediente_number: {
        Args: { p_organism_short_name: string; p_year: number }
        Returns: number
      }
      organismos_de_usuario: {
        Args: { p_user_id: string }
        Returns: {
          organism_id: string
        }[]
      }
      puede_administrar_a: {
        Args: { p_admin: string; p_target: string }
        Returns: boolean
      }
    }
    Enums: {
      area_role: "miembro" | "jefe" | "admin"
      organism_role: "solicitante" | "referente" | "admin_org"
      solicitud_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "in_progress"
        | "posted_to_odoo"
        | "in_payment"
        | "closed"
        | "cancelled"
        | "error"
      solicitud_urgency: "normal" | "urgente"
      tipo_gestion_slug:
        | "pago_factura"
        | "compra"
        | "anticipo_rendicion"
        | "reintegro"
        | "contrato"
        | "otro"
      user_type: "interno" | "externo"
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
      area_role: ["miembro", "jefe", "admin"],
      organism_role: ["solicitante", "referente", "admin_org"],
      solicitud_status: [
        "draft",
        "submitted",
        "in_review",
        "in_progress",
        "posted_to_odoo",
        "in_payment",
        "closed",
        "cancelled",
        "error",
      ],
      solicitud_urgency: ["normal", "urgente"],
      tipo_gestion_slug: [
        "pago_factura",
        "compra",
        "anticipo_rendicion",
        "reintegro",
        "contrato",
        "otro",
      ],
      user_type: ["interno", "externo"],
    },
  },
} as const
