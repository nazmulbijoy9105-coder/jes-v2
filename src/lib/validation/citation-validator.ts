import { CitationValidation, RetrievedChunk, Citation } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export class CitationValidator {
  async validate(citations: Citation[], retrievedChunks: RetrievedChunk[]): Promise<CitationValidation[]> {
    const validations: CitationValidation[] = [];
    for (const citation of citations) {
      const validation: CitationValidation = {
        isValid: false,
        citedAct: citation.actName,
        citedSections: citation.section ? [citation.section] : [],
        errors: [],
        suggestions: []
      };

      const actExists = retrievedChunks.some(c => 
        c.actName?.toLowerCase().includes(citation.actName.toLowerCase()) ||
        citation.actName.toLowerCase().includes(c.actName?.toLowerCase() || '')
      );

      if (!actExists) {
        validation.errors.push(`Act "${citation.actName}" not found in retrieved documents`);
        const similarActs = retrievedChunks.map(c => c.actName).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
        if (similarActs.length > 0) validation.suggestions.push(`Did you mean: ${similarActs.join(', ')}?`);
      }

      if (citation.section) {
        const sectionExists = retrievedChunks.some(c => 
          c.actName?.toLowerCase().includes(citation.actName.toLowerCase()) &&
          c.sectionNumbers?.some(s => s.includes(citation.section) || citation.section.includes(s))
        );
        if (!sectionExists) {
          validation.errors.push(`Section "${citation.section}" not found in retrieved documents for ${citation.actName}`);
          const availableSections = retrievedChunks
            .filter(c => c.actName?.toLowerCase().includes(citation.actName.toLowerCase()))
            .flatMap(c => c.sectionNumbers || [])
            .filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
          if (availableSections.length > 0) validation.suggestions.push(`Available sections: ${availableSections.join(', ')}`);
        }
      }

      validation.isValid = validation.errors.length === 0;
      validations.push(validation);
    }
    return validations;
  }
}

interface CitationValidation {
  isValid: boolean;
  citedAct?: string;
  citedSections: string[];
  errors: string[];
  suggestions: string[];
}