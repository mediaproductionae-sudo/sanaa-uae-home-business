export const deliveryCopy = {
  work_days: ['أيام العمل: 0 للأحد حتى 6 للسبت، مفصولة بفواصل','Work days: 0=Sunday to 6=Saturday, comma-separated'],
  open_time: ['وقت الفتح بتوقيت الإمارات','Opening time (UAE)'], close_time: ['وقت الإغلاق بتوقيت الإمارات؛ تطابق الوقتين يعني 24 ساعة','Closing time (UAE); equal times mean 24 hours'],
  delivery: ['إدارة التوصيل','Delivery Management'], portal: ['بوابة شركاء التوصيل','Delivery Partners'],
  companies: ['شركات التوصيل','Companies'], shipments: ['الشحنات','Shipments'], orders: ['طلبات قابلة للشحن','Eligible seller orders'],
  dashboard: ['لوحة الشركة','Company dashboard'], pending: ['قيد المراجعة','Pending approval'], approved: ['معتمدة','Approved'], suspended: ['معلقة','Suspended'],
  offered: ['بانتظار رد الشركة','Pending offer'], accepted: ['مقبول','Accepted'], rejected: ['مرفوض','Rejected'], expired: ['منتهي — أعد التقييم والإسناد','Expired — re-evaluate and reassign'], superseded: ['تم استبداله','Superseded'],
  allocated: ['تم الإسناد','Allocated'], preparing: ['قيد التجهيز','Preparing'], confirmed: ['مؤكد','Confirmed'], ready: ['جاهز','Ready'], picked_up: ['تم الاستلام','Picked up'], in_transit: ['في الطريق','In transit'], delivered: ['تم التسليم','Delivered'], failed: ['متعثر','Failed'], cancelled: ['ملغى','Cancelled'],
  company_admin: ['مسؤول الشركة','Company admin'], operations: ['العمليات','Operations'], dispatcher: ['منسق الشحن','Dispatcher'], driver: ['السائق','Driver'],
  loading: ['جارٍ تحميل البيانات…','Loading…'], unavailable: ['لا تملك صلاحية الوصول أو أن الشركة غير معتمدة ونشطة.','Access unavailable, or the company is not approved and active.'],
  emptyCompanies: ['لا توجد شركات مسجلة.','No companies registered.'], emptyShipments: ['لا توجد شحنات محفوظة.','No persisted shipments.'],
  emptyOrders: ['لا توجد طلبات مؤكدة ومدفوعة قابلة للشحن حالياً.','No confirmed, paid orders are currently eligible for shipping.'],
  emptyOffers: ['لا توجد خدمات مطابقة. راجع اعتماد الشركة والعقد والأسعار والتغطية الدقيقة والقياسات ووقت الجاهزية والسعة.','No eligible services. Check company approval, current contract/rates, exact coverage, measurements, readiness window and capacity.'],
  saved: ['تم الحفظ بنجاح.','Saved successfully.'], save: ['حفظ','Save'], add: ['إضافة','Add'], createCompany: ['إضافة شركة','Add company'],
  name: ['اسم الشركة','Company name'], capacity: ['السعة اليومية','Daily capacity'], status: ['الحالة','Status'], detail: ['التفاصيل','Details'],
  members: ['أعضاء الشركة','Company members'], account: ['معرّف الحساب المعروف (UUID)','Known account UUID'], role: ['الدور','Role'], active: ['نشط','Active'], inactive: ['غير نشط','Inactive'],
  services: ['الخدمات','Services'], code: ['رمز الخدمة','Service code'], serviceName: ['اسم الخدمة','Service name'], classes: ['فئات الشحن (مفصولة بفاصلة)','Shipping classes (comma-separated)'], eta: ['مدة التوصيل بالدقائق','ETA minutes'],
  contracts: ['العقود والعمولة المعتمدة','Approved contracts and commission'], model: ['نموذج العمولة','Commission model'], fixed: ['ثابتة','Fixed'], percentage: ['نسبة','Percentage'], hybrid: ['مختلطة','Hybrid'],
  fixed_minor: ['العمولة الثابتة بالفلس','Fixed commission, fils'], rate_bps: ['نسبة العمولة بنقاط الأساس','Commission rate, basis points'], valid_from: ['ساري من','Valid from'], valid_until: ['ساري حتى','Valid until'],
  coverage: ['التغطية','Coverage'], service: ['الخدمة','Service'], emirate: ['الإمارة','Emirate'], area_code: ['رمز المنطقة الدقيق','Exact area code'], pickup: ['الاستلام','Pickup'], dropoff: ['التسليم','Drop-off'],
  rates: ['الأسعار المعتمدة بالفلس','Approved prices, fils'], pickup_emirate: ['إمارة الاستلام','Pickup emirate'], pickup_area_code: ['رمز منطقة الاستلام','Pickup area code'], dropoff_emirate: ['إمارة التسليم','Drop-off emirate'], dropoff_area_code: ['رمز منطقة التسليم','Drop-off area code'],
  base_minor: ['السعر الأساسي بالفلس','Base price, fils'], per_kg_minor: ['لكل كغ بالفلس (تقريب لأعلى)','Per kg, fils (rounded up)'], per_volume_unit_minor: ['لكل وحدة حجم بالفلس (تقريب لأعلى)','Per volume unit, fils (rounded up)'], volume_unit_cm3: ['وحدة الحجم سم³','Volume unit, cm³'], special_handling_minor: ['المناولة بالفلس','Handling, fils'], disclosed_surcharge_minor: ['الرسوم المعلنة بالفلس','Disclosed surcharge, fils'], max_weight_grams: ['أقصى وزن بالغرام','Max weight, grams'], max_volume_cm3: ['أقصى حجم سم³','Max volume, cm³'],
  reason: ['السبب / مستند القرار','Reason / decision evidence'], cancel: ['إلغاء','Cancel'], confirm: ['تأكيد','Confirm'],
  prepare: ['تجهيز بيانات الشحن','Prepare shipping data'], weight_grams: ['الوزن المقاس بالغرام','Measured weight, grams'], volume_cm3: ['الحجم المقاس سم³','Measured volume, cm³'], shipping_class: ['فئة الشحن','Shipping class'], address_lines: ['عنوان الاستلام الفعلي','Actual pickup address'], ready_at: ['جاهز للاستلام من','Ready from'], pickup_until: ['آخر وقت للاستلام','Pickup deadline'], deliver_by: ['آخر وقت للتسليم','Delivery deadline'], evidence: ['مرجع القياسات والجاهزية','Measurements / readiness evidence'],
  quote: ['اعتماد عرض الشحن','Approve shipping quote'], create: ['إنشاء الشحنة من عناصر الطلب','Create shipment from order items'], historicalFee: ['رسوم التوصيل التاريخية','Historical delivery fee'], carrierFee: ['سعر الشركة المعتمد','Approved carrier price'],
  quoteMissing: ['يلزم تجهيز القياسات والعنوان والجاهزية، ثم اعتماد عرض يطابق رسوم الطلب المحفوظة. لا يمكن تغيير إجمالي المشتري.','Prepare measurements, pickup and readiness, then approve a quote matching the stored delivery fee. Customer totals cannot change.'],
  assign: ['إسناد يدوي','Manual assignment'], reassign: ['إعادة إسناد','Reassign'], offer_minutes: ['صلاحية العرض بالدقائق (1–60)','Offer expiry, minutes (1–60)'],
  reassignmentConfirm: ['سيتم استبدال العرض السابق. هل تؤكد إعادة الإسناد؟','The previous offer will be superseded. Confirm reassignment?'],
  accept: ['قبول الشحنة','Accept shipment'], reject: ['رفض الشحنة','Reject shipment'], rejectConfirm: ['هل تؤكد رفض الشحنة؟ اكتب سبب الرفض.','Confirm shipment rejection and provide a reason.'], acceptConfirm: ['تأكيد قبول الشحنة بالسعر المحفوظ','Confirm acceptance at the stored price'],
  history: ['سجل عروض الإسناد','Assignment history'], items: ['عناصر الطلب','Order items'], all: ['كل الشحنات','All shipments'], unassigned: ['غير مسندة / منتهية','Unassigned / expired'],
  previous: ['السابق','Previous'], next: ['التالي','Next'], total: ['الإجمالي','Total'], refresh: ['تحديث','Refresh'], back: ['رجوع','Back'],
  disable: ['تعطيل','Disable'], enable: ['تفعيل','Enable'], currency: ['درهم','AED'],
  abu_dhabi: ['أبوظبي','Abu Dhabi'], dubai: ['دبي','Dubai'], sharjah: ['الشارقة','Sharjah'], ajman: ['عجمان','Ajman'], umm_al_quwain: ['أم القيوين','Umm Al Quwain'], ras_al_khaimah: ['رأس الخيمة','Ras Al Khaimah'], fujairah: ['الفجيرة','Fujairah'],
} as const;
export type CopyKey = keyof typeof deliveryCopy;
export function copy(key: string, language: string): string {
  const pair = deliveryCopy[key as CopyKey]; return pair ? pair[language === 'en' ? 1 : 0] : key;
}
const errors: Record<string, readonly [string,string]> = {
  delivery_forbidden: deliveryCopy.unavailable,
  delivery_reason_required: ['اكتب سبباً واضحاً من 3 إلى 1000 حرف.','Provide a clear reason, 3–1000 characters.'],
  delivery_key_conflict: ['تم استخدام معرّف العملية لبيانات مختلفة.','This command key was used for a different payload.'],
  delivery_paid_order_required: ['الطلب غير مدفوع أو ملغى أو غير قابل للشحن.','Order is unpaid, cancelled, or ineligible.'],
  delivery_already_created: ['توجد شحنة لهذا الطلب؛ افتح قائمة الشحنات.','A shipment already exists; open Shipments.'],
  delivery_items_missing: ['الطلب لا يحتوي على عناصر محفوظة.','Order has no persisted items.'],
  delivery_preparation_missing: deliveryCopy.quoteMissing,
  delivery_location_missing: ['العنوان أو رمز المنطقة مفقود في الطلب المحفوظ. لا يمكن تخمينه.','Stored address or exact area code is missing. It cannot be guessed.'],
  delivery_shipping_class_mismatch: ['فئة الشحن لا تطابق المنتجات؛ لا يمكن جمع فئات مختلفة في هذه المرحلة.','Shipping class does not match the products. Mixed classes cannot be combined in this milestone.'],
  delivery_quote_mapping_missing: ['يلزم عرض شحن معتمد ومطابق؛ تقسيم رسوم الطلب متعدد المتاجر ينتظر محرك التسعير.','An approved matching quote is required. Multi-store fee splitting awaits the checkout pricing engine.'],
  delivery_quote_fee_mismatch: ['السعر لا يطابق رسوم التوصيل التاريخية. لا يمكن اعتماد فرق أو تغيير المبلغ.','Price does not match historical delivery fees. A difference or total change cannot be approved.'],
  delivery_no_eligible_service: deliveryCopy.emptyOffers,
  delivery_over_shipment: ['تم شحن عناصر هذا الطلب مسبقاً.','These order items have already been shipped.'],
  delivery_shipment_ineligible: ['الشحنة غير قابلة للإسناد أو بدأ تنفيذها.','Shipment is ineligible or fulfillment has started.'],
  delivery_reassignment_confirmation: deliveryCopy.reassignmentConfirm,
  delivery_stale_offer: ['تم الرد على العرض أو استبداله؛ راجع الحالة الحالية.','Offer was answered or superseded; check its current state.'],
  delivery_offer_expired: deliveryCopy.expired,
  delivery_known_account_required: ['يلزم معرّف حساب موجود ونشط ودور صحيح.','An existing active account UUID and valid role are required.'],
  delivery_not_found: ['السجل غير موجود أو غير متاح لهذا الحساب.','Record not found or unavailable to this account.'],
  delivery_hours_required: ['أدخل أيام وساعات العمل الفعلية للشركة بتوقيت الإمارات.','Enter the company’s actual working days and hours in UAE time.'],
  delivery_invalid_input: ['راجع الحقول المطلوبة والقيم والتواريخ.','Check required fields, values and dates.'],
  delivery_immutable_quote: ['بيانات السعر التاريخية لا تقبل التعديل.','Historical financial snapshots cannot be changed.'],
};
export function deliveryError(error: unknown, language: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const entry = Object.entries(errors).find(([code]) => message.includes(code));
  return entry ? entry[1][language === 'en' ? 1 : 0] : language === 'en' ? 'Unable to complete this request. Check the values and your access, then retry.' : 'تعذر إتمام الطلب. راجع البيانات والصلاحيات ثم أعد المحاولة.';
}
