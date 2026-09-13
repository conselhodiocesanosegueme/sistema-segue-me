export function isDemoMode() {
  return process.env.DEMO_MODE === 'true' && !process.env.VERCEL && process.env.ALLOW_LOCAL_PREVIEW !== 'false';
}
export function isConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export function appOrigin() {
  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) {
    return new URL(process.env.APP_URL).origin;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://www.sistemasegueme.com.br';
}
