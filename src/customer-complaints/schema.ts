import {z} from 'zod';
export const complaintInput=z.object({requestId:z.string().uuid(),storeId:z.string().uuid(),body:z.string().trim().min(10).max(4000)}).strict();
export type ComplaintInput=z.infer<typeof complaintInput>;
export type CustomerComplaint={id:string;storeId:string;storeName:string;body:string;status:string;createdAt:string;replies:{id:string;note:string;createdAt:string}[]};
export function validateComplaint(value:unknown){return complaintInput.safeParse(value)}
// The key is scoped to this exact payload and retained after uncertain network failures.
export function complaintRequest(previous:{requestId:string;storeId:string;body:string}|null,storeId:string,body:string){const clean=body.trim();return previous?.storeId===storeId&&previous.body===clean?previous:{requestId:crypto.randomUUID(),storeId,body:clean}}
