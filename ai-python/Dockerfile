FROM python:3.11-slim

# Install system dependencies (OCR, etc)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Expose port (Hugging Face expects 7860)
ENV FLASK_PORT=7860
EXPOSE 7860

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Create required directories
RUN mkdir -p logs uploads

COPY . .

# Start the Flask app
CMD ["python", "run.py"]