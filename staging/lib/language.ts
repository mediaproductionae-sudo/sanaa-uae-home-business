import 'server-only';
import {cookies} from 'next/headers';
import {translate} from '../../lib/i18n/translate';
import type {Language} from '../../lib/i18n/content';
export async function serverLanguage(){const value=(await cookies()).get('sanaa-language')?.value;const language:Language=value==='en'?'en':'ar';return {language,t:(value:unknown)=>translate(value,language),locale:language==='en'?'en-AE':'ar-AE'}}
