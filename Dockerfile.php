FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && pecl install redis \
    && docker-php-ext-enable redis

RUN a2enmod rewrite

RUN echo "upload_max_filesize = 30M\npost_max_size = 35M\nmemory_limit = 256M" > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

ENV APACHE_DOCUMENT_ROOT /var/www/html/backend/public
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html/backend/public\n\
    <Directory /var/www/html/backend/public>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf