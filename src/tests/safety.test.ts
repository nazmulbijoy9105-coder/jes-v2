import { describe, it, expect } from 'vitest';
import { SafetyScanner } from '@/lib/safety/scanner';

describe('SafetyScanner', () => {
  it('should escalate arrest queries', () => {
    const check = SafetyScanner.scan('I was arrested last night');
    expect(check.severity).toBe('critical');
    expect(check.action).toBe('escalate');
  });

  it('should escalate domestic violence', () => {
    const check = SafetyScanner.scan('My husband beats me');
    expect(check.severity).toBe('critical');
  });

  it('should block dangerous advice', () => {
    const check = SafetyScanner.postScan('Destroy all evidence before police come');
    expect(check.isSafe).toBe(false);
    expect(check.action).toBe('block');
  });
});