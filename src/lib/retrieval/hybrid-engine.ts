import { createClient } from '@/lib/supabase/server';
import { RetrievedChunk, RetrievalResult, QueryContext, ConfidenceLevel } from '@/lib/types';
import { HfInference } from '@huggingface/inference';

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const VECTOR_MATCH_COUNT = 10;
const KEYWORD_MATCH_COUNT = 10;
const FINAL_TOP_K = 5;
const MIN_CONFIDENCE_THRESHOLD = 0.65;

export class HybridRetrievalEngine {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference(process.env.HF_API_TOKEN);
  }

  async retrieve(query: string, context: QueryContext): Promise<RetrievalResult> {
    const queryEmbedding = await this.generateEmbedding(query);
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(queryEmbedding, context),
      this.keywordSearch(query, context)
    ]);

    const fused = this.reciprocalRankFusion(vectorResults, keywordResults);
    const filtered = fused.filter(r => r.similarity >= MIN_CONFIDENCE_THRESHOLD);
    const confidence = this.calculateConfidence(filtered);

    return {
      chunks: filtered.slice(0, FINAL_TOP_K),
      confidence,
      fallbackNeeded: filtered.length === 0 || confidence === 'none'
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.hf.featureExtraction({
        model: HF_MODEL,
        inputs: text
      });
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Embedding error:', error);
      return [];
    }
  }

  private async vectorSearch(embedding: number[], context: QueryContext): Promise<RetrievedChunk[]> {
    const supabase = createClient();
    let query = supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: VECTOR_MATCH_COUNT
    });
    if (context.area) query = query.eq('area', context.area);
    if (context.area === 'family' && context.religion) {
      query = query.or(`religion.eq.${context.religion},religion.eq.general`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((d: any, i: number) => ({ ...d, similarity: d.similarity, rank: i + 1 }));
  }

  private async keywordSearch(query: string, context: QueryContext): Promise<RetrievedChunk[]> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('keyword_search_chunks', {
      search_query: query,
      search_area: context.area || null,
      search_religion: context.area === 'family' ? context.religion : null,
      match_count: KEYWORD_MATCH_COUNT
    });
    if (error) throw error;
    return (data || []).map((d: any, i: number) => ({ ...d, similarity: d.keyword_score, rank: i + 1 }));
  }

  private reciprocalRankFusion(vectorResults: RetrievedChunk[], keywordResults: RetrievedChunk[]): RetrievedChunk[] {
    const k = 60;
    const scores = new Map<string, number>();
    const chunks = new Map<string, RetrievedChunk>();

    vectorResults.forEach((chunk, i) => {
      scores.set(chunk.id, (scores.get(chunk.id) || 0) + 1 / (k + i + 1));
      chunks.set(chunk.id, chunk);
    });

    keywordResults.forEach((chunk, i) => {
      scores.set(chunk.id, (scores.get(chunk.id) || 0) + 1 / (k + i + 1));
      chunks.set(chunk.id, { ...chunk, ...chunks.get(chunk.id) });
    });

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({ ...chunks.get(id)!, similarity: score }));
  }

  private calculateConfidence(chunks: RetrievedChunk[]): ConfidenceLevel {
    if (chunks.length === 0) return 'none';
    const avgSimilarity = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
    const topScore = chunks[0]?.similarity || 0;
    if (topScore >= 0.85 && avgSimilarity >= 0.75) return 'high';
    if (topScore >= 0.70 && avgSimilarity >= 0.60) return 'medium';
    if (topScore >= 0.50) return 'low';
    return 'none';
  }
}