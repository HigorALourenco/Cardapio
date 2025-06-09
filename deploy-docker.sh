#!/bin/bash

echo "🐳 Building Docker image..."
docker build -t adega-online .

echo "🚀 Starting container..."
docker run -d -p 3000:3000 --name adega-online adega-online

echo "✅ Deploy completed!"
echo "🌐 Access: http://localhost:3000"
