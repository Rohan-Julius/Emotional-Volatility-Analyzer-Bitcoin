# Python Backend Setup

This project uses a Python FastAPI backend to run the PyTorch sentiment analysis model.

## Setup

**IMPORTANT:** A clean conda environment has been created to avoid dependency conflicts. Use this environment.

1. **Activate the conda environment:**
   ```bash
   conda activate sentiment-api
   ```
   
   If you're in a new terminal, you may need to initialize conda first:
   ```bash
   source $(conda info --base)/etc/profile.d/conda.sh
   conda activate sentiment-api
   ```

2. **Start the Python API server:**
   ```bash
   python sentiment_api.py
   ```
   
   The server will start on `http://localhost:8000`

3. **Keep the server running** while using the Next.js app.

## API Endpoints

- `GET /` - Health check
- `POST /analyze` - Analyze sentiment for a single text
- `POST /analyze-batch` - Analyze sentiment for multiple texts

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Notes

- The model will be downloaded from Hugging Face on first run (this may take a few minutes)
- The model is cached locally after the first download
- Make sure both the Python server and Next.js dev server are running simultaneously

