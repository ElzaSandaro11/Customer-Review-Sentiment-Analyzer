export type GuardrailVerdict = 'PASS' | 'WARN' | 'BLOCK';

export interface GuardrailResult {
  score: number; // 0.0 to 1.0
  verdict: GuardrailVerdict;
  reason?: string;
  time_taken_ms?: number;
}

export interface ValidateResponse {
  request_id: string;
  status: 'completed' | 'failed';
  results?: Record<string, GuardrailResult>;
  errors?: Record<string, string>;
  time_taken_ms: number;
}

export interface GuardrailConfig {
  toxicity?: boolean;
  pii?: boolean;
  prompt_injection?: boolean;
}
