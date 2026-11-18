/** 4A boundaries only. Implementations and authenticated endpoints belong to 4B–4F. */
import type {Database,Row} from '../supabase/database.types';
export type Role=Database['public']['Enums']['app_role'];
export type Permission='users.read'|'users.manage'|'stores.read'|'stores.manage'|'licenses.review'|'catalog.manage'|'orders.read'|'complaints.manage'|'delivery.manage'|'finance.read'|'finance.manage'|'audit.read';
export type RequestIdentity={userId:string;roles:readonly Role[];permissions:readonly Permission[]};
export type CursorPage<T>={items:T[];nextCursor:string|null};
export type MinorMoney={amountMinor:number;currency:string};
/** Monetary inputs never come from a customer's browser. */
export type CheckoutRequest={cartId:string;addressId:string;idempotencyKey:string};
export type TrustedOrderResult={orderId:string;sellerOrderIds:string[];total:MinorMoney;status:Row<'orders'>['status']};
export type AllocationFailure={code:'NO_ELIGIBLE_CARRIER';eligible:false;reasons:readonly string[]};
export type QuoteSnapshot={serviceId:string;companyId:string;rateCardId:string;contractId:string;fee:MinorMoney;etaMinutes:number;calculationVersion:number;explanation:readonly string[]};
export interface CatalogReadService {
 listPublishedProducts(input:{limit:number;after?:string;categoryId?:string;emirate?:Database['public']['Enums']['emirate_code']}):Promise<CursorPage<Row<'products'>>>;
}
export interface OrderCommandService {
 /** Atomic server transaction: lock stock/rules, allocate delivery, price, snapshot and insert once. */
 create(identity:RequestIdentity,input:CheckoutRequest):Promise<TrustedOrderResult>;
 cancel(identity:RequestIdentity,input:{orderId:string;reason:string;idempotencyKey:string}):Promise<void>;
}
export interface PaymentProviderAdapter {
 readonly mode:'simulation'; // Live payment support deliberately unavailable in Phase 4.
 createIntent(input:{orderId:string;idempotencyKey:string}):Promise<{intentId:string}>;
 /** Invocation only from protected backend test service, never a public client command. */
 verifyEvent(input:{rawBody:Uint8Array;signature:string}):Promise<{providerEventId:string;intentId:string;payloadHash:string}>;
}
export interface SettlementCommandService {
 allocate(identity:RequestIdentity,input:{beneficiaryId:string;ledgerEntryIds:readonly string[];idempotencyKey:string;reason:string}):Promise<{settlementId:string}>;
}
export type SafeServiceError={code:'UNAUTHENTICATED'|'FORBIDDEN'|'INVALID_INPUT'|'CONFLICT'|'RATE_LIMITED'|'TEMPORARILY_UNAVAILABLE';requestId:string};
