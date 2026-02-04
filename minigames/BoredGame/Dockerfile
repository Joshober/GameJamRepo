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

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all game files
COPY *.py .
COPY *.ttf *.otf ./
COPY graphics/ ./graphics/
COPY map/ ./map/

# Set display for virtual framebuffer
ENV DISPLAY=:99

# Run Xvfb in background and execute the game
CMD ["bash", "-c", "Xvfb :99 -screen 0 1280x720x24 & sleep 1 && python main.py --players 1 --seed 123 --mode jam"]
