import { createFileRoute } from '@tanstack/react-router';
import DemoPage from '@/sanaa/components/demo-page';
import { deliveryHead } from '@/delivery/queries';
export const Route = createFileRoute('/auth')({ head:()=>deliveryHead('Sign in / تسجيل الدخول'), component:()=> <DemoPage route="login"/> });
