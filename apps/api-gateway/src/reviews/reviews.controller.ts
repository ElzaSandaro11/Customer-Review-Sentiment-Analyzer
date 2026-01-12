import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AnalyzeReviewDto } from './dto/analyze-review.dto';

@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() dto: AnalyzeReviewDto) {
    return this.reviewsService.analyzeReview(dto.text);
  }
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findAll() {
    return this.reviewsService.getReviews();
  }
}
