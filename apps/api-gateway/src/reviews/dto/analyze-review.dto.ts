import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnalyzeReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text!: string;
}
