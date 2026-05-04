#!/bin/sh

echo "Running migrations..."
uv run manage.py migrate

echo "Starting server..."
uv run manage.py runserver 0.0.0.0:8000
