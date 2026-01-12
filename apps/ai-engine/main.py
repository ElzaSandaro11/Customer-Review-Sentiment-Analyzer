from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random

app = FastAPI(title="Sentiment Analyzer", version="1.0.0")

class ReviewRequest(BaseModel):
    text: str

class SentimentScores(BaseModel):
    positive: float
    negative: float
    neutral: float

class SentimentResult(BaseModel):
    sentiment: str
    confidence: float
    scores: SentimentScores

@app.post("/analyze", response_model=SentimentResult)
def analyze_sentiment(request: ReviewRequest):
    text = request.text.lower()
    
    # Simple Keyword Heuristics
    positive_words = ["good", "great", "amazing", "excellent", "love", "fast", "best", "recommend"]
    negative_words = ["bad", "terrible", "slow", "rude", "poor", "hate", "worst", "avoid"]
    
    pos_score = 0.0
    neg_score = 0.0
    
    for word in positive_words:
        if word in text:
            pos_score += 0.2
    
    for word in negative_words:
        if word in text:
            neg_score += 0.2
            
    # Normalize with some noise
    total = pos_score + neg_score + 0.1 # avoid div by zero
    
    # Calculate Neutrality (if no strong keywords)
    neutral_score = 1.0 - min(1.0, pos_score + neg_score)
    
    # Determine Winner
    if pos_score > neg_score and pos_score > neutral_score:
        sentiment = "POSITIVE"
        confidence = min(0.99, 0.6 + pos_score)
    elif neg_score > pos_score and neg_score > neutral_score:
        sentiment = "NEGATIVE"
        confidence = min(0.99, 0.6 + neg_score)
    else:
        sentiment = "NEUTRAL"
        confidence = 0.6 + (random.random() * 0.2)
        
    return SentimentResult(
        sentiment=sentiment,
        confidence=round(confidence, 2),
        scores=SentimentScores(
            positive=round(min(0.99, pos_score + (random.random() * 0.1)), 2),
            negative=round(min(0.99, neg_score + (random.random() * 0.1)), 2),
            neutral=round(neutral_score, 2)
        )
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
