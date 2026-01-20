#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate

echo "Loading data dump..."
python manage.py loaddata datadump.json

echo "Collecting static files..."
python manage.py collectstatic --noinput

exec "$@"