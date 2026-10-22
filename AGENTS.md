# Architecture rules

- Resolve failed Edge Function responses through `src/lib/function-error.ts` in user-management actions so application errors are preserved instead of displaying generic HTTP errors.