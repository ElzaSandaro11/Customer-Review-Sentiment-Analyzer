import { Module } from '@nestjs/common';
import { AnalyzeController, ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [AnalyzeController, ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
