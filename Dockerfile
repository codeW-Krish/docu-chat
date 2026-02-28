# ============================================
# Combined Dockerfile: PHP Backend + Python AI
# Deploy on Railway as a single service
# ============================================

FROM php:8.2-apache AS base

# ---- System Dependencies ----
RUN apt-get update && apt-get install -y \
    # PHP extensions deps
    libpq-dev \
    libcurl4-openssl-dev \
    libzip-dev \
    unzip \
    git \
    # Python 3
    python3 \
    python3-pip \
    python3-venv \
    # Tesseract OCR (for PDF image text extraction)
    tesseract-ocr \
    tesseract-ocr-eng \
    # PDF processing deps
    libgl1 \
    libglib2.0-0 \
    # Process manager
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# ---- PHP Extensions ----
RUN docker-php-ext-install pdo pgsql pdo_pgsql curl zip

# ---- Apache Config ----
RUN a2enmod rewrite headers

# Set document root to CodeIgniter's public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/backend/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Listen on PORT env variable (Railway sets this)
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf
RUN sed -i 's/:80/:${PORT}/' /etc/apache2/sites-available/000-default.conf

# ---- Install Composer ----
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ---- Copy PHP Backend ----
WORKDIR /var/www/html/backend
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY backend/ .

# Make writable directory writable
RUN mkdir -p writable/cache writable/logs writable/session writable/uploads writable/debugbar \
    && chmod -R 777 writable

# ---- Setup Python AI ----
WORKDIR /app/ai-python

# Create virtual environment
RUN python3 -m venv /app/ai-python/venv
ENV PATH="/app/ai-python/venv/bin:$PATH"

# Install Python deps (heavy - cached layer)
COPY ai-python/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy Python app
COPY ai-python/ .

# Create required directories
RUN mkdir -p logs uploads

# ---- Shared uploads directory ----
# Both PHP and Python can access this
RUN mkdir -p /app/shared-uploads && chmod 777 /app/shared-uploads

# ---- Supervisord Config ----
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ---- Environment defaults ----
ENV PORT=8080
ENV PYTHON_SERVER_URL=http://localhost:5000
ENV TESSERACT_PATH=/usr/bin/tesseract
ENV CI_ENVIRONMENT=production

EXPOSE ${PORT}

# Start both services via supervisord
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
