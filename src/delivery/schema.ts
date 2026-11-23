import { z } from 'zod';
export const deliveryReadSchema = z.object({
  view: z.enum(['access','companies','company','orders','order','candidates','dashboard','shipments','shipment']),
  id: z.string().uuid().optional(), company_id: z.string().uuid().optional(),
  page: z.number().int().min(0).max(10000).default(0), filter: z.enum(['all','unassigned']).default('all'),
});
export const deliveryCommandSchema = z.object({
  key: z.string().uuid(), action: z.enum(['company','member','service','coverage','contract','rate','prepare','quote','create','assign','accept','reject','service_state','coverage_state']),
  data: z.record(z.string(), z.unknown()), reason: z.string().trim().min(3).max(1000),
});
export type DeliveryRead = z.input<typeof deliveryReadSchema>;
export type DeliveryCommand = z.infer<typeof deliveryCommandSchema>;
export type RecordRow = Record<string, unknown>;
export function row(value: unknown): RecordRow { return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordRow : {}; }
export function rows(value: unknown): RecordRow[] { return Array.isArray(value) ? value.map(row) : []; }
export function text(value: unknown): string { return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''; }
export function canRespond(role: string): boolean { return role === 'company_admin' || role === 'operations'; }
