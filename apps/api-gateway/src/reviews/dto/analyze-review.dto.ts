import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { GuardrailConfig } from '../../guardrails/guardrails.types';

export class AnalyzeReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text!: string;

  @IsOptional()
  guardrails?: GuardrailConfig;
}
