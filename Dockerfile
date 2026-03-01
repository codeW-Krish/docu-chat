# ============================================
# Dockerfile: PHP Backend (CodeIgniter 4)
# Deploy on Railway
# ============================================

FROM php:8.2-apache AS base

# ---- System Dependencies ----
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libicu-dev \
    libcurl4-openssl-dev \
    libzip-dev \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# ---- PHP Extensions ----
RUN docker-php-ext-install pdo pgsql pdo_pgsql curl zip intl

# ---- Apache Config ----
RUN a2dismod mpm_event mpm_worker 2>/dev/null; a2enmod mpm_prefork rewrite headers

# Set document root to CodeIgniter's public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/backend/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Listen on PORT env variable (Railway sets this) - substituted at runtime
# Remove default port config, will be set at container start
RUN echo "" > /etc/apache2/ports.conf

# ---- Install Composer ----
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ---- Copy PHP Backend ----
WORKDIR /var/www/html/backend
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs

COPY backend/ .

# Make writable directory writable
RUN mkdir -p writable/cache writable/logs writable/session writable/uploads writable/debugbar \
    && chmod -R 777 writable

# ---- Entrypoint script ----
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ---- Environment defaults ----
ENV CI_ENVIRONMENT=production

# Expose port and start Apache via entrypoint
EXPOSE ${PORT:-8080}
CMD ["/usr/local/bin/docker-entrypoint.sh"]
