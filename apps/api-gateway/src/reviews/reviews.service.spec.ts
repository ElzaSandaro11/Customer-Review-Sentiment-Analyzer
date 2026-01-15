import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { HttpException } from '@nestjs/common';
import { GuardrailsService } from '../guardrails/guardrails.service';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('@aig/database', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      review: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    })),
  };
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaMock: any;
  let module: TestingModule;
  let guardrailsService: GuardrailsService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: GuardrailsService,
          useValue: { validate: jest.fn() },
        }
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    guardrailsService = module.get<GuardrailsService>(GuardrailsService);
    // Access the private prisma instance (cast to any for testing)
    prismaMock = (service as any).prisma;
  });

  describe('analyzeReview', () => {
    it('should successfully analyze and save a review', async () => {
      const text = 'Great food';
      const aiResponse = {
        data: {
          sentiment: 'POSITIVE',
          confidence: 0.9,
          scores: { positive: 0.9, negative: 0.1, neutral: 0.0 },
        },
      };
      
      const savedReview = {
        id: '1',
        text,
        sentiment: 'POSITIVE',
        confidence: 0.9,
        scores: JSON.stringify(aiResponse.data.scores),
        createdAt: new Date(),
      };

      (axios.post as jest.Mock).mockResolvedValue(aiResponse);
      prismaMock.review.create.mockResolvedValue(savedReview);

      (guardrailsService.validate as jest.Mock).mockResolvedValue({ results: {} });
      const result = await service.analyzeReview(text, 't1');

      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/analyze', { text });
      expect(prismaMock.review.create).toHaveBeenCalled();
      expect(result.sentiment).toBe('POSITIVE');
      // Ensure scores are parsed back to object
      expect(result.scores).toEqual(aiResponse.data.scores);
    });

    it('should throw HTTP exception if AI service fails', async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error('AI Service Down'));

      (guardrailsService.validate as jest.Mock).mockResolvedValue({ results: {} });
      await expect(service.analyzeReview('test', 't1')).rejects.toThrow(HttpException);
    });
  });

  describe('getReviews', () => {
    it('should return all reviews with parsed scores', async () => {
      const dbReviews = [
        {
          id: '1',
          text: 'Good',
          scores: '{"positive": 1}',
        },
      ];

      prismaMock.review.findMany.mockResolvedValue(dbReviews);

      const result = await service.getReviews('t1');

      expect(result[0].scores).toEqual({ positive: 1 });
      expect(prismaMock.review.findMany).toHaveBeenCalledWith({ 
        where: { tenantId: 't1' },
        orderBy: { createdAt: 'desc' },
        include: { guardrailCheck: true }
      });
    });
  });
});
