#!/usr/bin/env python3
"""
FastAPI server for sentiment analysis using the fine-tuned BERTweet model.
This server runs the PyTorch model and provides a REST API for the Next.js app.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import uvicorn
from typing import List, Optional

# Global model and tokenizer
tokenizer = None
model = None
model_loaded = False

def load_model():
    """Load the model and tokenizer once at startup."""
    global tokenizer, model, model_loaded
    
    if model_loaded:
        return
    
    print("🤖 Loading Hugging Face model: rohan10juli/bertweet-finetuned-bitcoin...")
    try:
        repo_id = "rohan10juli/bertweet-finetuned-bitcoin"
        tokenizer = AutoTokenizer.from_pretrained(repo_id)
        model = AutoModelForSequenceClassification.from_pretrained(repo_id)
        model.eval()
        model_loaded = True
        print("✅ Model loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_model()
    yield
    # Shutdown (if needed)

app = FastAPI(title="Sentiment Analysis API", lifespan=lifespan)

# Enable CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str

class BatchTextInput(BaseModel):
    texts: List[str]

class SentimentResponse(BaseModel):
    label: str
    score: float

class BatchSentimentResponse(BaseModel):
    results: List[SentimentResponse]

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model": "rohan10juli/bertweet-finetuned-bitcoin"
    }

@app.post("/analyze", response_model=List[SentimentResponse])
async def analyze_sentiment(input_data: TextInput):
    """Analyze sentiment for a single text."""
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        text = input_data.text
        
        # Tokenize
        inputs = tokenizer(text, padding=True, truncation=True, max_length=128, return_tensors="pt")
        
        # Get predictions
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
        
        # Apply softmax to get probabilities
        probs = torch.nn.functional.softmax(logits, dim=1)
        
        # Get top 2 predictions
        top_probs, top_indices = torch.topk(probs[0], k=2)
        
        # Format results
        results = []
        for i in range(len(top_indices)):
            label = f"LABEL_{top_indices[i].item()}"
            score = top_probs[i].item()
            results.append(SentimentResponse(label=label, score=score))
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

@app.post("/analyze-batch", response_model=BatchSentimentResponse)
async def analyze_sentiment_batch(input_data: BatchTextInput):
    """Analyze sentiment for multiple texts in batch."""
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        texts = input_data.texts
        
        # Tokenize batch
        inputs = tokenizer(texts, padding=True, truncation=True, max_length=128, return_tensors="pt")
        
        # Get predictions
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
        
        # Apply softmax
        probs = torch.nn.functional.softmax(logits, dim=1)
        
        # Get top prediction for each text
        results = []
        for prob in probs:
            top_prob, top_idx = torch.max(prob, dim=0)
            label = f"LABEL_{top_idx.item()}"
            score = top_prob.item()
            results.append(SentimentResponse(label=label, score=score))
        
        return BatchSentimentResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment batch: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Sentiment Analysis API server...")
    print("📡 API will be available at http://localhost:8000")
    print("📖 API docs at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)

