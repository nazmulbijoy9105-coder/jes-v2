import '@testing-library/jest-dom';
import { vi } from 'vitest';

process.env.GROQ_API_KEY = 'test-groq-key';
process.env.HF_API_TOKEN = 'test-hf-token';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          insert: () => Promise.resolve({ error: null }),
          update: () => Promise.resolve({ error: null })
        })
      })
    })
  })
}));