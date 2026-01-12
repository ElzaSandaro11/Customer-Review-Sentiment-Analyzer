import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzeController, ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('Reviews Controllers', () => {
  let analyzeController: AnalyzeController;
  let reviewsController: ReviewsController;
  let service: ReviewsService;

  const mockService = {
    analyzeReview: jest.fn(),
    getReviews: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyzeController, ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockService,
        },
      ],
    }).compile();

    analyzeController = module.get<AnalyzeController>(AnalyzeController);
    reviewsController = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('AnalyzeController', () => {
    it('should call service.analyzeReview', async () => {
      const dto = { text: 'Test review' };
      const expectedResult = { id: '1', ...dto, sentiment: 'NEUTRAL' };
      
      mockService.analyzeReview.mockResolvedValue(expectedResult);

      const result = await analyzeController.analyze(dto);

      expect(result).toBe(expectedResult);
      expect(service.analyzeReview).toHaveBeenCalledWith(dto.text);
    });
  });

  describe('ReviewsController', () => {
    it('should call service.getReviews', async () => {
      const expectedResult = [{ id: '1', text: 'Test' }];
      mockService.getReviews.mockResolvedValue(expectedResult);

      const result = await reviewsController.findAll();

      expect(result).toBe(expectedResult);
      expect(service.getReviews).toHaveBeenCalled();
    });
  });
});
