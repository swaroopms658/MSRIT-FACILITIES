FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend/app folder into /app
COPY app /app

# Run the FastAPI app (adjust if different)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
