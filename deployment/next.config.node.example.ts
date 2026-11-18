// 4B staging template only. Not imported by the current static deployment.
// Replace the root next.config.ts only after a Node host has been selected.
import type {NextConfig} from 'next';
const config:NextConfig={output:'standalone',trailingSlash:true,images:{unoptimized:true}};
export default config;
