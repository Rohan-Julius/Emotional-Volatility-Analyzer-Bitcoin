from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import json

# Load your fine-tuned model
repo_id = "rohan10juli/bertweet-finetuned-bitcoin"
tokenizer = AutoTokenizer.from_pretrained(repo_id)
model = AutoModelForSequenceClassification.from_pretrained(repo_id)
model.eval()

# Load tweets from JSON file
with open("bitcoin_tweets.json", "r") as f:
    tweets = json.load(f)

# Get only the tweet texts
texts = [t["text"] for t in tweets if t["text"]]

# Tokenize and classify in batches
inputs = tokenizer(texts, padding=True, truncation=True, max_length=64, return_tensors="pt")
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits

# Compute predicted class and confidence
probs = torch.nn.functional.softmax(logits, dim=1)
confidences, predicted_classes = torch.max(probs, dim=1)

# Print classification results
for i, text in enumerate(texts):
    print(f"Tweet: {text}")
    print(f"Predicted Class: {predicted_classes[i].item()} | Confidence: {confidences[i].item():.4f}")
    print("-" * 80)
