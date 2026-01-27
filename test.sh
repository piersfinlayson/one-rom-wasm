#!/bin/bash
echo "Starting HTTP server..."
echo "Navigate to: http://localhost:8000/index.html"
echo ""
miniserve --header "Access-Control-Allow-Origin:*" --port 8000 ./deploy