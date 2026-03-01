#!/bin/bash
set -e

PORT=${PORT:-8080}

# Configure Apache to listen on the correct port
echo "Listen ${PORT}" > /etc/apache2/ports.conf

cat > /etc/apache2/sites-available/000-default.conf <<EOF
<VirtualHost *:${PORT}>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html/backend/public

    <Directory /var/www/html/backend/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

echo "Starting Apache on port ${PORT}..."
exec apache2-foreground
