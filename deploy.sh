#!/bin/bash

echo "🚀 Starting Full Stack Deployment..."

# 0. Create Swap to prevent OOM on t3.micro
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB Swapfile..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
fi

# 1. Stop existing containers
echo "⬇️  Stopping old containers..."
docker compose -f docker-compose.prod.yml down

# 1.5 Clean artifacts
echo "🧹 Cleaning node_modules to prevent build pollution..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# 2. Build images (using caching if available)
echo "🏗️  Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

# 3. Start services
echo "⬆️  Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deployment Complete!"
echo "-----------------------------------"
echo "🌐 Web Portal: http://localhost:3001"
echo "🔌 API Gateway: http://localhost:3000"
echo "🧠 AI Engine: http://localhost:8000"
