#!/bin/bash

echo "Deploying Cyprus Classified..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Build application (если есть build step)
npm run build

# Restart PM2 process
pm2 restart ecosystem.config.js --env production

echo "Deployment completed!"