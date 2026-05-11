import { SafetyCheck, SafetySeverity, QueryContext } from '@/lib/types';

const CRITICAL_KEYWORDS = [
  'arrest', 'detention', 'remand', 'custody', 'bail', 'warrant',
  'domestic violence', 'assault', 'rape', 'sexual harassment',
  'child marriage', 'forced marriage', 'trafficking',
  'eviction', 'forcible eviction', 'land grabbing', 'extortion',
  'murder', 'manslaughter', 'attempted murder',
  'suicide', 'self-harm', 'kill myself',
  'police brutality', 'custodial torture',
  'acid attack', 'dowry death', 'dowry harassment',
  'terrorism', 'sedition', 'treason'
];

const HIGH_KEYWORDS = [
  'divorce', 'talaq', 'child custody', 'maintenance', 'alimony',
  'property dispute', 'land dispute', 'boundary dispute',
  'wrongful termination', 'unfair dismissal', 'harassment at work',
  'fraud', 'cheating', 'embezzlement', 'forgery',
  'defamation', 'libel', 'slander',
  'bankruptcy', 'insolvency', 'liquidation',
  'contempt of court', 'perjury'
];

const MEDIUM_KEYWORDS = [
  'contract breach', 'breach of agreement',
  'consumer rights', 'consumer protection',
  'intellectual property', 'copyright', 'trademark',
  'rent', 'lease', 'tenancy',
  'inheritance', 'will', 'probate',
  'passport', 'visa', 'immigration',
  'tax evasion', 'tax fraud'
];

export class SafetyScanner {
  static scan(query: string, context?: QueryContext): SafetyCheck {
    const lowerQuery = query.toLowerCase();
    const criticalHits = CRITICAL_KEYWORDS.filter(kw => lowerQuery.includes(kw));
    const highHits = HIGH_KEYWORDS.filter(kw => lowerQuery.includes(kw));
    const mediumHits = MEDIUM_KEYWORDS.filter(kw => lowerQuery.includes(kw));

    if (criticalHits.length > 0) {
      return {
        isSafe: false,
        severity: 'critical',
        detectedKeywords: criticalHits,
        action: 'escalate',
        message: `⚠️ URGENT: Your query involves "${criticalHits.slice(0, 3).join(', ')}" — a matter requiring immediate professional legal assistance.\n\n📞 Contact Bangladesh Bar Council: 02-9565700\n🆘 National Legal Aid: 16430 (toll-free)\n🏛️ District Legal Aid Office: Visit your local courthouse\n⚖️ This AI can provide general information only — you MUST consult a qualified advocate within 24 hours.`,
        requiresHumanReview: true
      };
    }

    if (highHits.length > 0) {
      return {
        isSafe: true,
        severity: 'high',
        detectedKeywords: highHits,
        action: 'warn',
        message: `⚠️ IMPORTANT: Your query about "${highHits.slice(0, 3).join(', ')}" involves significant legal rights and obligations.\n\n💡 Consider consulting a qualified advocate for personalized advice.\n📋 Document everything: dates, communications, evidence.`,
        requiresHumanReview: false
      };
    }

    if (mediumHits.length > 0) {
      return {
        isSafe: true,
        severity: 'medium',
        detectedKeywords: mediumHits,
        action: 'allow',
        requiresHumanReview: false
      };
    }

    return {
      isSafe: true,
      severity: 'low',
      detectedKeywords: [],
      action: 'allow',
      requiresHumanReview: false
    };
  }

  static postScan(response: string, context?: QueryContext): SafetyCheck {
    const dangerousPatterns = [
      /ignore\s+(?:the\s+)?court\s+order/i,
      /do\s+not\s+appear\s+in\s+court/i,
      /flee\s+(?:the\s+)?country/i,
      /hide\s+(?:from\s+)?(?:police|authorities)/i,
      /destroy\s+(?:the\s+)?evidence/i,
      /bribe\s+(?:the\s+)?(?:judge|magistrate|police)/i,
      /make\s+false\s+(?:statement|complaint|accusation)/i
    ];

    const detected = dangerousPatterns.filter(p => p.test(response));

    if (detected.length > 0) {
      return {
        isSafe: false,
        severity: 'critical',
        detectedKeywords: ['dangerous_advice'],
        action: 'block',
        message: 'This response has been blocked as it may contain advice that could violate the law or endanger the user. Please consult a qualified advocate immediately.',
        requiresHumanReview: true
      };
    }

    return {
      isSafe: true,
      severity: 'low',
      detectedKeywords: [],
      action: 'allow',
      requiresHumanReview: false
    };
  }

  static async logIncident(query: string, check: SafetyCheck, userId?: string): Promise<void> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    await supabase.from('safety_incidents').insert({
      user_id: userId,
      query_text: query,
      detected_keywords: check.detectedKeywords,
      severity: check.severity,
      action_taken: check.action
    });
  }
}