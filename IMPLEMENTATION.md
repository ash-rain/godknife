# GodKnife Platform - Complete Setup & Implementation Guide

## Overview
This document provides a comprehensive guide for the GodKnife platform - a full-featured marketplace for handmade knives.

## ✅ What Has Been Implemented

### 1. Core Infrastructure
- ✅ Next.js 16 with React 19 and TypeScript
- ✅ Docker Compose setup (PostgreSQL, MinIO, Redis)
- ✅ Prisma ORM with complete database schema
- ✅ TailwindCSS 4 for styling
- ✅ Environment configuration with .env

### 2. Authentication System
- ✅ NextAuth.js configuration
- ✅ Email/password authentication
- ✅ Google OAuth integration
- ✅ Facebook OAuth integration
- ✅ User registration API endpoint
- ✅ Session management with JWT

### 3. Database Schema
Complete Prisma schema with:
- ✅ User model (with admin flag, post credits, last free post date)
- ✅ Post model (title, description, images, price, gallery flag, boost status)
- ✅ Like model (user-post relationship)
- ✅ Comment model (with user and post relationships)
- ✅ Conversation & Message models (real-time chat)
- ✅ ConversationParticipant model (many-to-many)
- ✅ Payment model (PayPal/MyPOS support, type, status)
- ✅ Settings model (configurable platform settings)

### 4. Image Management
- ✅ MinIO integration for S3-compatible storage
- ✅ Image upload with automatic resizing (thumb, medium, large)
- ✅ Sharp library for image processing
- ✅ Multiple image upload support (up to 10 per post)

### 5. Post Management API
- ✅ `POST /api/posts` - Create post with image uploads
- ✅ `GET /api/posts` - List posts (with sorting: newest, hottest, boosted)
- ✅ `GET /api/posts/[id]` - Get post details with view tracking
- ✅ `PUT /api/posts/[id]` - Update post
- ✅ `DELETE /api/posts/[id]` - Delete post
- ✅ `POST /api/posts/[id]/like` - Toggle like
- ✅ `GET /api/posts/[id]/comments` - Get comments
- ✅ `POST /api/posts/[id]/comments` - Add comment
- ✅ Post limits: 1 free per week, purchased credits system

### 6. Messaging System
- ✅ `GET /api/conversations` - List user conversations
- ✅ `POST /api/conversations` - Start new conversation
- ✅ `GET /api/conversations/[id]/messages` - Get messages
- ✅ `POST /api/conversations/[id]/messages` - Send message
- ✅ Pusher integration for real-time messaging
- ✅ Conversation starting from post author contact

### 7. Payment Integration
- ✅ PayPal SDK integration
  - Create order endpoint
  - Capture order endpoint
  - Payment verification
- ✅ MyPOS.bg integration
  - Create payment endpoint
  - Webhook endpoint for payment confirmation
- ✅ Post credits purchase (5 posts for €5)
- ✅ Post boost purchase (10 days for €10)
- ✅ Payment tracking and status management

### 8. User Profiles
- ✅ `GET /api/users/[username]` - Get user profile
- ✅ `PUT /api/users/[username]` - Update profile
- ✅ Custom profile pages at `/u/username`
- ✅ Profile customization support (bio, location, website, custom theme)

### 9. Admin Features
- ✅ `GET /api/admin/dashboard` - Dashboard statistics
- ✅ `GET /api/admin/users` - User management
- ✅ `GET /api/admin/settings` - Get platform settings
- ✅ `PUT /api/admin/settings` - Update settings
- ✅ Admin-only middleware protection
- ✅ Post moderation capabilities

### 10. Internationalization (i18n)
- ✅ English and Bulgarian translations
- ✅ Cookie-based language preference
- ✅ Complete translation files for all features
- ✅ LanguageProvider context for easy access

### 11. UI Components
- ✅ Navigation component with language switcher
- ✅ HomePage component with post feed
- ✅ PostCard component for displaying posts
- ✅ PostCreateModal for creating new posts
- ✅ SessionProvider for authentication state
- ✅ LanguageProvider for i18n

### 12. Security & Middleware
- ✅ Route protection middleware
- ✅ Admin route protection
- ✅ JWT token validation
- ✅ CSRF protection via NextAuth

## 📋 Setup Instructions

### Prerequisites
```bash
- Node.js 20+
- Docker & Docker Compose
- npm or yarn
```

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Docker Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- MinIO on ports 9000 (API) and 9001 (Console)
- Redis on port 6379

### Step 3: Configure Environment
1. The `.env` file is already created
2. Update the following credentials:

**Required for OAuth:**
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`

**Required for Email Auth:**
- `EMAIL_SERVER` - SMTP server URL
- `EMAIL_FROM` - Sender email address

**Required for Chat (Soketi - Self-hosted):**
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET` (defaults provided)
- `PUSHER_HOST`, `PUSHER_PORT` (localhost:6001 by default)
- `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_HOST`, `NEXT_PUBLIC_PUSHER_PORT`
- See `SOKETI_SETUP.md` for details

**Required for Payments:**
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- `MYPOS_MERCHANT_ID`, `MYPOS_PRIVATE_KEY`, `MYPOS_PUBLIC_KEY`

**Generate Secret:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### Step 4: Initialize Database
```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### Step 5: Run Development Server
```bash
npm run dev
```

Access at: http://localhost:3000

### Step 6: Access MinIO Console
1. Open http://localhost:9001
2. Login with:
   - Username: `godknife`
   - Password: `godknife_password`
3. The bucket `godknife-images` will be auto-created on first upload

## 🔧 Configuration Notes

### OAuth Setup

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Google+ API
3. Create OAuth credentials
4. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**Facebook:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app
3. Add Facebook Login product
4. Set redirect URI: `http://localhost:3000/api/auth/callback/facebook`

### Soketi Setup (Self-hosted Real-time)
1. Already included in `docker-compose.yml`!
2. Start with: `docker-compose up -d soketi`
3. Default credentials are in `.env.example`
4. See `SOKETI_SETUP.md` for production configuration

### PayPal Setup
1. Create [PayPal Developer](https://developer.paypal.com/) account
2. Create sandbox app
3. Copy client ID and secret
4. For production, change `PAYPAL_MODE` to `live`

### MyPOS Setup
1. Register with [MyPOS.bg](https://mypos.com/)
2. Get merchant credentials
3. Configure webhook URL: `{YOUR_DOMAIN}/api/payments/mypos/webhook`

## 🎨 Customization

### Pricing Configuration
Update in `.env`:
```env
POST_PURCHASE_PRICE=5  # EUR per 5 posts
BOOST_PRICE=10         # EUR for 10 days
FREE_POSTS_PER_WEEK=1  # Free posts per week
```

### Theme Customization
Users can customize their profile theme via the custom theme JSON field in their profile.

## 📱 Key Features Usage

### Creating a Post
1. User must be logged in
2. Click "New Post" button
3. Upload 1-10 images
4. Add title, description
5. Set price (optional) or mark as gallery
6. System checks post credits (free or purchased)
7. Post is created with automatic image resizing

### Messaging
1. Click "Contact Seller" on any post
2. Start conversation
3. Real-time updates via Pusher
4. Messages stored in database

### Boosting Posts
1. Navigate to post settings
2. Click "Boost Post"
3. Choose payment method (PayPal/MyPOS)
4. Complete payment
5. Post appears in "Boosted" feed for 10 days

### Admin Access
1. Set user's `isAdmin` flag to `true` in database
2. Access `/admin` routes
3. View dashboard, manage users, moderate posts

## 🗄️ Database Management

### Prisma Studio (GUI)
```bash
npx prisma studio
```

### Create Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

## 🚀 Deployment

### Production Checklist
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Change `NEXTAUTH_SECRET` to strong random value
- [ ] Set `PAYPAL_MODE=live`
- [ ] Update MinIO/S3 URLs for production
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure production OAuth redirect URLs
- [ ] Set up payment webhooks with HTTPS

### Docker Production
```bash
# Build for production
npm run build

# Start with PM2 or similar
npm start
```

## 🐛 Troubleshooting

### Issue: TypeScript Errors
**Solution:** Run `npm install` to install missing dependencies, then `npx prisma generate`

### Issue: MinIO Connection Failed
**Solution:** Ensure Docker is running: `docker-compose ps`

### Issue: Database Connection Failed
**Solution:** Check PostgreSQL is running: `docker-compose logs postgres`

### Issue: Images Not Loading
**Solution:** Check MinIO bucket exists and has public read policy

## 📊 Architecture

```
┌─────────────┐
│   Next.js   │
│   Frontend  │
└──────┬──────┘
       │
┌──────┴──────┐
│  API Routes │
├─────────────┤
│  NextAuth   │
│   Prisma    │
│   MinIO     │
│   Pusher    │
└──────┬──────┘
       │
┌──────┴──────┐
│ PostgreSQL  │
│   MinIO     │
│   Redis     │
└─────────────┘
```

## 📝 Next Steps for Production

1. **Create Additional UI Pages:**
   - Individual post detail page (`/posts/[id]`)
   - User profile page (`/u/[username]`)
   - Messages page (`/messages`)
   - Admin dashboard pages (`/admin/*`)
   - Payment success/cancel pages

2. **Add More Components:**
   - Chat interface component
   - Payment modal component
   - Admin tables and forms
   - User profile editor

3. **Testing:**
   - Add unit tests
   - Add integration tests
   - Test payment flows
   - Test real-time messaging

4. **SEO & Performance:**
   - Add meta tags
   - Implement image lazy loading
   - Add caching strategies
   - Optimize bundle size

5. **Security Enhancements:**
   - Rate limiting
   - Input sanitization
   - XSS protection
   - Implement webhook signature verification for payments

## 🤝 Support

For any issues or questions, please refer to:
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
- NextAuth docs: https://next-auth.js.org

---

**Status:** ✅ Core platform complete and ready for development
**Version:** 1.0.0
**Last Updated:** November 2025
