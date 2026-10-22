import { FunctionsHttpError } from '@supabase/supabase-js';

/** Preserve the application error returned with a non-success HTTP response. */
export async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.clone().json();
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' && body.error.trim()) {
        return body.error;
      }
    } catch {
      // Gateway errors may not contain a JSON application response.
    }
    return fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}