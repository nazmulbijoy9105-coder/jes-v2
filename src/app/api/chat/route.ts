import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { HybridRetrievalEngine } from '@/lib/retrieval/hybrid-engine';
import { LLMOrchestrator } from '@/lib/llm/orchestrator';
import { SafetyScanner } from '@/lib/safety/scanner';
import { CitationValidator } from '@/lib/validation/citation-validator';
import { QueryContext, LawArea, Religion, ProcessedResponse } from '@/lib/types';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
  area: z.enum(['constitutional', 'criminal', 'property', 'family', 'labour', 'company', 'tax', 'contract', 'nrb', 'general']).optional(),
  religion: z.enum(['muslim', 'hindu', 'christian', 'adibashi', 'general']).optional(),
  language: z.enum(['english', 'bangla', 'mixed']).default('english'),
  isPaid: z.boolean().default(false)
});

// Simple rate limiting using Supabase
async function checkRateLimit(userId: string, supabase: any): Promise<{ allowed: boolean; remaining: number }> {
  const { data: profile } = await supabase.from('user_profiles').select('queries_today, last_query_date').eq('id', userId).single();
  const today = new Date().toISOString().split('T')[0];
  const queriesToday = profile?.last_query_date === today ? profile?.queries_today || 0 : 0;
  const limit = profile?.is_paid ? 1000 : 20;

  if (queriesToday >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase.from('user_profiles').upsert({
    id: userId,
    queries_today: queriesToday + 1,
    last_query_date: today
  }, { onConflict: 'id' });

  return { allowed: true, remaining: limit - queriesToday - 1 };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { allowed, remaining } = await checkRateLimit(user.id, supabase);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded (20/day free). Upgrade for unlimited.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });

    const { message, conversationId, area, religion, language, isPaid } = parsed.data;
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();

    const context: QueryContext = {
      userId: user.id,
      userProfile: profile || undefined,
      area: area as LawArea || undefined,
      religion: (religion as Religion) || profile?.religion || undefined,
      language: language as any,
      isPaid: isPaid || profile?.is_paid || false,
      queryCount: profile?.queries_today || 0,
      conversationId
    };

    // 1. SAFETY SCAN (Pre-filter)
    const safetyCheck = SafetyScanner.scan(message, context);
    if (safetyCheck.severity !== 'low') await SafetyScanner.logIncident(message, safetyCheck, user.id);

    if (safetyCheck.action === 'block') {
      return NextResponse.json({
        response: { content: safetyCheck.message, isSafe: false, safetyChecks: [safetyCheck], citations: [], confidence: 'none', requiresEscalation: true, escalationMessage: safetyCheck.message },
        metadata: { processingTime: Date.now() - startTime, modelUsed: 'none', retrievalConfidence: 'none', remaining }
      });
    }

    // 2. RELIGION CHECK for Family Law
    if (area === 'family' && !context.religion) {
      return NextResponse.json({
        response: { content: '', isSafe: true, safetyChecks: [safetyCheck], citations: [], confidence: 'none', requiresEscalation: false, requiresReligion: true, religionPrompt: 'To provide accurate family law guidance, please specify your religion/personal law system: Muslim, Hindu, Christian, or Adibashi (Indigenous). Bangladesh operates parallel personal law systems, and the rules for marriage, divorce, inheritance, and custody differ significantly.' },
        metadata: { processingTime: Date.now() - startTime, modelUsed: 'none', retrievalConfidence: 'none', remaining }
      });
    }

    // 3. HYBRID RETRIEVAL (Semantic Search)
    const retrievalEngine = new HybridRetrievalEngine();
    const retrievalResult = await retrievalEngine.retrieve(message, context);

    // 4. CONFIDENCE THRESHOLD
    if (retrievalResult.confidence === 'none' || retrievalResult.fallbackNeeded) {
      return NextResponse.json({
        response: { content: "I don't have specific information about this matter in my current knowledge base.\n\nThis could mean: \n1. The law on this topic is very new or recently changed \n2. This requires specialized legal expertise beyond general guidance \n3. The query may need more specific details \n\n📞 I recommend consulting a qualified advocate for personalized advice on this matter.", isSafe: true, safetyChecks: [safetyCheck], citations: [], confidence: 'none', requiresEscalation: true, escalationMessage: 'Low confidence match - recommend human consultation' },
        metadata: { processingTime: Date.now() - startTime, modelUsed: 'none', retrievalConfidence: retrievalResult.confidence, remaining }
      });
    }

    // 5. LLM GENERATION (Groq)
    const llmOrchestrator = new LLMOrchestrator();
    const llmResponse = await llmOrchestrator.generateResponse(message, retrievalResult.chunks, context, safetyCheck);

    // 6. CITATION VALIDATION
    const citationValidator = new CitationValidator();
    const validatedCitations = await citationValidator.validate(llmResponse.citations, retrievalResult.chunks);
    const postSafety = SafetyScanner.postScan(llmResponse.content, context);

    const processedResponse: ProcessedResponse = {
      content: llmResponse.content,
      isSafe: postSafety.isSafe && safetyCheck.isSafe,
      safetyChecks: [safetyCheck, postSafety],
      citations: validatedCitations.filter(c => c.isValid).map(c => ({ actName: c.citedAct || '', section: c.citedSections[0] || '', isVerified: true })),
      confidence: retrievalResult.confidence,
      requiresEscalation: safetyCheck.action === 'escalate' || retrievalResult.confidence === 'low',
      escalationMessage: safetyCheck.message
    };

    // 7. SAVE CONVERSATION
    await supabase.from('conversations').insert({
      user_id: user.id,
      area: area || retrievalResult.chunks[0]?.area,
      religion: context.religion,
      messages: [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: processedResponse.content, timestamp: new Date().toISOString(), metadata: { area, confidence: processedResponse.confidence, citations: processedResponse.citations, safetyFlags: processedResponse.safetyChecks } }
      ],
      retrieved_chunks: retrievalResult.chunks.map(c => c.id),
      retrieval_confidence: retrievalResult.confidence === 'high' ? 0.9 : retrievalResult.confidence === 'medium' ? 0.7 : 0.5,
      llm_used: llmResponse.modelUsed,
      safety_flags: processedResponse.safetyChecks,
      query_count: (profile?.queries_today || 0) + 1,
      is_paid: isPaid
    });

    return NextResponse.json({
      response: processedResponse,
      metadata: {
        processingTime: Date.now() - startTime,
        modelUsed: llmResponse.modelUsed,
        retrievalConfidence: retrievalResult.confidence,
        tokensUsed: llmResponse.tokensUsed,
        citationsVerified: validatedCitations.filter(c => c.isValid).length,
        totalCitations: validatedCitations.length,
        safetySeverity: safetyCheck.severity,
        remaining
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}