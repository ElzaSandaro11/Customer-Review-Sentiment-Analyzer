import { Controller, Post, Get, Body, HttpCode, HttpStatus, Headers, HttpException, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AnalyzeReviewDto } from './dto/analyze-review.dto';

@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() dto: AnalyzeReviewDto, @Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new HttpException('x-tenant-id header is required', HttpStatus.BAD_REQUEST);
    return this.reviewsService.analyzeReview(dto.text, tenantId, dto.guardrails);
  }
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findAll(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new HttpException('x-tenant-id header is required', HttpStatus.BAD_REQUEST);
    return this.reviewsService.getReviews(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new HttpException('x-tenant-id header is required', HttpStatus.BAD_REQUEST);
    return this.reviewsService.getReview(id, tenantId);
  }
}
