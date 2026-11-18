import type {NextConfig} from 'next';
import path from 'node:path';
const config:NextConfig={output:'standalone',trailingSlash:true,outputFileTracingRoot:path.resolve(__dirname,'..'),images:{unoptimized:true},poweredByHeader:false,async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}]}};
export default config;
