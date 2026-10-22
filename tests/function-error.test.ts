import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getFunctionErrorMessage } from '../src/lib/function-error';

describe('getFunctionErrorMessage', () => {
  it('preserves the application response for non-success HTTP errors', async () => {
    const message = crypto.randomUUID();
    const response = new Response(JSON.stringify({ error: message }), { status: 400 });
    assert.equal(await getFunctionErrorMessage(new FunctionsHttpError(response), 'fallback'), message);
    assert.equal(response.bodyUsed, false);
  });

  it('uses the fallback for non-JSON gateway failures', async () => {
    const error = new FunctionsHttpError(new Response('gateway failure', { status: 502 }));
    assert.equal(await getFunctionErrorMessage(error, 'fallback'), 'fallback');
  });

  it('handles errors without an application error field', async () => {
    const error = new FunctionsHttpError(new Response(JSON.stringify({ error: null }), { status: 500 }));
    assert.equal(await getFunctionErrorMessage(error, 'fallback'), 'fallback');
  });

  it('retains ordinary error details and safely handles unknown failures', async () => {
    assert.equal(await getFunctionErrorMessage(new Error('validation'), 'fallback'), 'validation');
    assert.equal(await getFunctionErrorMessage(null, 'fallback'), 'fallback');
  });
});