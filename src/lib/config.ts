export function isDemoMode() {
  return process.env.DEMO_MODE === 'true' && !process.env.VERCEL && process.env.ALLOW_LOCAL_PREVIEW !== 'false';
}
export function isConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export function appOrigin() {
  return new URL(process.env.APP_URL || 'http://localhost:3000').origin;
}
