import Groq from 'groq-sdk';
import { LLMResponse, QueryContext, RetrievedChunk, Citation, SafetyCheck } from '@/lib/types';
import { SafetyScanner } from '@/lib/safety/scanner';

const GROQ_MODEL_PRIMARY = 'llama-3.1-70b-versatile';
const GROQ_MODEL_FALLBACK = 'mixtral-8x7b-32768';
const GROQ_MODEL_TERTIARY = 'gemma2-9b-it';

export class LLMOrchestrator {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async generateResponse(
    query: string,
    retrievedChunks: RetrievedChunk[],
    context: QueryContext,
    safetyCheck: SafetyCheck
  ): Promise<LLMResponse> {
    const systemPrompt = this.buildSystemPrompt(retrievedChunks, context, safetyCheck);
    const models = [
      { name: 'llama-3.1-70b', model: GROQ_MODEL_PRIMARY },
      { name: 'mixtral-8x7b', model: GROQ_MODEL_FALLBACK },
      { name: 'gemma2-9b', model: GROQ_MODEL_TERTIARY }
    ];

    let lastError: Error | null = null;
    for (const { name, model } of models) {
      try {
        const response = await this.groq.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.2,
          max_tokens: 4096,
          top_p: 0.9
        });

        const content = response.choices[0].message.content || '';
        const postSafety = SafetyScanner.postScan(content, context);

        if (!postSafety.isSafe) {
          return {
            content: postSafety.message || 'Response blocked for safety.',
            citations: [],
            confidence: 'none',
            safetyFlags: [postSafety],
            modelUsed: name,
            tokensUsed: response.usage?.completion_tokens || 0
          };
        }

        const citations = this.extractCitations(content, retrievedChunks);
        return {
          content,
          citations,
          confidence: 'high',
          safetyFlags: [safetyCheck, postSafety],
          modelUsed: name,
          tokensUsed: response.usage?.completion_tokens || 0
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`${name} failed:`, error);
        continue;
      }
    }

    throw new Error(`All Groq models failed. Last error: ${lastError?.message}`);
  }

  private buildSystemPrompt(chunks: RetrievedChunk[], context: QueryContext, safetyCheck: SafetyCheck): string {
    const chunkContext = chunks.map((c, i) => `
[DOCUMENT ${i + 1}]
Area: ${c.area}${c.subArea ? ` / ${c.subArea}` : ''}
${c.religion && c.religion !== 'general' ? `Religion: ${c.religion}` : ''}
Question: ${c.question}
Answer: ${c.answer}
Legal Basis: ${c.legalBasis}
${c.procedure ? `Procedure: ${c.procedure}` : ''}
Act: ${c.actName || 'N/A'}
Sections: ${c.sectionNumbers?.join(', ') || 'N/A'}
Verified: ${c.lastVerified} by ${c.verifiedBy}`).join('\n');

    const religionContext = context.religion 
      ? `\nThe user has identified their religion/personal law as: ${context.religion.toUpperCase()}. You MUST apply ${context.religion}-specific personal law principles only.`
      : '';

    const safetyContext = safetyCheck.severity !== 'low'
      ? `\n⚠️ SAFETY FLAG: This query involves ${safetyCheck.severity}-severity keywords: ${safetyCheck.detectedKeywords.join(', ')}. Provide general information only. Strongly recommend consulting a qualified advocate.`
      : '';

    return `You are JesAI, a legal literacy assistant for Bangladesh law. Your purpose is to help citizens understand their legal rights and obligations — NOT to provide specific legal advice.

## CORE RULES (VIOLATING ANY IS A SYSTEM FAILURE)
1. NEVER invent statutes, case names, section numbers, penalties, or deadlines.
2. ONLY use the provided legal documents as your knowledge source.
3. If the documents don't answer the query, say "I don't have sufficient information about this specific matter."
4. ALWAYS cite the specific Act and section numbers from the documents.
5. For procedural questions, give GENERAL steps only — never specific form numbers, fees, or deadlines unless explicitly in the documents.
6. Use plain language. Define legal terms in parentheses.
7. Structure your response as: Situation → Relevant Law → General Rights/Steps → Important Caveats → Disclaimer.

## OUTPUT FORMAT (STRICT JSON)
{
  "situation_summary": "Brief restatement of user's situation",
  "relevant_laws": [
    {
      "act": "Act Name",
      "sections": ["Section X", "Section Y"],
      "brief": "What this law says in plain terms"
    }
  ],
  "general_guidance": "Step-by-step general approach (not specific advice)",
  "caveats": ["Important limitations or exceptions"],
  "recommended_next_steps": ["General actions to consider"],
  "disclaimer": "This is general legal literacy information, not legal advice. Consult a qualified advocate registered with the Bangladesh Bar Council for your specific situation.",
  "escalation_needed": true/false,
  "escalation_reason": "If true, why human lawyer needed"
}

## RETRIEVED LEGAL DOCUMENTS
${chunkContext}
${religionContext}
${safetyContext}

## LANGUAGE
Respond in ${context.language === 'bangla' ? 'Bangla (Bengali script)' : context.language === 'mixed' ? 'a mix of Bangla and English as appropriate' : 'English'}.`;
  }

  private extractCitations(content: string, chunks: RetrievedChunk[]): Citation[] {
    const citations: Citation[] = [];
    const actSectionPattern = /(?:Act|Law)[\s:]*([^,\n]+)[^\d]*(\d+(?:\s*\(\d+\))?)/gi;
    let match;
    while ((match = actSectionPattern.exec(content)) !== null) {
      const actName = match[1].trim();
      const section = match[2].trim();
      const verified = chunks.some(c => 
        c.actName?.toLowerCase().includes(actName.toLowerCase()) &&
        c.sectionNumbers?.some(s => s.includes(section))
      );
      citations.push({ actName, section, isVerified: verified });
    }
    return citations;
  }
}