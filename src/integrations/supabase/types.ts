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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          next_value: Json | null
          previous_value: Json | null
          reason: string | null
          source: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          next_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          source: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          next_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          source?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_product_id_fkey"
            columns: ["variant_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id", "product_id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name_ar: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name_ar: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name_ar?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_entries: {
        Row: {
          amount_minor: number
          basis_minor: number
          created_at: string
          currency: string
          delivery_rule_id: string | null
          eligibility_evidence: Json
          eligible_at: string | null
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["commission_kind"]
          reason: string
          reverses_entry_id: string | null
          rule_snapshot: Json
          seller_order_id: string | null
          seller_rule_id: string | null
          shipment_id: string | null
        }
        Insert: {
          amount_minor: number
          basis_minor: number
          created_at?: string
          currency?: string
          delivery_rule_id?: string | null
          eligibility_evidence: Json
          eligible_at?: string | null
          id?: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["commission_kind"]
          reason: string
          reverses_entry_id?: string | null
          rule_snapshot: Json
          seller_order_id?: string | null
          seller_rule_id?: string | null
          shipment_id?: string | null
        }
        Update: {
          amount_minor?: number
          basis_minor?: number
          created_at?: string
          currency?: string
          delivery_rule_id?: string | null
          eligibility_evidence?: Json
          eligible_at?: string | null
          id?: string
          idempotency_key?: string
          kind?: Database["public"]["Enums"]["commission_kind"]
          reason?: string
          reverses_entry_id?: string | null
          rule_snapshot?: Json
          seller_order_id?: string | null
          seller_rule_id?: string | null
          shipment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_entries_delivery_rule_id_fkey"
            columns: ["delivery_rule_id"]
            isOneToOne: false
            referencedRelation: "delivery_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_reverses_entry_id_fkey"
            columns: ["reverses_entry_id"]
            isOneToOne: false
            referencedRelation: "commission_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_seller_order_id_fkey"
            columns: ["seller_order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_seller_rule_id_fkey"
            columns: ["seller_rule_id"]
            isOneToOne: false
            referencedRelation: "seller_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_entries_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_status_history: {
        Row: {
          actor_id: string | null
          commission_entry_id: string
          created_at: string
          evidence: Json
          id: string
          reason: string
          status: string
        }
        Insert: {
          actor_id?: string | null
          commission_entry_id: string
          created_at?: string
          evidence: Json
          id?: string
          reason: string
          status: string
        }
        Update: {
          actor_id?: string | null
          commission_entry_id?: string
          created_at?: string
          evidence?: Json
          id?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_status_history_commission_entry_id_fkey"
            columns: ["commission_entry_id"]
            isOneToOne: false
            referencedRelation: "commission_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_actions: {
        Row: {
          action: string
          actor_id: string | null
          complaint_id: string
          created_at: string
          id: string
          note: string
          visibility: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          complaint_id: string
          created_at?: string
          id?: string
          note: string
          visibility: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          complaint_id?: string
          created_at?: string
          id?: string
          note?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_actions_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          body: string
          closed_at: string | null
          created_at: string
          customer_id: string
          id: string
          order_item_id: string | null
          priority: string
          status: Database["public"]["Enums"]["case_status"]
          store_id: string
          type: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          closed_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_item_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["case_status"]
          store_id: string
          type: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          closed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_item_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["case_status"]
          store_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_lines: string
          archived_at: string | null
          area_code: string
          created_at: string
          customer_id: string
          emirate: Database["public"]["Enums"]["emirate_code"]
          id: string
          label: string
          phone: string
          recipient_name: string
        }
        Insert: {
          address_lines: string
          archived_at?: string | null
          area_code: string
          created_at?: string
          customer_id: string
          emirate: Database["public"]["Enums"]["emirate_code"]
          id?: string
          label: string
          phone: string
          recipient_name: string
        }
        Update: {
          address_lines?: string
          archived_at?: string | null
          area_code?: string
          created_at?: string
          customer_id?: string
          emirate?: Database["public"]["Enums"]["emirate_code"]
          id?: string
          label?: string
          phone?: string
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_allocation_policies: {
        Row: {
          active: boolean
          cost_weight: number
          created_at: string
          eta_weight: number
          id: string
          minimum_reliable_samples: number
          performance_weight: number
          version: number
        }
        Insert: {
          active?: boolean
          cost_weight?: number
          created_at?: string
          eta_weight?: number
          id?: string
          minimum_reliable_samples?: number
          performance_weight?: number
          version: number
        }
        Update: {
          active?: boolean
          cost_weight?: number
          created_at?: string
          eta_weight?: number
          id?: string
          minimum_reliable_samples?: number
          performance_weight?: number
          version?: number
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          company_id: string
          contract_id: string | null
          expires_at: string | null
          id: string
          offer_status: string
          policy_id: string | null
          rate_card_id: string | null
          reason_snapshot: Json
          responded_at: string | null
          responded_by: string | null
          response_reason: string | null
          service_id: string | null
          shipment_id: string
          superseded_at: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          contract_id?: string | null
          expires_at?: string | null
          id?: string
          offer_status?: string
          policy_id?: string | null
          rate_card_id?: string | null
          reason_snapshot: Json
          responded_at?: string | null
          responded_by?: string | null
          response_reason?: string | null
          service_id?: string | null
          shipment_id: string
          superseded_at?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          contract_id?: string | null
          expires_at?: string | null
          id?: string
          offer_status?: string
          policy_id?: string | null
          rate_card_id?: string | null
          reason_snapshot?: Json
          responded_at?: string | null
          responded_by?: string | null
          response_reason?: string | null
          service_id?: string | null
          shipment_id?: string
          superseded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "delivery_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "delivery_allocation_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "delivery_rate_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "delivery_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_commission_rules: {
        Row: {
          active: boolean
          contract_id: string
          created_at: string
          eligibility_policy: Json
          id: string
          version: number
        }
        Insert: {
          active?: boolean
          contract_id: string
          created_at?: string
          eligibility_policy?: Json
          id?: string
          version: number
        }
        Update: {
          active?: boolean
          contract_id?: string
          created_at?: string
          eligibility_policy?: Json
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_commission_rules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "delivery_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_companies: {
        Row: {
          active: boolean
          approval_status: string
          capacity_daily: number | null
          contact: Json
          created_at: string
          hours: Json
          id: string
          name_ar: string
          performance_sample_size: number
          reliable_performance_bps: number | null
        }
        Insert: {
          active?: boolean
          approval_status?: string
          capacity_daily?: number | null
          contact?: Json
          created_at?: string
          hours?: Json
          id?: string
          name_ar: string
          performance_sample_size?: number
          reliable_performance_bps?: number | null
        }
        Update: {
          active?: boolean
          approval_status?: string
          capacity_daily?: number | null
          contact?: Json
          created_at?: string
          hours?: Json
          id?: string
          name_ar?: string
          performance_sample_size?: number
          reliable_performance_bps?: number | null
        }
        Relationships: []
      }
      delivery_contracts: {
        Row: {
          active: boolean
          commission_deducted_from_carrier: boolean
          company_id: string
          created_at: string
          currency: string
          fixed_minor: number
          id: string
          model: Database["public"]["Enums"]["commission_model"]
          rate_bps: number
          valid_from: string
          valid_until: string | null
          version: number
        }
        Insert: {
          active?: boolean
          commission_deducted_from_carrier?: boolean
          company_id: string
          created_at?: string
          currency?: string
          fixed_minor?: number
          id?: string
          model: Database["public"]["Enums"]["commission_model"]
          rate_bps?: number
          valid_from: string
          valid_until?: string | null
          version: number
        }
        Update: {
          active?: boolean
          commission_deducted_from_carrier?: boolean
          company_id?: string
          created_at?: string
          currency?: string
          fixed_minor?: number
          id?: string
          model?: Database["public"]["Enums"]["commission_model"]
          rate_bps?: number
          valid_from?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_coverage: {
        Row: {
          active: boolean
          area_code: string
          created_at: string
          dropoff: boolean
          emirate: Database["public"]["Enums"]["emirate_code"]
          id: string
          pickup: boolean
          service_id: string
        }
        Insert: {
          active?: boolean
          area_code: string
          created_at?: string
          dropoff: boolean
          emirate: Database["public"]["Enums"]["emirate_code"]
          id?: string
          pickup: boolean
          service_id: string
        }
        Update: {
          active?: boolean
          area_code?: string
          created_at?: string
          dropoff?: boolean
          emirate?: Database["public"]["Enums"]["emirate_code"]
          id?: string
          pickup?: boolean
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_coverage_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "delivery_services"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_operators: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          id: string
          scoped_role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          id?: string
          scoped_role?: string
          user_id: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          id?: string
          scoped_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_operators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_operators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_order_preparations: {
        Row: {
          created_at: string
          deliver_by: string
          evidence: string
          id: string
          pickup_snapshot: Json
          pickup_until: string
          prepared_by: string
          quote_snapshot: Json | null
          ready_at: string
          seller_order_id: string
          shipping_class: string
          updated_at: string
          volume_cm3: number
          weight_grams: number
        }
        Insert: {
          created_at?: string
          deliver_by: string
          evidence: string
          id?: string
          pickup_snapshot: Json
          pickup_until: string
          prepared_by: string
          quote_snapshot?: Json | null
          ready_at: string
          seller_order_id: string
          shipping_class: string
          updated_at?: string
          volume_cm3: number
          weight_grams: number
        }
        Update: {
          created_at?: string
          deliver_by?: string
          evidence?: string
          id?: string
          pickup_snapshot?: Json
          pickup_until?: string
          prepared_by?: string
          quote_snapshot?: Json | null
          ready_at?: string
          seller_order_id?: string
          shipping_class?: string
          updated_at?: string
          volume_cm3?: number
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_order_preparations_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_order_preparations_seller_order_id_fkey"
            columns: ["seller_order_id"]
            isOneToOne: true
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_rate_cards: {
        Row: {
          base_minor: number
          created_at: string
          currency: string
          disclosed_surcharge_minor: number
          dropoff_area_code: string
          dropoff_emirate: Database["public"]["Enums"]["emirate_code"]
          id: string
          max_volume_cm3: number | null
          max_weight_grams: number | null
          per_kg_minor: number
          per_volume_unit_minor: number
          pickup_area_code: string
          pickup_emirate: Database["public"]["Enums"]["emirate_code"]
          service_id: string
          special_handling_minor: number
          valid_from: string
          valid_until: string | null
          volume_unit_cm3: number
        }
        Insert: {
          base_minor: number
          created_at?: string
          currency?: string
          disclosed_surcharge_minor?: number
          dropoff_area_code: string
          dropoff_emirate: Database["public"]["Enums"]["emirate_code"]
          id?: string
          max_volume_cm3?: number | null
          max_weight_grams?: number | null
          per_kg_minor?: number
          per_volume_unit_minor?: number
          pickup_area_code: string
          pickup_emirate: Database["public"]["Enums"]["emirate_code"]
          service_id: string
          special_handling_minor?: number
          valid_from: string
          valid_until?: string | null
          volume_unit_cm3?: number
        }
        Update: {
          base_minor?: number
          created_at?: string
          currency?: string
          disclosed_surcharge_minor?: number
          dropoff_area_code?: string
          dropoff_emirate?: Database["public"]["Enums"]["emirate_code"]
          id?: string
          max_volume_cm3?: number | null
          max_weight_grams?: number | null
          per_kg_minor?: number
          per_volume_unit_minor?: number
          pickup_area_code?: string
          pickup_emirate?: Database["public"]["Enums"]["emirate_code"]
          service_id?: string
          special_handling_minor?: number
          valid_from?: string
          valid_until?: string | null
          volume_unit_cm3?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_rate_cards_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "delivery_services"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_services: {
        Row: {
          active: boolean
          capacity_daily: number | null
          code: string
          company_id: string
          created_at: string
          eta_minutes: number
          id: string
          name_ar: string
          shipping_classes: string[]
        }
        Insert: {
          active?: boolean
          capacity_daily?: number | null
          code: string
          company_id: string
          created_at?: string
          eta_minutes: number
          id?: string
          name_ar: string
          shipping_classes?: string[]
        }
        Update: {
          active?: boolean
          capacity_daily?: number | null
          code?: string
          company_id?: string
          created_at?: string
          eta_minutes?: number
          id?: string
          name_ar?: string
          shipping_classes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settlements: {
        Row: {
          amount_minor: number
          company_id: string
          created_at: string
          currency: string
          id: string
          idempotency_key: string
          reason: string
          status: Database["public"]["Enums"]["settlement_status"]
        }
        Insert: {
          amount_minor: number
          company_id: string
          created_at?: string
          currency?: string
          id?: string
          idempotency_key: string
          reason: string
          status?: Database["public"]["Enums"]["settlement_status"]
        }
        Update: {
          amount_minor?: number
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string
          reason?: string
          status?: Database["public"]["Enums"]["settlement_status"]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_settlements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_ledger_entries: {
        Row: {
          account_code: string
          batch_id: string
          commission_entry_id: string | null
          company_id: string | null
          created_at: string
          credit_minor: number
          currency: string
          debit_minor: number
          id: string
          idempotency_key: string
          order_id: string | null
          payment_transaction_id: string | null
          reason: string
          refund_id: string | null
          reverses_entry_id: string | null
          seller_id: string | null
        }
        Insert: {
          account_code: string
          batch_id: string
          commission_entry_id?: string | null
          company_id?: string | null
          created_at?: string
          credit_minor?: number
          currency?: string
          debit_minor?: number
          id?: string
          idempotency_key: string
          order_id?: string | null
          payment_transaction_id?: string | null
          reason: string
          refund_id?: string | null
          reverses_entry_id?: string | null
          seller_id?: string | null
        }
        Update: {
          account_code?: string
          batch_id?: string
          commission_entry_id?: string | null
          company_id?: string | null
          created_at?: string
          credit_minor?: number
          currency?: string
          debit_minor?: number
          id?: string
          idempotency_key?: string
          order_id?: string | null
          payment_transaction_id?: string | null
          reason?: string
          refund_id?: string | null
          reverses_entry_id?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_entries_commission_entry_id_fkey"
            columns: ["commission_entry_id"]
            isOneToOne: false
            referencedRelation: "commission_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_reverses_entry_id_fkey"
            columns: ["reverses_entry_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_entries_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string
          id: string
          requested_by: string
          source_hash: string
          status: string
          summary: Json
        }
        Insert: {
          created_at?: string
          id?: string
          requested_by: string
          source_hash: string
          status: string
          summary: Json
        }
        Update: {
          created_at?: string
          id?: string
          requested_by?: string
          source_hash?: string
          status?: string
          summary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          idempotency_key: string
          order_item_id: string | null
          product_id: string
          quantity_delta: number
          reason: string
          variant_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          idempotency_key: string
          order_item_id?: string | null
          product_id: string
          quantity_delta: number
          reason: string
          variant_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string
          order_item_id?: string | null
          product_id?: string
          quantity_delta?: number
          reason?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_product_id_fkey"
            columns: ["variant_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id", "product_id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          actor_id: string
          created_at: string
          decision: string
          id: string
          next_value: Json | null
          previous_value: Json | null
          product_id: string | null
          reason: string
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          decision: string
          id?: string
          next_value?: Json | null
          previous_value?: Json | null
          product_id?: string | null
          reason: string
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          decision?: string
          id?: string
          next_value?: Json | null
          previous_value?: Json | null
          product_id?: string | null
          reason?: string
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body_ar: string
          created_at: string
          id: string
          read_at: string | null
          title_ar: string
          type: string
          user_id: string
        }
        Insert: {
          body_ar: string
          created_at?: string
          id?: string
          read_at?: string | null
          title_ar: string
          type: string
          user_id: string
        }
        Update: {
          body_ar?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title_ar?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount_minor: number
          id: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          seller_order_id: string
          sku_snapshot: string
          store_id: string
          tax_minor: number
          total_minor: number
          unit_price_minor: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          discount_minor?: number
          id?: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          seller_order_id: string
          sku_snapshot: string
          store_id: string
          tax_minor?: number
          total_minor: number
          unit_price_minor: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          discount_minor?: number
          id?: string
          order_id?: string
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          seller_order_id?: string
          sku_snapshot?: string
          store_id?: string
          tax_minor?: number
          total_minor?: number
          unit_price_minor?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_store_id_fkey"
            columns: ["product_id", "store_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "store_id"]
          },
          {
            foreignKeyName: "order_items_seller_order_id_order_id_store_id_fkey"
            columns: ["seller_order_id", "order_id", "store_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id", "order_id", "store_id"]
          },
          {
            foreignKeyName: "order_items_variant_id_product_id_fkey"
            columns: ["variant_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id", "product_id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          reason: string
          seller_order_id: string
          source: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          reason: string
          seller_order_id: string
          source: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          reason?: string
          seller_order_id?: string
          source?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_seller_order_id_fkey"
            columns: ["seller_order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          delivery_address_snapshot: Json
          delivery_minor: number
          discount_minor: number
          id: string
          idempotency_key: string
          request_hash: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_minor: number
          tax_minor: number
          total_minor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          delivery_address_snapshot: Json
          delivery_minor: number
          discount_minor?: number
          id?: string
          idempotency_key: string
          request_hash: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_minor: number
          tax_minor?: number
          total_minor: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          delivery_address_snapshot?: Json
          delivery_minor?: number
          discount_minor?: number
          id?: string
          idempotency_key?: string
          request_hash?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_minor?: number
          tax_minor?: number
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          event_type: string
          id: string
          intent_id: string
          payload_hash: string
          provider: string
          provider_event_id: string
          received_at: string
          verified_at: string
        }
        Insert: {
          event_type: string
          id?: string
          intent_id: string
          payload_hash: string
          provider: string
          provider_event_id: string
          received_at?: string
          verified_at: string
        }
        Update: {
          event_type?: string
          id?: string
          intent_id?: string
          payload_hash?: string
          provider?: string
          provider_event_id?: string
          received_at?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          expires_at: string
          id: string
          idempotency_key: string
          order_id: string
          provider: string
          provider_intent_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          expires_at: string
          id?: string
          idempotency_key: string
          order_id: string
          provider?: string
          provider_intent_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          order_id?: string
          provider?: string
          provider_intent_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          event_id: string
          gateway_fee_minor: number
          id: string
          intent_id: string
          kind: string
          order_id: string
          provider_transaction_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          event_id: string
          gateway_fee_minor?: number
          id?: string
          intent_id: string
          kind: string
          order_id: string
          provider_transaction_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          event_id?: string
          gateway_fee_minor?: number
          id?: string
          intent_id?: string
          kind?: string
          order_id?: string
          provider_transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "payment_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_intent_id_order_id_fkey"
            columns: ["intent_id", "order_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id", "order_id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_ar: string
          created_at: string
          id: string
          object_path: string
          product_id: string
          sort_order: number
          store_id: string
        }
        Insert: {
          alt_ar?: string
          created_at?: string
          id?: string
          object_path: string
          product_id: string
          sort_order?: number
          store_id: string
        }
        Update: {
          alt_ar?: string
          created_at?: string
          id?: string
          object_path?: string
          product_id?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_store_id_fkey"
            columns: ["product_id", "store_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "store_id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          attributes: Json
          created_at: string
          id: string
          inventory_quantity: number
          price_minor: number
          product_id: string
          sku: string
        }
        Insert: {
          active?: boolean
          attributes?: Json
          created_at?: string
          id?: string
          inventory_quantity?: number
          price_minor: number
          product_id: string
          sku: string
        }
        Update: {
          active?: boolean
          attributes?: Json
          created_at?: string
          id?: string
          inventory_quantity?: number
          price_minor?: number
          product_id?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          currency: string
          description: string
          id: string
          inventory_quantity: number
          kind: string
          moderation_hidden: boolean
          name_ar: string
          price_minor: number
          shipping_class: string
          sku: string
          status: Database["public"]["Enums"]["product_status"]
          store_id: string
          updated_at: string
          volume_cm3: number | null
          weight_grams: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          inventory_quantity?: number
          kind: string
          moderation_hidden?: boolean
          name_ar: string
          price_minor: number
          shipping_class?: string
          sku: string
          status?: Database["public"]["Enums"]["product_status"]
          store_id: string
          updated_at?: string
          volume_cm3?: number | null
          weight_grams?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          inventory_quantity?: number
          kind?: string
          moderation_hidden?: boolean
          name_ar?: string
          price_minor?: number
          shipping_class?: string
          sku?: string
          status?: Database["public"]["Enums"]["product_status"]
          store_id?: string
          updated_at?: string
          volume_cm3?: number | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      refund_items: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          order_id: string
          order_item_id: string
          quantity: number
          refund_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          id?: string
          order_id: string
          order_item_id: string
          quantity: number
          refund_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          order_id?: string
          order_item_id?: string
          quantity?: number
          refund_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_items_order_item_id_order_id_fkey"
            columns: ["order_item_id", "order_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id", "order_id"]
          },
          {
            foreignKeyName: "refund_items_refund_id_order_id_fkey"
            columns: ["refund_id", "order_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id", "order_id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_minor: number
          capture_transaction_id: string
          created_at: string
          delivery_refund_minor: number
          id: string
          idempotency_key: string
          order_id: string
          reason: string
          requested_by: string
          status: string
        }
        Insert: {
          amount_minor: number
          capture_transaction_id: string
          created_at?: string
          delivery_refund_minor?: number
          id?: string
          idempotency_key: string
          order_id: string
          reason: string
          requested_by: string
          status?: string
        }
        Update: {
          amount_minor?: number
          capture_transaction_id?: string
          created_at?: string
          delivery_refund_minor?: number
          id?: string
          idempotency_key?: string
          order_id?: string
          reason?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_capture_transaction_id_order_id_fkey"
            columns: ["capture_transaction_id", "order_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id", "order_id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_commission_rules: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          discount_basis: string
          eligibility_policy: Json
          exclude_delivery: boolean
          id: string
          rate_bps: number
          refund_policy: string
          seller_id: string | null
          tax_basis: string
          valid_from: string
          valid_until: string | null
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          discount_basis?: string
          eligibility_policy?: Json
          exclude_delivery?: boolean
          id?: string
          rate_bps?: number
          refund_policy?: string
          seller_id?: string | null
          tax_basis?: string
          valid_from: string
          valid_until?: string | null
          version: number
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          discount_basis?: string
          eligibility_policy?: Json
          exclude_delivery?: boolean
          id?: string
          rate_bps?: number
          refund_policy?: string
          seller_id?: string | null
          tax_basis?: string
          valid_from?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_commission_rules_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_orders: {
        Row: {
          created_at: string
          discount_minor: number
          id: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_minor: number
          tax_minor: number
          total_minor: number
        }
        Insert: {
          created_at?: string
          discount_minor?: number
          id?: string
          order_id: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal_minor: number
          tax_minor?: number
          total_minor: number
        }
        Update: {
          created_at?: string
          discount_minor?: number
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal_minor?: number
          tax_minor?: number
          total_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          business_name: string
          created_at: string
          id: string
          onboarding_status: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          onboarding_status?: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          onboarding_status?: Database["public"]["Enums"]["review_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_settlements: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string
          reason: string
          seller_id: string
          status: Database["public"]["Enums"]["settlement_status"]
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key: string
          reason: string
          seller_id: string
          status?: Database["public"]["Enums"]["settlement_status"]
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string
          reason?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["settlement_status"]
        }
        Relationships: [
          {
            foreignKeyName: "seller_settlements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_events: {
        Row: {
          actor_id: string | null
          created_at: string
          delivery_settlement_id: string | null
          evidence: Json
          from_status: Database["public"]["Enums"]["settlement_status"] | null
          id: string
          reason: string
          seller_settlement_id: string | null
          to_status: Database["public"]["Enums"]["settlement_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delivery_settlement_id?: string | null
          evidence: Json
          from_status?: Database["public"]["Enums"]["settlement_status"] | null
          id?: string
          reason: string
          seller_settlement_id?: string | null
          to_status: Database["public"]["Enums"]["settlement_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delivery_settlement_id?: string | null
          evidence?: Json
          from_status?: Database["public"]["Enums"]["settlement_status"] | null
          id?: string
          reason?: string
          seller_settlement_id?: string | null
          to_status?: Database["public"]["Enums"]["settlement_status"]
        }
        Relationships: [
          {
            foreignKeyName: "settlement_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_events_delivery_settlement_id_fkey"
            columns: ["delivery_settlement_id"]
            isOneToOne: false
            referencedRelation: "delivery_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_events_seller_settlement_id_fkey"
            columns: ["seller_settlement_id"]
            isOneToOne: false
            referencedRelation: "seller_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_items: {
        Row: {
          amount_minor: number
          created_at: string
          delivery_settlement_id: string | null
          id: string
          idempotency_key: string
          ledger_entry_id: string
          seller_settlement_id: string | null
        }
        Insert: {
          amount_minor: number
          created_at?: string
          delivery_settlement_id?: string | null
          id?: string
          idempotency_key: string
          ledger_entry_id: string
          seller_settlement_id?: string | null
        }
        Update: {
          amount_minor?: number
          created_at?: string
          delivery_settlement_id?: string | null
          id?: string
          idempotency_key?: string
          ledger_entry_id?: string
          seller_settlement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_delivery_settlement_id_fkey"
            columns: ["delivery_settlement_id"]
            isOneToOne: false
            referencedRelation: "delivery_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_seller_settlement_id_fkey"
            columns: ["seller_settlement_id"]
            isOneToOne: false
            referencedRelation: "seller_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          created_at: string
          id: string
          order_item_id: string
          quantity: number
          seller_order_id: string
          shipment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_item_id: string
          quantity: number
          seller_order_id: string
          shipment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_item_id?: string
          quantity?: number
          seller_order_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_order_item_id_seller_order_id_fkey"
            columns: ["order_item_id", "seller_order_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id", "seller_order_id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_seller_order_id_fkey"
            columns: ["shipment_id", "seller_order_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id", "seller_order_id"]
          },
        ]
      }
      shipment_tracking_events: {
        Row: {
          evidence: Json
          id: string
          provider: string
          provider_event_id: string
          received_at: string
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          trusted_source: string
          verified_at: string
        }
        Insert: {
          evidence: Json
          id?: string
          provider: string
          provider_event_id: string
          received_at?: string
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          trusted_source: string
          verified_at: string
        }
        Update: {
          evidence?: Json
          id?: string
          provider?: string
          provider_event_id?: string
          received_at?: string
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          trusted_source?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          allocation_snapshot: Json
          carrier_gross_minor: number
          created_at: string
          currency: string
          customer_fee_minor: number
          delivered_at: string | null
          delivery_company_id: string | null
          delivery_contract_id: string | null
          delivery_evidence_id: string | null
          delivery_service_id: string | null
          dropoff_snapshot: Json
          id: string
          pickup_snapshot: Json
          promised_at: string | null
          quote_snapshot: Json
          rate_card_id: string | null
          seller_order_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          allocation_snapshot: Json
          carrier_gross_minor: number
          created_at?: string
          currency?: string
          customer_fee_minor: number
          delivered_at?: string | null
          delivery_company_id?: string | null
          delivery_contract_id?: string | null
          delivery_evidence_id?: string | null
          delivery_service_id?: string | null
          dropoff_snapshot: Json
          id?: string
          pickup_snapshot: Json
          promised_at?: string | null
          quote_snapshot: Json
          rate_card_id?: string | null
          seller_order_id: string
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          allocation_snapshot?: Json
          carrier_gross_minor?: number
          created_at?: string
          currency?: string
          customer_fee_minor?: number
          delivered_at?: string | null
          delivery_company_id?: string | null
          delivery_contract_id?: string | null
          delivery_evidence_id?: string | null
          delivery_service_id?: string | null
          dropoff_snapshot?: Json
          id?: string
          pickup_snapshot?: Json
          promised_at?: string | null
          quote_snapshot?: Json
          rate_card_id?: string | null
          seller_order_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shipments_delivery_company_id_fkey"
            columns: ["delivery_company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_delivery_contract_id_delivery_company_id_fkey"
            columns: ["delivery_contract_id", "delivery_company_id"]
            isOneToOne: false
            referencedRelation: "delivery_contracts"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "shipments_delivery_evidence_id_id_fkey"
            columns: ["delivery_evidence_id", "id"]
            isOneToOne: false
            referencedRelation: "shipment_tracking_events"
            referencedColumns: ["id", "shipment_id"]
          },
          {
            foreignKeyName: "shipments_delivery_service_id_delivery_company_id_fkey"
            columns: ["delivery_service_id", "delivery_company_id"]
            isOneToOne: false
            referencedRelation: "delivery_services"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "shipments_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "delivery_rate_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_seller_order_id_fkey"
            columns: ["seller_order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_documents: {
        Row: {
          created_at: string
          document_type: string
          expires_at: string | null
          file_name: string | null
          id: string
          issued_at: string | null
          mime_type: string | null
          object_path: string
          review_notes: string | null
          reviewer_id: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["review_status"]
          store_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          expires_at?: string | null
          file_name?: string | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          object_path: string
          review_notes?: string | null
          reviewer_id?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          store_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_name?: string | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          object_path?: string
          review_notes?: string | null
          reviewer_id?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          store_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_documents_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_documents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_reviews: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          score: number
          seller_order_id: string
          seller_reply: string | null
          store_id: string
          visible: boolean
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          id?: string
          score: number
          seller_order_id: string
          seller_reply?: string | null
          store_id: string
          visible?: boolean
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          score?: number
          seller_order_id?: string
          seller_reply?: string | null
          store_id?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_seller_order_id_fkey"
            columns: ["seller_order_id"]
            isOneToOne: true
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          area_code: string
          category_id: string | null
          contact: Json
          cover_path: string | null
          created_at: string
          description: string
          emirate: Database["public"]["Enums"]["emirate_code"]
          hours: Json
          id: string
          license_status: Database["public"]["Enums"]["review_status"]
          logo_path: string | null
          name_ar: string
          onboarding_status: Database["public"]["Enums"]["review_status"]
          seller_id: string
          slug: string
          status: Database["public"]["Enums"]["store_status"]
          updated_at: string
        }
        Insert: {
          area_code: string
          category_id?: string | null
          contact?: Json
          cover_path?: string | null
          created_at?: string
          description?: string
          emirate: Database["public"]["Enums"]["emirate_code"]
          hours?: Json
          id?: string
          license_status?: Database["public"]["Enums"]["review_status"]
          logo_path?: string | null
          name_ar: string
          onboarding_status?: Database["public"]["Enums"]["review_status"]
          seller_id: string
          slug: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Update: {
          area_code?: string
          category_id?: string | null
          contact?: Json
          cover_path?: string | null
          created_at?: string
          description?: string
          emirate?: Database["public"]["Enums"]["emirate_code"]
          hours?: Json
          id?: string
          license_status?: Database["public"]["Enums"]["review_status"]
          logo_path?: string | null
          name_ar?: string
          onboarding_status?: Database["public"]["Enums"]["review_status"]
          seller_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sanaa_archive_product: {
        Args: { product_uuid: string }
        Returns: undefined
      }
      sanaa_archive_store: { Args: { store_uuid: string }; Returns: undefined }
      sanaa_attach_license: {
        Args: {
          file_name: string
          mime_type: string
          object_path: string
          size_bytes: number
          store_uuid: string
        }
        Returns: string
      }
      sanaa_delivery_command: {
        Args: { command_key: string; payload: Json }
        Returns: Json
      }
      sanaa_delivery_read: { Args: { request: Json }; Returns: Json }
      sanaa_delivery_toggle: {
        Args: { command_key: string; payload: Json }
        Returns: Json
      }
      sanaa_enroll_seller: { Args: { business_name: string }; Returns: string }
      sanaa_profile_save: { Args: { display_name: string }; Returns: undefined }
      sanaa_register_media: {
        Args: {
          document_type: string
          object_path: string
          product_uuid: string
          purpose: string
          store_uuid: string
        }
        Returns: string
      }
      sanaa_remove_license: { Args: { document_uuid: string }; Returns: string }
      sanaa_review_store: {
        Args: {
          decision: Database["public"]["Enums"]["store_status"]
          reason: string
          store_uuid: string
        }
        Returns: undefined
      }
      sanaa_save_product: {
        Args: {
          category_uuid: string
          description: string
          kind: string
          name_ar: string
          price_minor: number
          product_uuid: string
          publication: Database["public"]["Enums"]["product_status"]
          sku: string
          stock: number
          store_uuid: string
        }
        Returns: string
      }
      sanaa_save_store: {
        Args: {
          area_code: string
          category_uuid: string
          description: string
          emirate: Database["public"]["Enums"]["emirate_code"]
          hours: Json
          name_ar: string
          store_uuid: string
        }
        Returns: string
      }
      sanaa_upload_slot: { Args: { store_uuid: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "customer"
        | "seller"
        | "admin"
        | "license_reviewer"
        | "complaints_officer"
        | "delivery_operator"
      case_status:
        | "new"
        | "in_review"
        | "needs_information"
        | "processing"
        | "closed"
      commission_kind: "sale" | "delivery"
      commission_model: "fixed" | "percentage" | "hybrid"
      emirate_code:
        | "abu_dhabi"
        | "dubai"
        | "sharjah"
        | "ajman"
        | "umm_al_quwain"
        | "ras_al_khaimah"
        | "fujairah"
      order_status:
        | "pending_payment"
        | "confirmed"
        | "preparing"
        | "ready"
        | "shipped"
        | "completed"
        | "cancelled"
      payment_status:
        | "created"
        | "pending"
        | "succeeded"
        | "failed"
        | "expired"
        | "cancelled"
        | "partially_refunded"
        | "refunded"
      product_status: "draft" | "published" | "paused" | "archived"
      review_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "needs_information"
        | "demo_approved"
        | "rejected"
        | "expired"
      settlement_status:
        | "pending"
        | "eligible"
        | "on_hold"
        | "processing"
        | "settled"
        | "failed"
        | "reversed"
      shipment_status:
        | "pending"
        | "allocated"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "failed"
        | "cancelled"
      store_status:
        | "draft"
        | "pending"
        | "active"
        | "suspended"
        | "rejected"
        | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "customer",
        "seller",
        "admin",
        "license_reviewer",
        "complaints_officer",
        "delivery_operator",
      ],
      case_status: [
        "new",
        "in_review",
        "needs_information",
        "processing",
        "closed",
      ],
      commission_kind: ["sale", "delivery"],
      commission_model: ["fixed", "percentage", "hybrid"],
      emirate_code: [
        "abu_dhabi",
        "dubai",
        "sharjah",
        "ajman",
        "umm_al_quwain",
        "ras_al_khaimah",
        "fujairah",
      ],
      order_status: [
        "pending_payment",
        "confirmed",
        "preparing",
        "ready",
        "shipped",
        "completed",
        "cancelled",
      ],
      payment_status: [
        "created",
        "pending",
        "succeeded",
        "failed",
        "expired",
        "cancelled",
        "partially_refunded",
        "refunded",
      ],
      product_status: ["draft", "published", "paused", "archived"],
      review_status: [
        "draft",
        "submitted",
        "in_review",
        "needs_information",
        "demo_approved",
        "rejected",
        "expired",
      ],
      settlement_status: [
        "pending",
        "eligible",
        "on_hold",
        "processing",
        "settled",
        "failed",
        "reversed",
      ],
      shipment_status: [
        "pending",
        "allocated",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
      ],
      store_status: [
        "draft",
        "pending",
        "active",
        "suspended",
        "rejected",
        "archived",
      ],
    },
  },
} as const
