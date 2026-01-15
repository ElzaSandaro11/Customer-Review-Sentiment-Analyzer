import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { GuardrailConfig, GuardrailResult, GuardrailVerdict, ValidateResponse } from './guardrails.types';

@Injectable()
export class GuardrailsService {
  // Thresholds
  private readonly BLOCK_THRESHOLD = 0.95;
  private readonly WARN_THRESHOLD = 0.80;

  // Simple dictionary for toxicity (demo purpose)
  private readonly TOXIC_WORDS = ['stupid', 'idiot', 'hate', 'kill', 'ugly'];

  // Keywords for prompt injection
  private readonly INJECTION_KEYWORDS = [
    'ignore previous instructions',
    'system prompt',
    'reveal secrets',
    'forget everything',
  ];

  async validate(text: string, config: GuardrailConfig): Promise<ValidateResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();
    const results: Record<string, GuardrailResult> = {};
    const errors: Record<string, string> = {};

    try {
      if (config.toxicity) {
        try {
          results['toxicity'] = await this.checkToxicity(text);
        } catch (e) {
          errors['toxicity'] = e instanceof Error ? e.message : 'Unknown error';
        }
      }

      if (config.pii) {
        try {
          results['pii'] = await this.checkPII(text);
        } catch (e) {
          errors['pii'] = e instanceof Error ? e.message : 'Unknown error';
        }
      }

      if (config.prompt_injection) {
        try {
          results['prompt_injection'] = await this.checkPromptInjection(text);
        } catch (e) {
          errors['prompt_injection'] = e instanceof Error ? e.message : 'Unknown error';
        }
      }

      const totalTime = Date.now() - startTime;

      return {
        request_id: requestId,
        status: Object.keys(errors).length === 0 ? 'completed' : 'failed', // Simplified status logic
        results,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        time_taken_ms: totalTime,
      };
    } catch (e) {
        // Catastrophic failure
        return {
            request_id: requestId,
            status: 'failed',
            time_taken_ms: Date.now() - startTime,
            errors: {
                "_": e instanceof Error ? e.message : 'Unknown fatal error'
            }
        }
    }
  }

  private async checkToxicity(text: string): Promise<GuardrailResult> {
    const lowerText = text.toLowerCase();
    let matchCount = 0;
    const foundWords: string[] = [];

    this.TOXIC_WORDS.forEach((word) => {
      if (lowerText.includes(word)) {
        matchCount++;
        foundWords.push(word);
      }
    });

    // Simple scoring logic
    let score = 0.0;
    if (matchCount > 0) {
        // Base score 0.4, adds 0.2 per extra word, capped at 0.99
        score = Math.min(0.99, 0.4 + (matchCount - 1) * 0.2); 
    }
    
    // If explicit match found, ensure at least WARN level if logic above didn't catch it enough
    if(matchCount > 0 && score < 0.8) score = 0.8; 
    // If very toxic (multiple words), ensure BLOCK
    if (matchCount >= 3) score = 0.99;


    return this.createResult(score, matchCount > 0 ? `Found toxic words: ${foundWords.join(', ')}` : undefined);
  }

  private async checkPII(text: string): Promise<GuardrailResult> {
    // Regex for Email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    // Simple Regex for Phone (US-ish)
    const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

    const hasEmail = emailRegex.test(text);
    const hasPhone = phoneRegex.test(text);

    if (hasEmail || hasPhone) {
      const detected = [];
      if (hasEmail) detected.push('Email');
      if (hasPhone) detected.push('Phone Number');
      return this.createResult(0.99, `Detected PII: ${detected.join(', ')}`);
    }

    return this.createResult(0.0);
  }

  private async checkPromptInjection(text: string): Promise<GuardrailResult> {
    const lowerText = text.toLowerCase();
    for (const phrase of this.INJECTION_KEYWORDS) {
      if (lowerText.includes(phrase)) {
        return this.createResult(0.99, `Detected injection keyword: "${phrase}"`);
      }
    }
    return this.createResult(0.0);
  }

  private createResult(score: number, reason?: string): GuardrailResult {
    let verdict: GuardrailVerdict = 'PASS';
    if (score >= this.BLOCK_THRESHOLD) {
      verdict = 'BLOCK';
    } else if (score >= this.WARN_THRESHOLD) {
      verdict = 'WARN';
    }

    return {
      score,
      verdict,
      reason,
    };
  }
}
