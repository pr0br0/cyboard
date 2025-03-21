#!/bin/bash

# This script installs all required dependencies for the Cyprus Classified project

echo "Installing all required dependencies..."

# Core dependencies
npm install nodemailer multer-storage-cloudinary node-cache slugify

# Image processing
npm rebuild sharp

# Security dependencies 
npm install helmet cors bcryptjs jsonwebtoken

# Validation dependencies
npm install joi express-validator

# Database dependencies
npm install mongoose mongodb

# Testing dependencies
npm install --save-dev jest supertest

echo "All dependencies installed successfully!" 