#!/bin/bash

# GodKnife Setup Script
# This script sets up the development environment

set -e

echo "🔪 GodKnife Setup Script"
echo "========================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL, MinIO, Redis)..."
docker-compose up -d
echo "✅ Docker services started"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init
echo "✅ Database migrated"
echo ""

# Create initial admin user (optional)
read -p "Do you want to create an admin user? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    read -p "Enter admin email: " admin_email
    read -sp "Enter admin password: " admin_password
    echo ""
    
    # Create admin user using Prisma
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    async function createAdmin() {
      const hashedPassword = await bcrypt.hash('$admin_password', 10);
      const user = await prisma.user.create({
        data: {
          email: '$admin_email',
          password: hashedPassword,
          name: 'Admin',
          username: 'admin',
          isAdmin: true,
        },
      });
      console.log('✅ Admin user created');
      await prisma.\$disconnect();
    }
    
    createAdmin().catch(console.error);
    "
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy .env.example to .env and update with your credentials"
echo "2. Configure OAuth providers (Google, Facebook)"
echo "3. Set up Pusher for real-time chat"
echo "4. Configure PayPal and MyPOS credentials"
echo ""
echo "🚀 To start the development server, run:"
echo "   npm run dev"
echo ""
echo "🌐 Application will be available at:"
echo "   - App: http://localhost:3000"
echo "   - MinIO Console: http://localhost:9001"
echo ""
echo "MinIO credentials:"
echo "   Username: godknife"
echo "   Password: godknife_password"
