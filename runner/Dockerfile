FROM python:3.11-slim

# System deps for pygame + virtual display
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    libsdl2-2.0-0 \
    libsdl2-image-2.0-0 \
    libsdl2-mixer-2.0-0 \
    libsdl2-ttf-2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY runner.py .

EXPOSE 5001

# Start Xvfb then Flask runner API
CMD ["bash", "-lc", "Xvfb :99 -screen 0 1280x720x24 & python runner.py"]
