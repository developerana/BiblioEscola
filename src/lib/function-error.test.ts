import { describe, expect, it } from 'bun:test';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getFunctionErrorMessage } from './function-error';

describe('getFunctionErrorMessage', () => {
  it('preserves the application response for non-success HTTP errors', async () => {
    const message = crypto.randomUUID();
    const response = new Response(JSON.stringify({ error: message }), { status: 400 });
    expect(await getFunctionErrorMessage(new FunctionsHttpError(response), 'fallback')).toBe(message);
    expect(response.bodyUsed).toBe(false);
  });

  it('uses the fallback for non-JSON gateway failures', async () => {
    const error = new FunctionsHttpError(new Response('gateway failure', { status: 502 }));
    expect(await getFunctionErrorMessage(error, 'fallback')).toBe('fallback');
  });

  it('handles errors without an application error field', async () => {
    const error = new FunctionsHttpError(new Response(JSON.stringify({ error: null }), { status: 500 }));
    expect(await getFunctionErrorMessage(error, 'fallback')).toBe('fallback');
  });

  it('retains ordinary error details and safely handles unknown failures', async () => {
    expect(await getFunctionErrorMessage(new Error('validation'), 'fallback')).toBe('validation');
    expect(await getFunctionErrorMessage(null, 'fallback')).toBe('fallback');
  });
});