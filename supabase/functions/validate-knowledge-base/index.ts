import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { data: chunks, error } = await supabase.from('knowledge_chunks').select('*').eq('is_active', true);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const flagged = [];
  for (const chunk of chunks || []) {
    const { data: exists } = await supabase.from('knowledge_chunks').select('id').ilike('act_name', `%${chunk.act_name}%`).limit(1);
    if (!exists || exists.length === 0) {
      await supabase.from('knowledge_versions').insert({
        chunk_id: chunk.id,
        version: chunk.version,
        content: chunk,
        changed_by: 'system',
        change_reason: 'Automated validation failed'
      });
      flagged.push(chunk.id);
    }
  }

  return new Response(JSON.stringify({ validated: chunks?.length || 0, flagged: flagged.length }), { status: 200 });
});