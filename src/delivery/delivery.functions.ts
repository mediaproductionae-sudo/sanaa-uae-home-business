import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { deliveryCommandSchema, deliveryReadSchema } from './schema';
import type { Json } from '@/integrations/supabase/types';

// Validation is repeated in the database. Never use an admin client or trust browser roles.
export const readDelivery = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(deliveryReadSchema)
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc('sanaa_delivery_read', { request: data });
    if (error) throw new Error(error.message);
    return result;
  });
export const commandDelivery = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(deliveryCommandSchema)
  .handler(async ({ data, context }) => {
    const rpc = data.action === 'service_state' || data.action === 'coverage_state' ? 'sanaa_delivery_toggle' : 'sanaa_delivery_command';
    const { data: result, error } = await context.supabase.rpc(rpc, {
      command_key: data.key, payload: { action: data.action, data: data.data as Json, reason: data.reason },
    });
    if (error) throw new Error(error.message);
    return result;
  });
