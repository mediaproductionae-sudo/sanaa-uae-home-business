import type {Database as Foundation,Json} from '../../lib/supabase/database.types';
type Table=Foundation['public']['Tables']['stores'];
type F<A,R>={Args:A;Returns:R};
export type Database={public:Omit<Foundation['public'],'Tables'|'Functions'>&{Tables:Omit<Foundation['public']['Tables'],'stores'>&{stores:Omit<Table,'Row'|'Insert'|'Update'>&{Row:Table['Row']&{logo_path:string|null;cover_path:string|null};Insert:Table['Insert']&{logo_path?:string|null;cover_path?:string|null};Update:Table['Update']&{logo_path?:string|null;cover_path?:string|null}}};Functions:{
 sanaa_upload_slot:F<{store_uuid:string},undefined>;
 sanaa_enroll_seller:F<{business_name:string},string>;
 sanaa_profile_save:F<{display_name:string},undefined>;
 sanaa_save_store:F<{store_uuid:string|null;name_ar:string;description:string;category_uuid:string;emirate:Foundation['public']['Enums']['emirate_code'];area_code:string;hours:Json},string>;
 sanaa_save_product:F<{product_uuid:string|null;store_uuid:string;category_uuid:string;sku:string;name_ar:string;description:string;kind:string;price_minor:number;stock:number;publication:Foundation['public']['Enums']['product_status']},string>;
 sanaa_archive_product:F<{product_uuid:string},undefined>;
 sanaa_register_media:F<{store_uuid:string;product_uuid:string|null;object_path:string;purpose:string;document_type:string},string>;
 sanaa_review_store:F<{store_uuid:string;decision:Foundation['public']['Enums']['store_status'];reason:string},undefined>;
}}};
