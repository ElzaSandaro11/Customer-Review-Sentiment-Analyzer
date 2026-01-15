import { Injectable, OnModuleInit, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@aig/database';
import { logger } from '@aig/logger';
import axios from 'axios';

import { GuardrailConfig } from '../guardrails/guardrails.types';
import { GuardrailsService } from '../guardrails/guardrails.service';

@Injectable()
export class ReviewsService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor(private readonly guardrailsService: GuardrailsService) {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async analyzeReview(text: string, tenantId: string, guardrailsConfig: GuardrailConfig = {}) {
    try {
      // 1. Run Guardrails (First, because if we want to block, we might want to know early, 
      // but requirements say persist everything, so we continue to sentiment usually,
      // but let's run them in parallel or sequence. Let's run guardrails first.)
      const guardrailResult = await this.guardrailsService.validate(text, guardrailsConfig);

      // Determine overall verdict
      let overallVerdict = 'PASS';
      
      // 1. Check successful results
      Object.values(guardrailResult.results || {}).forEach(r => {
        if (r.verdict === 'BLOCK') overallVerdict = 'BLOCK';
        else if (r.verdict === 'WARN' && overallVerdict !== 'BLOCK') overallVerdict = 'WARN';
      });

      // 2. Fail-safe: If any guardrail failed to run (partial error), default to WARN
      if (guardrailResult.errors && Object.keys(guardrailResult.errors).length > 0) {
          if (overallVerdict !== 'BLOCK') {
              overallVerdict = 'WARN';
          }
      }

      // 2. Call AI Engine
      const aiResponse = await axios.post('http://localhost:8000/analyze', {
        text,
      });

      const { sentiment, confidence, scores } = aiResponse.data;

      // 3. Save to DB (Transactionally ideally, but Prisma create with nested writes is fine)
      const review = await this.prisma.review.create({
        data: {
          tenantId,
          text,
          sentiment,
          confidence,
          scores: JSON.stringify(scores),
          guardrailCheck: {
            create: {
              overallVerdict,
              results: {
                create: Object.entries(guardrailResult.results || {}).map(([key, res]) => ({
                    guardrailKey: key,
                    score: res.score,
                    verdict: res.verdict,
                    reason: res.reason
                }))
              }
            }
          }
        },
        include: {
            guardrailCheck: {
                include: { results: true }
            }
        }
      });

      const response = {
        ...review,
        scores: scores, // Return parsed JSON
        guardrails: guardrailResult,
        overall_guardrail_verdict: overallVerdict
      };

      if (overallVerdict === 'BLOCK') {
          throw new HttpException(response, HttpStatus.UNPROCESSABLE_ENTITY); // 422
      }

      return response;

    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      logger.error('Error analyzing review', error);
      throw new HttpException(
        'Failed to analyze review',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getReviews(tenantId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { guardrailCheck: true }
    });
    
    // Parse JSON scores
    return reviews.map((r: any) => ({
      ...r,
      scores: JSON.parse(r.scores),
      overallVerdict: r.guardrailCheck?.overallVerdict || 'PASS'
    }));
  }

  async getReview(id: string, tenantId: string) {
      const review = await this.prisma.review.findUnique({
          where: { id },
          include: { 
              guardrailCheck: {
                  include: { results: true }
              }
          }
      });

      if (!review) throw new HttpException('Review not found', HttpStatus.NOT_FOUND);
      if (review.tenantId !== tenantId) throw new HttpException('Review not found', HttpStatus.NOT_FOUND); // 404 for isolation

      return {
          ...review,
          scores: JSON.parse(review.scores)
      };
  }
}
