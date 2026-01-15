import { Module } from '@nestjs/common';
import { AnalyzeController, ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { GuardrailsModule } from '../guardrails/guardrails.module';

@Module({
  imports: [GuardrailsModule],
  controllers: [AnalyzeController, ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
