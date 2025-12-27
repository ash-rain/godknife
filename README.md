# 🔪 GodKnife

A premium marketplace for handmade knives with integrated forum and real-time messaging features. Built with Next.js 16, React 19, TypeScript, and Prisma.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19.0-2D3748)

## ✨ Features

- 🛒 **Marketplace**: Buy and sell handmade knives with image galleries
- 💬 **Real-time Messaging**: Direct conversations with Soketi (self-hosted Pusher)
- 🗣️ **Community Forums**: Categorized discussions with moderation tools
- 💳 **Payment Integration**: PayPal, MyPOS, and Stripe support
- 🔐 **Authentication**: Email/password and OAuth (Google, Facebook)
- 🌍 **Internationalization**: English and Bulgarian translations
- 📸 **Image Processing**: Auto-resize and S3-compatible storage (MinIO)
- 👮 **Moderation System**: Thread pinning, locking, user bans, audit logs
- 📊 **Admin Dashboard**: User management, post moderation, analytics
- 🎨 **Post System**: Credits, boosts, free weekly posts, gallery mode

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Docker** and Docker Compose

### 1. Clone & Install

```bash
git clone <repository-url>
cd godknife
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://godknife:godknife_password@localhost:5432/godknife"

# Auth (generate with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-secret-here"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# MinIO Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9009"
MINIO_USE_SSL="false"
MINIO_ROOT_USER="godknife"
MINIO_ROOT_PASSWORD="godknife_password"
MINIO_BUCKET_NAME="godknife-images"

# Pusher/Soketi (Real-time)
PUSHER_APP_ID="godknife-app"
PUSHER_KEY="godknife-key"
PUSHER_SECRET="godknife-secret"
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="godknife-key"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
NEXT_PUBLIC_SOKETI_HOST="localhost"
NEXT_PUBLIC_SOKETI_PORT="6001"

# Redis
REDIS_URL="redis://localhost:6380"

# Payment (optional)
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"
PAYPAL_MODE="sandbox"
MYPOS_IPC_URL="https://mypos.com/vmp/checkout-test"
MYPOS_SID="your-mypos-sid"
MYPOS_WALLET="your-mypos-wallet"
MYPOS_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Pricing
POST_PURCHASE_PRICE="5"
BOOST_PRICE="10"
```

### 3. Start Services

```bash
# Start Docker services (PostgreSQL, MinIO, Redis, Soketi)
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npx ts-node scripts/seed-forums.ts
npx ts-node scripts/seed-categories.ts

# Start development server
npm run dev
```

### 4. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **App** | http://localhost:3000 | - |
| **MinIO Console** | http://localhost:9001 | godknife / godknife_password |
| **Prisma Studio** | `npx prisma studio` → http://localhost:5555 | - |
| **PostgreSQL** | localhost:5432 | godknife / godknife_password |
| **Redis** | localhost:6380 | - |
| **Soketi** | ws://localhost:6001 | - |

## 📁 Project Structure

```
godknife/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── posts/        # Marketplace posts
│   │   ├── forums/       # Forum discussions
│   │   ├── payments/     # Payment processing
│   │   └── admin/        # Admin-only routes
│   ├── admin/            # Admin dashboard pages
│   ├── forums/           # Forum pages
│   └── auth/             # Auth pages (signin, register)
├── components/            # React components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configs
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Database client
│   ├── minio.ts         # S3 storage client
│   ├── pusher.ts        # Real-time messaging
│   └── image-processor.ts # Image resizing
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration history
├── messages/            # i18n translations (en, bg)
├── __tests__/           # Jest test suites
└── docker-compose.yml   # Infrastructure services
```

## 🛠️ Development Commands

```bash
# Development
npm run dev                 # Start dev server (http://localhost:3000)
npm run build              # Production build
npm start                  # Production server (http://localhost:8888)
npm run lint               # Run ESLint

# Database
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create & apply migration
npx prisma migrate reset   # Reset database (⚠️ deletes data)
npx prisma generate        # Regenerate Prisma Client

# Testing
npm test                   # Run all tests
npm run test:watch         # Watch mode

# Docker
docker-compose up -d       # Start all services
docker-compose down        # Stop all services
docker-compose logs -f     # View logs
docker-compose ps          # List running containers
```

## 🔒 Authentication

The platform uses **NextAuth v5** with multiple providers:

### Create Your First Admin User

1. Start the app and register a new account at http://localhost:3000/auth/register
2. Open Prisma Studio: `npx prisma studio`
3. Navigate to the `User` table
4. Find your user and set `isAdmin` to `true`
5. Save and refresh the app

### OAuth Setup (Optional)

- **Google**: Get credentials from [Google Cloud Console](https://console.cloud.google.com)
- **Facebook**: Get credentials from [Facebook Developers](https://developers.facebook.com)

## 💾 Database Schema

Core models:
- **User**: Authentication, roles (`isAdmin`, `isModerator`), post credits
- **Post**: Marketplace items with images, pricing, boosting
- **Thread/ThreadComment**: Forum discussions and replies
- **Forum**: Named discussion spaces with slugs
- **Conversation/Message**: Real-time private messaging
- **Payment**: Transaction tracking (PayPal, MyPOS, Stripe)
- **ModerationLog**: Audit trail for moderation actions
- **UserBan**: Temporary/permanent user bans

See `prisma/schema.prisma` for complete schema.

## 📸 Image Upload

Images are automatically processed and stored in MinIO:
- **Max 10 images** per post
- **Formats**: JPEG, PNG, WebP, GIF
- **Auto-resized**: 3 sizes (150x150 thumb, 800x800 medium, 1920x1920 large)
- **S3-compatible**: Access at `http://localhost:9009/godknife-images/{filename}`

## 💳 Payment System

### Post Credits
- **Free users**: 1 post per week
- **Paid credits**: Buy 5 posts for $5
- Credits never expire

### Post Boosting
- **$10 per post**: Featured for 10 days
- Appears higher in search results

Configure pricing in `.env`:
```env
POST_PURCHASE_PRICE="5"   # USD for 5 credits
BOOST_PRICE="10"          # USD for 10-day boost
```

## 🗣️ Forum System

- **8 Main Categories**: Folders, Fixed Blades, Chef Knives, etc.
- **Forums**: Named discussion spaces (e.g., "Beginner Tips")
- **Threads**: Individual discussions
- **Moderation**: Pin, lock, flag, delete threads and comments
- **User Bans**: Temporary or permanent

Moderators can access tools via `/admin/forums`.

## 🧪 Testing

Jest test suites cover:
- ✅ Authentication (credentials, OAuth, username generation)
- ✅ Post creation and limits
- ✅ Payment flows (PayPal, MyPOS, Stripe)
- ✅ Forum operations

```bash
npm test                  # Run all tests
npm run test:watch       # Watch mode
```

## 🌐 Internationalization

Supports **English** and **Bulgarian**:
- Translation files: `messages/en.json`, `messages/bg.json`
- Client-side: Use `useLanguage()` hook
- Server-side: Import translations directly
- Language switcher in navigation

## 📚 Documentation

Detailed documentation available:
- **[QUICKSTART.md](./QUICKSTART.md)**: Commands and quick reference
- **[STATUS.md](./STATUS.md)**: Working features and URLs
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)**: Complete feature checklist
- **[FORUM_FEATURES.md](./FORUM_FEATURES.md)**: Forum API reference
- **[PAYMENT_SYSTEM.md](./PAYMENT_SYSTEM.md)**: Payment integration guide
- **[USER_PROFILE_DOCUMENTATION.md](./USER_PROFILE_DOCUMENTATION.md)**: Profile system
- Test READMEs: `__tests__/{auth,posts,payments}/README.md`

## 🐳 Docker Services

The `docker-compose.yml` file includes:
- **PostgreSQL** 17: Main database (port 5432)
- **MinIO**: S3-compatible object storage (ports 9009, 9001)
- **Redis** 7: Caching and sessions (port 6380)
- **Soketi**: Real-time WebSocket server (port 6001)

All services persist data in Docker volumes.

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### MinIO Not Accessible
```bash
# Check MinIO is running
docker-compose ps minio

# Access console at http://localhost:9001
# Verify bucket "godknife-images" exists
```

### Image Upload Failures
- Ensure MinIO is running: `docker-compose up -d minio`
- Check bucket initialization in logs
- Verify `MINIO_ENDPOINT` and `MINIO_PORT` in `.env`

### Real-time Messaging Not Working
- Ensure Soketi is running: `docker-compose up -d soketi`
- Check WebSocket connection in browser console
- Verify Pusher credentials in `.env`

## 🚢 Production Deployment

### Build for Production
```bash
npm run build
npm start  # Runs on port 8888
```

### Environment Variables
- Set production URLs for `NEXTAUTH_URL`
- Use production OAuth credentials
- Configure production MinIO/S3 bucket
- Set strong secrets for `NEXTAUTH_SECRET`
- Use production payment credentials

### Database Migrations
```bash
npx prisma migrate deploy  # Apply pending migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🛟 Support

For issues, questions, or feature requests, please create an issue in the repository.

---

**Built with ❤️ using Next.js, React, and TypeScript**
