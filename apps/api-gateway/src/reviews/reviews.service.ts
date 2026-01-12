import { Injectable, OnModuleInit, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@aig/database';
import { logger } from '@aig/logger';
import axios from 'axios';

@Injectable()
export class ReviewsService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async analyzeReview(text: string) {
    try {
      // 1. Call AI Engine
      const aiResponse = await axios.post('http://localhost:8000/analyze', {
        text,
      });

      const { sentiment, confidence, scores } = aiResponse.data;

      // 2. Save to DB
      const review = await this.prisma.review.create({
        data: {
          text,
          sentiment,
          confidence,
          scores: JSON.stringify(scores),
        },
      });

      return {
        ...review,
        scores: scores, // Return parsed JSON
      };

    } catch (error) {
      logger.error('Error analyzing review', error);
      throw new HttpException(
        'Failed to analyze review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getReviews() {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse JSON scores
    return reviews.map((r: any) => ({
      ...r,
      scores: JSON.parse(r.scores),
    }));
  }
}
