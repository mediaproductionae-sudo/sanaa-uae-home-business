import type {Database as Foundation,Json} from '../../lib/supabase/database.types';
type Table=Foundation['public']['Tables']['stores'];
type TranslationTable<K extends string>={Row:{id:string;language:string;name:string;description:string;approved:boolean;updated_at:string}&Record<K,string>;Insert:{id?:string;language:string;name?:string;description?:string;approved?:boolean;updated_at?:string}&Record<K,string>;Update:{name?:string;description?:string;approved?:boolean};Relationships:[]};
type F<A,R>={Args:A;Returns:R};
export type Database={public:Omit<Foundation['public'],'Tables'|'Functions'>&{Tables:Omit<Foundation['public']['Tables'],'stores'|'products'>&{store_translations:TranslationTable<'store_id'>;product_translations:TranslationTable<'product_id'>;products:Omit<Foundation['public']['Tables']['products'],'Row'|'Insert'|'Update'>&{Row:Foundation['public']['Tables']['products']['Row']&{original_language:string};Insert:Foundation['public']['Tables']['products']['Insert']&{original_language?:string};Update:Foundation['public']['Tables']['products']['Update']&{original_language?:string}};stores:Omit<Table,'Row'|'Insert'|'Update'>&{Row:Table['Row']&{logo_path:string|null;cover_path:string|null;original_language:string};Insert:Table['Insert']&{logo_path?:string|null;cover_path?:string|null;original_language?:string};Update:Table['Update']&{logo_path?:string|null;cover_path?:string|null;original_language?:string}}};Functions:{
 sanaa_save_store_localized:F<Database['public']['Functions']['sanaa_save_store']['Args']&{translation_name:string;translation_description:string;translation_approved:boolean},string>;
 sanaa_save_product_localized:F<Database['public']['Functions']['sanaa_save_product']['Args']&{original_language:string;translation_name:string;translation_description:string;translation_approved:boolean},string>;
 sanaa_search_catalog_ids:F<{search_text:string;after_uuid?:string|null;category_uuid?:string|null;store_uuid?:string|null;emirate_filter?:Foundation['public']['Enums']['emirate_code']|null},string[]>;
 sanaa_upload_slot:F<{store_uuid:string},undefined>;
 sanaa_enroll_seller:F<{business_name:string},string>;
 sanaa_profile_save:F<{display_name:string},undefined>;
 sanaa_save_store:F<{store_uuid:string|null;name_ar:string;description:string;category_uuid:string;emirate:Foundation['public']['Enums']['emirate_code'];area_code:string;hours:Json},string>;
 sanaa_save_product:F<{product_uuid:string|null;store_uuid:string;category_uuid:string;sku:string;name_ar:string;description:string;kind:string;price_minor:number;stock:number;publication:Foundation['public']['Enums']['product_status']},string>;
 sanaa_archive_product:F<{product_uuid:string},undefined>;
 sanaa_register_media:F<{store_uuid:string;product_uuid:string|null;object_path:string;purpose:string;document_type:string},string>;
 sanaa_review_store:F<{store_uuid:string;decision:Foundation['public']['Enums']['store_status'];reason:string},undefined>;
}}};
