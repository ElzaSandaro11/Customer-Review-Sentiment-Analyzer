import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { HttpException } from '@nestjs/common';
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

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewsService],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
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

      const result = await service.analyzeReview(text);

      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/analyze', { text });
      expect(prismaMock.review.create).toHaveBeenCalled();
      expect(result.sentiment).toBe('POSITIVE');
      // Ensure scores are parsed back to object
      expect(result.scores).toEqual(aiResponse.data.scores);
    });

    it('should throw HTTP exception if AI service fails', async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error('AI Service Down'));

      await expect(service.analyzeReview('test')).rejects.toThrow(HttpException);
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

      const result = await service.getReviews();

      expect(result[0].scores).toEqual({ positive: 1 });
      expect(prismaMock.review.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    });
  });
});
