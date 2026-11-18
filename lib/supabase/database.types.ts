// Generated from PostgreSQL 17 after applying the 4A migrations.
// Regenerate: npm run db:types:test (isolated local database).
// Hosted validation: supabase gen types typescript --linked --schema public.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = { public: { Tables: {
  admin_permissions: {
    Row: {
      id: string;
      user_id: string;
      permission: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      permission: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      permission?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "admin_permissions_user_id_fkey",
    "columns": [
      "user_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  audit_logs: {
    Row: {
      id: string;
      actor_id: string | null;
      action: string;
      entity_table: string;
      entity_id: string | null;
      previous_value: Json | null;
      next_value: Json | null;
      reason: string | null;
      source: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      actor_id?: string | null;
      action: string;
      entity_table: string;
      entity_id?: string | null;
      previous_value?: Json | null;
      next_value?: Json | null;
      reason?: string | null;
      source: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      actor_id?: string | null;
      action?: string;
      entity_table?: string;
      entity_id?: string | null;
      previous_value?: Json | null;
      next_value?: Json | null;
      reason?: string | null;
      source?: string;
      created_at?: string;
    };
    Relationships: [];
  };
  cart_items: {
    Row: {
      id: string;
      cart_id: string;
      product_id: string;
      variant_id: string | null;
      quantity: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      cart_id: string;
      product_id: string;
      variant_id?: string | null;
      quantity: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      cart_id?: string;
      product_id?: string;
      variant_id?: string | null;
      quantity?: number;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "cart_items_cart_id_fkey",
    "columns": [
      "cart_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "carts",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "cart_items_product_id_fkey",
    "columns": [
      "product_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "products",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "cart_items_variant_id_product_id_fkey",
    "columns": [
      "variant_id",
      "product_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "product_variants",
    "referencedColumns": [
      "id",
      "product_id"
    ]
  }
];
  };
  carts: {
    Row: {
      id: string;
      customer_id: string;
      currency: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      customer_id: string;
      currency?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      customer_id?: string;
      currency?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "carts_customer_id_fkey",
    "columns": [
      "customer_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  categories: {
    Row: {
      id: string;
      parent_id: string | null;
      slug: string;
      name_ar: string;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      parent_id?: string | null;
      slug: string;
      name_ar: string;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      parent_id?: string | null;
      slug?: string;
      name_ar?: string;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "categories_parent_id_fkey",
    "columns": [
      "parent_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "categories",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  commission_entries: {
    Row: {
      id: string;
      kind: Database['public']['Enums']['commission_kind'];
      seller_order_id: string | null;
      shipment_id: string | null;
      seller_rule_id: string | null;
      delivery_rule_id: string | null;
      basis_minor: number;
      amount_minor: number;
      currency: string;
      idempotency_key: string;
      rule_snapshot: Json;
      eligibility_evidence: Json;
      eligible_at: string | null;
      reverses_entry_id: string | null;
      reason: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      kind: Database['public']['Enums']['commission_kind'];
      seller_order_id?: string | null;
      shipment_id?: string | null;
      seller_rule_id?: string | null;
      delivery_rule_id?: string | null;
      basis_minor: number;
      amount_minor: number;
      currency?: string;
      idempotency_key: string;
      rule_snapshot: Json;
      eligibility_evidence: Json;
      eligible_at?: string | null;
      reverses_entry_id?: string | null;
      reason: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      kind?: Database['public']['Enums']['commission_kind'];
      seller_order_id?: string | null;
      shipment_id?: string | null;
      seller_rule_id?: string | null;
      delivery_rule_id?: string | null;
      basis_minor?: number;
      amount_minor?: number;
      currency?: string;
      idempotency_key?: string;
      rule_snapshot?: Json;
      eligibility_evidence?: Json;
      eligible_at?: string | null;
      reverses_entry_id?: string | null;
      reason?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "commission_entries_delivery_rule_id_fkey",
    "columns": [
      "delivery_rule_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_commission_rules",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "commission_entries_reverses_entry_id_fkey",
    "columns": [
      "reverses_entry_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "commission_entries",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "commission_entries_seller_order_id_fkey",
    "columns": [
      "seller_order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_orders",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "commission_entries_seller_rule_id_fkey",
    "columns": [
      "seller_rule_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_commission_rules",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "commission_entries_shipment_id_fkey",
    "columns": [
      "shipment_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "shipments",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  commission_status_history: {
    Row: {
      id: string;
      commission_entry_id: string;
      status: string;
      evidence: Json;
      reason: string;
      actor_id: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      commission_entry_id: string;
      status: string;
      evidence: Json;
      reason: string;
      actor_id?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      commission_entry_id?: string;
      status?: string;
      evidence?: Json;
      reason?: string;
      actor_id?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "commission_status_history_actor_id_fkey",
    "columns": [
      "actor_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "commission_status_history_commission_entry_id_fkey",
    "columns": [
      "commission_entry_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "commission_entries",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  complaint_actions: {
    Row: {
      id: string;
      complaint_id: string;
      actor_id: string | null;
      visibility: string;
      action: string;
      note: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      complaint_id: string;
      actor_id?: string | null;
      visibility: string;
      action: string;
      note: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      complaint_id?: string;
      actor_id?: string | null;
      visibility?: string;
      action?: string;
      note?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "complaint_actions_actor_id_fkey",
    "columns": [
      "actor_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "complaint_actions_complaint_id_fkey",
    "columns": [
      "complaint_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "complaints",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  complaints: {
    Row: {
      id: string;
      customer_id: string;
      store_id: string;
      order_item_id: string | null;
      type: string;
      priority: string;
      status: Database['public']['Enums']['case_status'];
      body: string;
      assigned_to: string | null;
      closed_at: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      customer_id: string;
      store_id: string;
      order_item_id?: string | null;
      type: string;
      priority?: string;
      status?: Database['public']['Enums']['case_status'];
      body: string;
      assigned_to?: string | null;
      closed_at?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      customer_id?: string;
      store_id?: string;
      order_item_id?: string | null;
      type?: string;
      priority?: string;
      status?: Database['public']['Enums']['case_status'];
      body?: string;
      assigned_to?: string | null;
      closed_at?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "complaints_assigned_to_fkey",
    "columns": [
      "assigned_to"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "complaints_customer_id_fkey",
    "columns": [
      "customer_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "complaints_order_item_id_fkey",
    "columns": [
      "order_item_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "order_items",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "complaints_store_id_fkey",
    "columns": [
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "stores",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  customer_addresses: {
    Row: {
      id: string;
      customer_id: string;
      label: string;
      emirate: Database['public']['Enums']['emirate_code'];
      area_code: string;
      address_lines: string;
      recipient_name: string;
      phone: string;
      archived_at: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      customer_id: string;
      label: string;
      emirate: Database['public']['Enums']['emirate_code'];
      area_code: string;
      address_lines: string;
      recipient_name: string;
      phone: string;
      archived_at?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      customer_id?: string;
      label?: string;
      emirate?: Database['public']['Enums']['emirate_code'];
      area_code?: string;
      address_lines?: string;
      recipient_name?: string;
      phone?: string;
      archived_at?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "customer_addresses_customer_id_fkey",
    "columns": [
      "customer_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_allocation_policies: {
    Row: {
      id: string;
      version: number;
      cost_weight: number;
      eta_weight: number;
      performance_weight: number;
      minimum_reliable_samples: number;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      version: number;
      cost_weight?: number;
      eta_weight?: number;
      performance_weight?: number;
      minimum_reliable_samples?: number;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      version?: number;
      cost_weight?: number;
      eta_weight?: number;
      performance_weight?: number;
      minimum_reliable_samples?: number;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [];
  };
  delivery_assignments: {
    Row: {
      id: string;
      shipment_id: string;
      company_id: string;
      policy_id: string | null;
      reason_snapshot: Json;
      assigned_by: string | null;
      assigned_at: string;
      superseded_at: string | null;
    };
    Insert: {
      id?: string;
      shipment_id: string;
      company_id: string;
      policy_id?: string | null;
      reason_snapshot: Json;
      assigned_by?: string | null;
      assigned_at?: string;
      superseded_at?: string | null;
    };
    Update: {
      id?: string;
      shipment_id?: string;
      company_id?: string;
      policy_id?: string | null;
      reason_snapshot?: Json;
      assigned_by?: string | null;
      assigned_at?: string;
      superseded_at?: string | null;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_assignments_assigned_by_fkey",
    "columns": [
      "assigned_by"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "delivery_assignments_company_id_fkey",
    "columns": [
      "company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_companies",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "delivery_assignments_policy_id_fkey",
    "columns": [
      "policy_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_allocation_policies",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "delivery_assignments_shipment_id_fkey",
    "columns": [
      "shipment_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "shipments",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_commission_rules: {
    Row: {
      id: string;
      contract_id: string;
      version: number;
      eligibility_policy: Json;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      contract_id: string;
      version: number;
      eligibility_policy?: Json;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      contract_id?: string;
      version?: number;
      eligibility_policy?: Json;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_commission_rules_contract_id_fkey",
    "columns": [
      "contract_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_contracts",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_companies: {
    Row: {
      id: string;
      name_ar: string;
      active: boolean;
      contact: Json;
      hours: Json;
      capacity_daily: number | null;
      reliable_performance_bps: number | null;
      performance_sample_size: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      name_ar: string;
      active?: boolean;
      contact?: Json;
      hours?: Json;
      capacity_daily?: number | null;
      reliable_performance_bps?: number | null;
      performance_sample_size?: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      name_ar?: string;
      active?: boolean;
      contact?: Json;
      hours?: Json;
      capacity_daily?: number | null;
      reliable_performance_bps?: number | null;
      performance_sample_size?: number;
      created_at?: string;
    };
    Relationships: [];
  };
  delivery_contracts: {
    Row: {
      id: string;
      company_id: string;
      version: number;
      model: Database['public']['Enums']['commission_model'];
      fixed_minor: number;
      rate_bps: number;
      currency: string;
      commission_deducted_from_carrier: boolean;
      valid_from: string;
      valid_until: string | null;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      company_id: string;
      version: number;
      model: Database['public']['Enums']['commission_model'];
      fixed_minor?: number;
      rate_bps?: number;
      currency?: string;
      commission_deducted_from_carrier?: boolean;
      valid_from: string;
      valid_until?: string | null;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      company_id?: string;
      version?: number;
      model?: Database['public']['Enums']['commission_model'];
      fixed_minor?: number;
      rate_bps?: number;
      currency?: string;
      commission_deducted_from_carrier?: boolean;
      valid_from?: string;
      valid_until?: string | null;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_contracts_company_id_fkey",
    "columns": [
      "company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_companies",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_coverage: {
    Row: {
      id: string;
      service_id: string;
      emirate: Database['public']['Enums']['emirate_code'];
      area_code: string;
      pickup: boolean;
      dropoff: boolean;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      service_id: string;
      emirate: Database['public']['Enums']['emirate_code'];
      area_code: string;
      pickup: boolean;
      dropoff: boolean;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      service_id?: string;
      emirate?: Database['public']['Enums']['emirate_code'];
      area_code?: string;
      pickup?: boolean;
      dropoff?: boolean;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_coverage_service_id_fkey",
    "columns": [
      "service_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_services",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_operators: {
    Row: {
      id: string;
      company_id: string;
      user_id: string;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      company_id: string;
      user_id: string;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      company_id?: string;
      user_id?: string;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_operators_company_id_fkey",
    "columns": [
      "company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_companies",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "delivery_operators_user_id_fkey",
    "columns": [
      "user_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_rate_cards: {
    Row: {
      id: string;
      service_id: string;
      pickup_emirate: Database['public']['Enums']['emirate_code'];
      pickup_area_code: string;
      dropoff_emirate: Database['public']['Enums']['emirate_code'];
      dropoff_area_code: string;
      currency: string;
      base_minor: number;
      per_kg_minor: number;
      per_volume_unit_minor: number;
      volume_unit_cm3: number;
      special_handling_minor: number;
      disclosed_surcharge_minor: number;
      max_weight_grams: number | null;
      max_volume_cm3: number | null;
      valid_from: string;
      valid_until: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      service_id: string;
      pickup_emirate: Database['public']['Enums']['emirate_code'];
      pickup_area_code: string;
      dropoff_emirate: Database['public']['Enums']['emirate_code'];
      dropoff_area_code: string;
      currency?: string;
      base_minor: number;
      per_kg_minor?: number;
      per_volume_unit_minor?: number;
      volume_unit_cm3?: number;
      special_handling_minor?: number;
      disclosed_surcharge_minor?: number;
      max_weight_grams?: number | null;
      max_volume_cm3?: number | null;
      valid_from: string;
      valid_until?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      service_id?: string;
      pickup_emirate?: Database['public']['Enums']['emirate_code'];
      pickup_area_code?: string;
      dropoff_emirate?: Database['public']['Enums']['emirate_code'];
      dropoff_area_code?: string;
      currency?: string;
      base_minor?: number;
      per_kg_minor?: number;
      per_volume_unit_minor?: number;
      volume_unit_cm3?: number;
      special_handling_minor?: number;
      disclosed_surcharge_minor?: number;
      max_weight_grams?: number | null;
      max_volume_cm3?: number | null;
      valid_from?: string;
      valid_until?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_rate_cards_service_id_fkey",
    "columns": [
      "service_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_services",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_services: {
    Row: {
      id: string;
      company_id: string;
      code: string;
      name_ar: string;
      active: boolean;
      shipping_classes: string[];
      eta_minutes: number;
      capacity_daily: number | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      company_id: string;
      code: string;
      name_ar: string;
      active?: boolean;
      shipping_classes?: string[];
      eta_minutes: number;
      capacity_daily?: number | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      company_id?: string;
      code?: string;
      name_ar?: string;
      active?: boolean;
      shipping_classes?: string[];
      eta_minutes?: number;
      capacity_daily?: number | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_services_company_id_fkey",
    "columns": [
      "company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_companies",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  delivery_settlements: {
    Row: {
      id: string;
      company_id: string;
      currency: string;
      idempotency_key: string;
      amount_minor: number;
      status: Database['public']['Enums']['settlement_status'];
      reason: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      company_id: string;
      currency?: string;
      idempotency_key: string;
      amount_minor: number;
      status?: Database['public']['Enums']['settlement_status'];
      reason: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      company_id?: string;
      currency?: string;
      idempotency_key?: string;
      amount_minor?: number;
      status?: Database['public']['Enums']['settlement_status'];
      reason?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "delivery_settlements_company_id_fkey",
    "columns": [
      "company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_companies",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  financial_ledger_entries: {
    Row: {
      id: string;
      batch_id: string;
      account_code: string;
      seller_id: string | null;
      company_id: string | null;
      order_id: string | null;
      commission_entry_id: string | null;
      payment_transaction_id: string | null;
      refund_id: string | null;
      debit_minor: number;
      credit_minor: number;
      currency: string;
      reverses_entry_id: string | null;
      idempotency_key: string;
      reason: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      batch_id: string;
      account_code: string;
      seller_id?: string | null;
      company_id?: string | null;
      order_id?: string | null;
      commission_entry_id?: string | null;
      payment_transaction_id?: string | null;
      refund_id?: string | null;
      debit_minor?: number;
      credit_minor?: number;
      currency?: string;
      reverses_entry_id?: string | null;
      idempotency_key: string;
      reason: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      batch_id?: string;
      account_code?: string;
      seller_id?: string | null;
      company_id?: string | null;
      order_id?: string | null;
      commission_entry_id?: string | null;
      payment_transaction_id?: string | null;
      refund_id?: string | null;
      debit_minor?: number;
      credit_minor?: number;
      currency?: string;
      reverses_entry_id?: string | null;
      idempotency_key?: string;
      reason?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "financial_ledger_entries_commission_entry_id_fkey",
    "columns": [
      "commission_entry_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "commission_entries",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "financial_ledger_entries_company_id_fkey",
    "columns": [
      "company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_companies",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "financial_ledger_entries_order_id_fkey",
    "columns": [
      "order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "orders",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "financial_ledger_entries_payment_transaction_id_fkey",
    "columns": [
      "payment_transaction_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "payment_transactions",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "financial_ledger_entries_refund_id_fkey",
    "columns": [
      "refund_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "refunds",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "financial_ledger_entries_reverses_entry_id_fkey",
    "columns": [
      "reverses_entry_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "financial_ledger_entries",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "financial_ledger_entries_seller_id_fkey",
    "columns": [
      "seller_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  import_batches: {
    Row: {
      id: string;
      source_hash: string;
      requested_by: string;
      status: string;
      summary: Json;
      created_at: string;
    };
    Insert: {
      id?: string;
      source_hash: string;
      requested_by: string;
      status: string;
      summary: Json;
      created_at?: string;
    };
    Update: {
      id?: string;
      source_hash?: string;
      requested_by?: string;
      status?: string;
      summary?: Json;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "import_batches_requested_by_fkey",
    "columns": [
      "requested_by"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  inventory_movements: {
    Row: {
      id: string;
      product_id: string;
      variant_id: string | null;
      order_item_id: string | null;
      quantity_delta: number;
      reason: string;
      idempotency_key: string;
      actor_id: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      variant_id?: string | null;
      order_item_id?: string | null;
      quantity_delta: number;
      reason: string;
      idempotency_key: string;
      actor_id?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      product_id?: string;
      variant_id?: string | null;
      order_item_id?: string | null;
      quantity_delta?: number;
      reason?: string;
      idempotency_key?: string;
      actor_id?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "inventory_movements_actor_id_fkey",
    "columns": [
      "actor_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "inventory_movements_order_item_id_fkey",
    "columns": [
      "order_item_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "order_items",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "inventory_movements_product_id_fkey",
    "columns": [
      "product_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "products",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "inventory_movements_variant_id_product_id_fkey",
    "columns": [
      "variant_id",
      "product_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "product_variants",
    "referencedColumns": [
      "id",
      "product_id"
    ]
  }
];
  };
  moderation_actions: {
    Row: {
      id: string;
      store_id: string | null;
      product_id: string | null;
      user_id: string | null;
      actor_id: string;
      decision: string;
      reason: string;
      previous_value: Json | null;
      next_value: Json | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      store_id?: string | null;
      product_id?: string | null;
      user_id?: string | null;
      actor_id: string;
      decision: string;
      reason: string;
      previous_value?: Json | null;
      next_value?: Json | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      store_id?: string | null;
      product_id?: string | null;
      user_id?: string | null;
      actor_id?: string;
      decision?: string;
      reason?: string;
      previous_value?: Json | null;
      next_value?: Json | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "moderation_actions_actor_id_fkey",
    "columns": [
      "actor_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "moderation_actions_product_id_fkey",
    "columns": [
      "product_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "products",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "moderation_actions_store_id_fkey",
    "columns": [
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "stores",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "moderation_actions_user_id_fkey",
    "columns": [
      "user_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  notifications: {
    Row: {
      id: string;
      user_id: string;
      type: string;
      title_ar: string;
      body_ar: string;
      read_at: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      type: string;
      title_ar: string;
      body_ar: string;
      read_at?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      type?: string;
      title_ar?: string;
      body_ar?: string;
      read_at?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "notifications_user_id_fkey",
    "columns": [
      "user_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  order_items: {
    Row: {
      id: string;
      order_id: string;
      seller_order_id: string;
      store_id: string;
      product_id: string;
      variant_id: string | null;
      product_name_snapshot: string;
      sku_snapshot: string;
      quantity: number;
      unit_price_minor: number;
      discount_minor: number;
      tax_minor: number;
      total_minor: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      seller_order_id: string;
      store_id: string;
      product_id: string;
      variant_id?: string | null;
      product_name_snapshot: string;
      sku_snapshot: string;
      quantity: number;
      unit_price_minor: number;
      discount_minor?: number;
      tax_minor?: number;
      total_minor: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      order_id?: string;
      seller_order_id?: string;
      store_id?: string;
      product_id?: string;
      variant_id?: string | null;
      product_name_snapshot?: string;
      sku_snapshot?: string;
      quantity?: number;
      unit_price_minor?: number;
      discount_minor?: number;
      tax_minor?: number;
      total_minor?: number;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "order_items_product_id_store_id_fkey",
    "columns": [
      "product_id",
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "products",
    "referencedColumns": [
      "id",
      "store_id"
    ]
  },
  {
    "foreignKeyName": "order_items_seller_order_id_order_id_store_id_fkey",
    "columns": [
      "seller_order_id",
      "order_id",
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_orders",
    "referencedColumns": [
      "id",
      "order_id",
      "store_id"
    ]
  },
  {
    "foreignKeyName": "order_items_variant_id_product_id_fkey",
    "columns": [
      "variant_id",
      "product_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "product_variants",
    "referencedColumns": [
      "id",
      "product_id"
    ]
  }
];
  };
  order_status_history: {
    Row: {
      id: string;
      seller_order_id: string;
      from_status: Database['public']['Enums']['order_status'] | null;
      to_status: Database['public']['Enums']['order_status'];
      actor_id: string | null;
      source: string;
      reason: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_order_id: string;
      from_status?: Database['public']['Enums']['order_status'] | null;
      to_status: Database['public']['Enums']['order_status'];
      actor_id?: string | null;
      source: string;
      reason: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      seller_order_id?: string;
      from_status?: Database['public']['Enums']['order_status'] | null;
      to_status?: Database['public']['Enums']['order_status'];
      actor_id?: string | null;
      source?: string;
      reason?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "order_status_history_actor_id_fkey",
    "columns": [
      "actor_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "order_status_history_seller_order_id_fkey",
    "columns": [
      "seller_order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_orders",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  orders: {
    Row: {
      id: string;
      customer_id: string;
      idempotency_key: string;
      request_hash: string;
      status: Database['public']['Enums']['order_status'];
      currency: string;
      subtotal_minor: number;
      discount_minor: number;
      delivery_minor: number;
      tax_minor: number;
      total_minor: number;
      delivery_address_snapshot: Json;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      customer_id: string;
      idempotency_key: string;
      request_hash: string;
      status?: Database['public']['Enums']['order_status'];
      currency?: string;
      subtotal_minor: number;
      discount_minor?: number;
      delivery_minor: number;
      tax_minor?: number;
      total_minor: number;
      delivery_address_snapshot: Json;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      customer_id?: string;
      idempotency_key?: string;
      request_hash?: string;
      status?: Database['public']['Enums']['order_status'];
      currency?: string;
      subtotal_minor?: number;
      discount_minor?: number;
      delivery_minor?: number;
      tax_minor?: number;
      total_minor?: number;
      delivery_address_snapshot?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "orders_customer_id_fkey",
    "columns": [
      "customer_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  payment_events: {
    Row: {
      id: string;
      intent_id: string;
      provider: string;
      provider_event_id: string;
      event_type: string;
      payload_hash: string;
      verified_at: string;
      received_at: string;
    };
    Insert: {
      id?: string;
      intent_id: string;
      provider: string;
      provider_event_id: string;
      event_type: string;
      payload_hash: string;
      verified_at: string;
      received_at?: string;
    };
    Update: {
      id?: string;
      intent_id?: string;
      provider?: string;
      provider_event_id?: string;
      event_type?: string;
      payload_hash?: string;
      verified_at?: string;
      received_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "payment_events_intent_id_fkey",
    "columns": [
      "intent_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "payment_intents",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  payment_intents: {
    Row: {
      id: string;
      order_id: string;
      provider: string;
      provider_intent_id: string | null;
      idempotency_key: string;
      amount_minor: number;
      currency: string;
      status: Database['public']['Enums']['payment_status'];
      expires_at: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      provider?: string;
      provider_intent_id?: string | null;
      idempotency_key: string;
      amount_minor: number;
      currency?: string;
      status?: Database['public']['Enums']['payment_status'];
      expires_at: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      order_id?: string;
      provider?: string;
      provider_intent_id?: string | null;
      idempotency_key?: string;
      amount_minor?: number;
      currency?: string;
      status?: Database['public']['Enums']['payment_status'];
      expires_at?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "payment_intents_order_id_fkey",
    "columns": [
      "order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "orders",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  payment_transactions: {
    Row: {
      id: string;
      intent_id: string;
      order_id: string;
      event_id: string;
      provider_transaction_id: string;
      kind: string;
      amount_minor: number;
      gateway_fee_minor: number;
      currency: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      intent_id: string;
      order_id: string;
      event_id: string;
      provider_transaction_id: string;
      kind: string;
      amount_minor: number;
      gateway_fee_minor?: number;
      currency?: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      intent_id?: string;
      order_id?: string;
      event_id?: string;
      provider_transaction_id?: string;
      kind?: string;
      amount_minor?: number;
      gateway_fee_minor?: number;
      currency?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "payment_transactions_event_id_fkey",
    "columns": [
      "event_id"
    ],
    "isOneToOne": true,
    "referencedRelation": "payment_events",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "payment_transactions_intent_id_order_id_fkey",
    "columns": [
      "intent_id",
      "order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "payment_intents",
    "referencedColumns": [
      "id",
      "order_id"
    ]
  }
];
  };
  product_images: {
    Row: {
      id: string;
      product_id: string;
      store_id: string;
      object_path: string;
      alt_ar: string;
      sort_order: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      store_id: string;
      object_path: string;
      alt_ar?: string;
      sort_order?: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      product_id?: string;
      store_id?: string;
      object_path?: string;
      alt_ar?: string;
      sort_order?: number;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "product_images_product_id_store_id_fkey",
    "columns": [
      "product_id",
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "products",
    "referencedColumns": [
      "id",
      "store_id"
    ]
  }
];
  };
  product_variants: {
    Row: {
      id: string;
      product_id: string;
      sku: string;
      attributes: Json;
      price_minor: number;
      inventory_quantity: number;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      sku: string;
      attributes?: Json;
      price_minor: number;
      inventory_quantity?: number;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      product_id?: string;
      sku?: string;
      attributes?: Json;
      price_minor?: number;
      inventory_quantity?: number;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "product_variants_product_id_fkey",
    "columns": [
      "product_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "products",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  products: {
    Row: {
      id: string;
      store_id: string;
      category_id: string;
      sku: string;
      name_ar: string;
      description: string;
      kind: string;
      status: Database['public']['Enums']['product_status'];
      moderation_hidden: boolean;
      price_minor: number;
      currency: string;
      inventory_quantity: number;
      shipping_class: string;
      weight_grams: number | null;
      volume_cm3: number | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      store_id: string;
      category_id: string;
      sku: string;
      name_ar: string;
      description?: string;
      kind: string;
      status?: Database['public']['Enums']['product_status'];
      moderation_hidden?: boolean;
      price_minor: number;
      currency?: string;
      inventory_quantity?: number;
      shipping_class?: string;
      weight_grams?: number | null;
      volume_cm3?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      store_id?: string;
      category_id?: string;
      sku?: string;
      name_ar?: string;
      description?: string;
      kind?: string;
      status?: Database['public']['Enums']['product_status'];
      moderation_hidden?: boolean;
      price_minor?: number;
      currency?: string;
      inventory_quantity?: number;
      shipping_class?: string;
      weight_grams?: number | null;
      volume_cm3?: number | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "products_category_id_fkey",
    "columns": [
      "category_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "categories",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "products_store_id_fkey",
    "columns": [
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "stores",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  profiles: {
    Row: {
      id: string;
      display_name: string;
      active: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id: string;
      display_name: string;
      active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      display_name?: string;
      active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "profiles_id_fkey",
    "columns": [
      "id"
    ],
    "isOneToOne": true,
    "referencedRelation": "auth.users",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  refund_items: {
    Row: {
      id: string;
      refund_id: string;
      order_id: string;
      order_item_id: string;
      quantity: number;
      amount_minor: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      refund_id: string;
      order_id: string;
      order_item_id: string;
      quantity: number;
      amount_minor: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      refund_id?: string;
      order_id?: string;
      order_item_id?: string;
      quantity?: number;
      amount_minor?: number;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "refund_items_order_item_id_fkey",
    "columns": [
      "order_item_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "order_items",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "refund_items_order_item_id_order_id_fkey",
    "columns": [
      "order_item_id",
      "order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "order_items",
    "referencedColumns": [
      "id",
      "order_id"
    ]
  },
  {
    "foreignKeyName": "refund_items_refund_id_order_id_fkey",
    "columns": [
      "refund_id",
      "order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "refunds",
    "referencedColumns": [
      "id",
      "order_id"
    ]
  }
];
  };
  refunds: {
    Row: {
      id: string;
      order_id: string;
      capture_transaction_id: string;
      idempotency_key: string;
      amount_minor: number;
      delivery_refund_minor: number;
      status: string;
      reason: string;
      requested_by: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      capture_transaction_id: string;
      idempotency_key: string;
      amount_minor: number;
      delivery_refund_minor?: number;
      status?: string;
      reason: string;
      requested_by: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      order_id?: string;
      capture_transaction_id?: string;
      idempotency_key?: string;
      amount_minor?: number;
      delivery_refund_minor?: number;
      status?: string;
      reason?: string;
      requested_by?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "refunds_capture_transaction_id_order_id_fkey",
    "columns": [
      "capture_transaction_id",
      "order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "payment_transactions",
    "referencedColumns": [
      "id",
      "order_id"
    ]
  },
  {
    "foreignKeyName": "refunds_requested_by_fkey",
    "columns": [
      "requested_by"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  seller_commission_rules: {
    Row: {
      id: string;
      seller_id: string | null;
      version: number;
      rate_bps: number;
      currency: string;
      exclude_delivery: boolean;
      tax_basis: string;
      discount_basis: string;
      refund_policy: string;
      eligibility_policy: Json;
      valid_from: string;
      valid_until: string | null;
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_id?: string | null;
      version: number;
      rate_bps?: number;
      currency?: string;
      exclude_delivery?: boolean;
      tax_basis?: string;
      discount_basis?: string;
      refund_policy?: string;
      eligibility_policy?: Json;
      valid_from: string;
      valid_until?: string | null;
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      seller_id?: string | null;
      version?: number;
      rate_bps?: number;
      currency?: string;
      exclude_delivery?: boolean;
      tax_basis?: string;
      discount_basis?: string;
      refund_policy?: string;
      eligibility_policy?: Json;
      valid_from?: string;
      valid_until?: string | null;
      active?: boolean;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "seller_commission_rules_seller_id_fkey",
    "columns": [
      "seller_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  seller_orders: {
    Row: {
      id: string;
      order_id: string;
      store_id: string;
      status: Database['public']['Enums']['order_status'];
      subtotal_minor: number;
      discount_minor: number;
      tax_minor: number;
      total_minor: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      store_id: string;
      status?: Database['public']['Enums']['order_status'];
      subtotal_minor: number;
      discount_minor?: number;
      tax_minor?: number;
      total_minor: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      order_id?: string;
      store_id?: string;
      status?: Database['public']['Enums']['order_status'];
      subtotal_minor?: number;
      discount_minor?: number;
      tax_minor?: number;
      total_minor?: number;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "seller_orders_order_id_fkey",
    "columns": [
      "order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "orders",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "seller_orders_store_id_fkey",
    "columns": [
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "stores",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  seller_profiles: {
    Row: {
      id: string;
      user_id: string;
      business_name: string;
      onboarding_status: Database['public']['Enums']['review_status'];
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      business_name: string;
      onboarding_status?: Database['public']['Enums']['review_status'];
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      business_name?: string;
      onboarding_status?: Database['public']['Enums']['review_status'];
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "seller_profiles_user_id_fkey",
    "columns": [
      "user_id"
    ],
    "isOneToOne": true,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  seller_settlements: {
    Row: {
      id: string;
      seller_id: string;
      currency: string;
      idempotency_key: string;
      amount_minor: number;
      status: Database['public']['Enums']['settlement_status'];
      reason: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_id: string;
      currency?: string;
      idempotency_key: string;
      amount_minor: number;
      status?: Database['public']['Enums']['settlement_status'];
      reason: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      seller_id?: string;
      currency?: string;
      idempotency_key?: string;
      amount_minor?: number;
      status?: Database['public']['Enums']['settlement_status'];
      reason?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "seller_settlements_seller_id_fkey",
    "columns": [
      "seller_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  settlement_events: {
    Row: {
      id: string;
      seller_settlement_id: string | null;
      delivery_settlement_id: string | null;
      from_status: Database['public']['Enums']['settlement_status'] | null;
      to_status: Database['public']['Enums']['settlement_status'];
      evidence: Json;
      reason: string;
      actor_id: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_settlement_id?: string | null;
      delivery_settlement_id?: string | null;
      from_status?: Database['public']['Enums']['settlement_status'] | null;
      to_status: Database['public']['Enums']['settlement_status'];
      evidence: Json;
      reason: string;
      actor_id?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      seller_settlement_id?: string | null;
      delivery_settlement_id?: string | null;
      from_status?: Database['public']['Enums']['settlement_status'] | null;
      to_status?: Database['public']['Enums']['settlement_status'];
      evidence?: Json;
      reason?: string;
      actor_id?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "settlement_events_actor_id_fkey",
    "columns": [
      "actor_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "settlement_events_delivery_settlement_id_fkey",
    "columns": [
      "delivery_settlement_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_settlements",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "settlement_events_seller_settlement_id_fkey",
    "columns": [
      "seller_settlement_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_settlements",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  settlement_items: {
    Row: {
      id: string;
      seller_settlement_id: string | null;
      delivery_settlement_id: string | null;
      ledger_entry_id: string;
      amount_minor: number;
      idempotency_key: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_settlement_id?: string | null;
      delivery_settlement_id?: string | null;
      ledger_entry_id: string;
      amount_minor: number;
      idempotency_key: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      seller_settlement_id?: string | null;
      delivery_settlement_id?: string | null;
      ledger_entry_id?: string;
      amount_minor?: number;
      idempotency_key?: string;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "settlement_items_delivery_settlement_id_fkey",
    "columns": [
      "delivery_settlement_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_settlements",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "settlement_items_ledger_entry_id_fkey",
    "columns": [
      "ledger_entry_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "financial_ledger_entries",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "settlement_items_seller_settlement_id_fkey",
    "columns": [
      "seller_settlement_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_settlements",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  shipment_items: {
    Row: {
      id: string;
      shipment_id: string;
      seller_order_id: string;
      order_item_id: string;
      quantity: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      shipment_id: string;
      seller_order_id: string;
      order_item_id: string;
      quantity: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      shipment_id?: string;
      seller_order_id?: string;
      order_item_id?: string;
      quantity?: number;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "shipment_items_order_item_id_seller_order_id_fkey",
    "columns": [
      "order_item_id",
      "seller_order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "order_items",
    "referencedColumns": [
      "id",
      "seller_order_id"
    ]
  },
  {
    "foreignKeyName": "shipment_items_shipment_id_seller_order_id_fkey",
    "columns": [
      "shipment_id",
      "seller_order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "shipments",
    "referencedColumns": [
      "id",
      "seller_order_id"
    ]
  }
];
  };
  shipment_tracking_events: {
    Row: {
      id: string;
      shipment_id: string;
      provider: string;
      provider_event_id: string;
      status: Database['public']['Enums']['shipment_status'];
      trusted_source: string;
      evidence: Json;
      verified_at: string;
      received_at: string;
    };
    Insert: {
      id?: string;
      shipment_id: string;
      provider: string;
      provider_event_id: string;
      status: Database['public']['Enums']['shipment_status'];
      trusted_source: string;
      evidence: Json;
      verified_at: string;
      received_at?: string;
    };
    Update: {
      id?: string;
      shipment_id?: string;
      provider?: string;
      provider_event_id?: string;
      status?: Database['public']['Enums']['shipment_status'];
      trusted_source?: string;
      evidence?: Json;
      verified_at?: string;
      received_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "shipment_tracking_events_shipment_id_fkey",
    "columns": [
      "shipment_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "shipments",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  shipments: {
    Row: {
      id: string;
      seller_order_id: string;
      status: Database['public']['Enums']['shipment_status'];
      delivery_company_id: string | null;
      delivery_service_id: string | null;
      delivery_contract_id: string | null;
      rate_card_id: string | null;
      quote_snapshot: Json;
      allocation_snapshot: Json;
      pickup_snapshot: Json;
      dropoff_snapshot: Json;
      customer_fee_minor: number;
      carrier_gross_minor: number;
      currency: string;
      promised_at: string | null;
      delivered_at: string | null;
      delivery_evidence_id: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_order_id: string;
      status?: Database['public']['Enums']['shipment_status'];
      delivery_company_id?: string | null;
      delivery_service_id?: string | null;
      delivery_contract_id?: string | null;
      rate_card_id?: string | null;
      quote_snapshot: Json;
      allocation_snapshot: Json;
      pickup_snapshot: Json;
      dropoff_snapshot: Json;
      customer_fee_minor: number;
      carrier_gross_minor: number;
      currency?: string;
      promised_at?: string | null;
      delivered_at?: string | null;
      delivery_evidence_id?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      seller_order_id?: string;
      status?: Database['public']['Enums']['shipment_status'];
      delivery_company_id?: string | null;
      delivery_service_id?: string | null;
      delivery_contract_id?: string | null;
      rate_card_id?: string | null;
      quote_snapshot?: Json;
      allocation_snapshot?: Json;
      pickup_snapshot?: Json;
      dropoff_snapshot?: Json;
      customer_fee_minor?: number;
      carrier_gross_minor?: number;
      currency?: string;
      promised_at?: string | null;
      delivered_at?: string | null;
      delivery_evidence_id?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "shipments_delivery_company_id_fkey",
    "columns": [
      "delivery_company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_companies",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "shipments_delivery_contract_id_delivery_company_id_fkey",
    "columns": [
      "delivery_contract_id",
      "delivery_company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_contracts",
    "referencedColumns": [
      "id",
      "company_id"
    ]
  },
  {
    "foreignKeyName": "shipments_delivery_evidence_id_id_fkey",
    "columns": [
      "delivery_evidence_id",
      "id"
    ],
    "isOneToOne": false,
    "referencedRelation": "shipment_tracking_events",
    "referencedColumns": [
      "id",
      "shipment_id"
    ]
  },
  {
    "foreignKeyName": "shipments_delivery_service_id_delivery_company_id_fkey",
    "columns": [
      "delivery_service_id",
      "delivery_company_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_services",
    "referencedColumns": [
      "id",
      "company_id"
    ]
  },
  {
    "foreignKeyName": "shipments_rate_card_id_fkey",
    "columns": [
      "rate_card_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "delivery_rate_cards",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "shipments_seller_order_id_fkey",
    "columns": [
      "seller_order_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_orders",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  store_documents: {
    Row: {
      id: string;
      store_id: string;
      uploaded_by: string;
      object_path: string;
      document_type: string;
      status: Database['public']['Enums']['review_status'];
      issued_at: string | null;
      expires_at: string | null;
      reviewer_id: string | null;
      review_notes: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      store_id: string;
      uploaded_by: string;
      object_path: string;
      document_type: string;
      status?: Database['public']['Enums']['review_status'];
      issued_at?: string | null;
      expires_at?: string | null;
      reviewer_id?: string | null;
      review_notes?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      store_id?: string;
      uploaded_by?: string;
      object_path?: string;
      document_type?: string;
      status?: Database['public']['Enums']['review_status'];
      issued_at?: string | null;
      expires_at?: string | null;
      reviewer_id?: string | null;
      review_notes?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "store_documents_reviewer_id_fkey",
    "columns": [
      "reviewer_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "store_documents_store_id_fkey",
    "columns": [
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "stores",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "store_documents_uploaded_by_fkey",
    "columns": [
      "uploaded_by"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  store_reviews: {
    Row: {
      id: string;
      store_id: string;
      customer_id: string;
      seller_order_id: string;
      score: number;
      body: string;
      visible: boolean;
      seller_reply: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      store_id: string;
      customer_id: string;
      seller_order_id: string;
      score: number;
      body: string;
      visible?: boolean;
      seller_reply?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      store_id?: string;
      customer_id?: string;
      seller_order_id?: string;
      score?: number;
      body?: string;
      visible?: boolean;
      seller_reply?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "store_reviews_customer_id_fkey",
    "columns": [
      "customer_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "store_reviews_seller_order_id_fkey",
    "columns": [
      "seller_order_id"
    ],
    "isOneToOne": true,
    "referencedRelation": "seller_orders",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "store_reviews_store_id_fkey",
    "columns": [
      "store_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "stores",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  stores: {
    Row: {
      id: string;
      seller_id: string;
      category_id: string | null;
      slug: string;
      name_ar: string;
      description: string;
      emirate: Database['public']['Enums']['emirate_code'];
      area_code: string;
      status: Database['public']['Enums']['store_status'];
      onboarding_status: Database['public']['Enums']['review_status'];
      license_status: Database['public']['Enums']['review_status'];
      hours: Json;
      contact: Json;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      seller_id: string;
      category_id?: string | null;
      slug: string;
      name_ar: string;
      description?: string;
      emirate: Database['public']['Enums']['emirate_code'];
      area_code: string;
      status?: Database['public']['Enums']['store_status'];
      onboarding_status?: Database['public']['Enums']['review_status'];
      license_status?: Database['public']['Enums']['review_status'];
      hours?: Json;
      contact?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      seller_id?: string;
      category_id?: string | null;
      slug?: string;
      name_ar?: string;
      description?: string;
      emirate?: Database['public']['Enums']['emirate_code'];
      area_code?: string;
      status?: Database['public']['Enums']['store_status'];
      onboarding_status?: Database['public']['Enums']['review_status'];
      license_status?: Database['public']['Enums']['review_status'];
      hours?: Json;
      contact?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "stores_category_id_fkey",
    "columns": [
      "category_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "categories",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "stores_seller_id_fkey",
    "columns": [
      "seller_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "seller_profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
  user_roles: {
    Row: {
      id: string;
      user_id: string;
      role: Database['public']['Enums']['app_role'];
      granted_by: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      role: Database['public']['Enums']['app_role'];
      granted_by?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      role?: Database['public']['Enums']['app_role'];
      granted_by?: string | null;
      created_at?: string;
    };
    Relationships: [
  {
    "foreignKeyName": "user_roles_granted_by_fkey",
    "columns": [
      "granted_by"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  },
  {
    "foreignKeyName": "user_roles_user_id_fkey",
    "columns": [
      "user_id"
    ],
    "isOneToOne": false,
    "referencedRelation": "profiles",
    "referencedColumns": [
      "id"
    ]
  }
];
  };
}; Views: { [_ in never]: never }; Functions: { [_ in never]: never }; Enums: {
  app_role: "customer" | "seller" | "admin" | "license_reviewer" | "complaints_officer" | "delivery_operator";
  case_status: "new" | "in_review" | "needs_information" | "processing" | "closed";
  commission_kind: "sale" | "delivery";
  commission_model: "fixed" | "percentage" | "hybrid";
  emirate_code: "abu_dhabi" | "dubai" | "sharjah" | "ajman" | "umm_al_quwain" | "ras_al_khaimah" | "fujairah";
  order_status: "pending_payment" | "confirmed" | "preparing" | "ready" | "shipped" | "completed" | "cancelled";
  payment_status: "created" | "pending" | "succeeded" | "failed" | "expired" | "cancelled" | "partially_refunded" | "refunded";
  product_status: "draft" | "published" | "paused" | "archived";
  review_status: "draft" | "submitted" | "in_review" | "needs_information" | "demo_approved" | "rejected" | "expired";
  settlement_status: "pending" | "eligible" | "on_hold" | "processing" | "settled" | "failed" | "reversed";
  shipment_status: "pending" | "allocated" | "picked_up" | "in_transit" | "delivered" | "failed" | "cancelled";
  store_status: "draft" | "pending" | "active" | "suspended" | "rejected" | "archived";
}; CompositeTypes: { [_ in never]: never }; }; };
export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type Update<T extends TableName> = Database["public"]["Tables"][T]["Update"];
