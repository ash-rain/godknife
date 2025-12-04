# GodKnife - Quick Reference

## 🚀 Essential Commands

### Development
```bash
# Start everything
docker-compose up -d && npm run dev

# Stop everything
docker-compose down

# View logs
npm run dev                    # App logs
docker-compose logs -f         # All service logs
docker-compose logs postgres   # Database logs
docker-compose logs minio      # Storage logs
```

### Database
```bash
# Prisma Studio (DB GUI)
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset --force

# Generate Prisma Client
npx prisma generate
```

### Docker
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# View running containers
docker-compose ps

# Restart a service
docker-compose restart postgres
docker-compose restart minio
```

## 🔗 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:3000 | - |
| Buy Credits | http://localhost:3000/payment/buy-credits | - |
| MinIO Console | http://localhost:9001 | godknife / godknife_password |
| Prisma Studio | http://localhost:5555 | - |
| PostgreSQL | localhost:5432 | godknife / godknife_password |

## 📝 .env Quick Setup

Minimum required for local development:
```env
DATABASE_URL="postgresql://godknife:godknife_password@localhost:5432/godknife"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

## 🔑 Generate Secrets
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🧪 Testing Features

### Create Admin User (via Prisma Studio)
1. Run `npx prisma studio`
2. Open User table
3. Create new user
4. Set `isAdmin` to `true`
5. Set password hash (use bcryptjs to generate)

### Test Post Limits
1. Create 1 post (free)
2. Try creating 2nd post → should show limit
3. API will return post credit requirement

### Test Image Upload
- Max 10 images per post
- Formats: JPEG, PNG, WebP, GIF
- Auto-resized to 3 sizes
- Stored in MinIO

## 🐛 Common Issues

### "Cannot connect to database"
```bash
docker-compose ps  # Check if PostgreSQL is running
docker-compose logs postgres  # Check logs
```

### "MinIO connection failed"
```bash
docker-compose logs minio  # Check logs
# Try accessing http://localhost:9001
```

### "Module not found"
```bash
npm install --legacy-peer-deps
npx prisma generate
```

### "Migration failed"
```bash
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

## 📦 Package Management

```bash
# Install dependencies
npm install --legacy-peer-deps

# Update package
npm update package-name --legacy-peer-deps

# Add new package
npm install package-name --legacy-peer-deps
```

## 🗄️ Database Queries

### Check User Credits
```sql
SELECT email, "postCredits", "lastFreePostDate" FROM "User";
```

### View All Posts
```sql
SELECT id, title, price, "isBoosted", status FROM "Post";
```

### Check Payments
```sql
SELECT * FROM "Payment" ORDER BY "createdAt" DESC;
```

### Make User Admin
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'user@example.com';
```

Run via:
```bash
docker exec -it godknife-postgres psql -U godknife -d godknife
```

## 🔐 Authentication Testing

### Email/Password Login
1. Register via `/auth/signin`
2. Email: `test@example.com`
3. Password: `password123`

### OAuth (requires setup)
- Google: Configure in Google Cloud Console
- Facebook: Configure in Facebook Developers

## 💰 Payment Testing

### Stripe (Recommended)
Test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future expiry, any 3-digit CVC

Setup:
1. Get keys from https://dashboard.stripe.com/apikeys
2. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. For local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
   ```

### PayPal Sandbox
1. Create sandbox account at https://developer.paypal.com
2. Use sandbox credentials in `.env`
3. Test with sandbox buyer account
4. View transactions in PayPal dashboard

### MyPOS Testing
- Requires merchant account
- Test mode available
- Configure webhook URL

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Configuration |
| `prisma/schema.prisma` | Database schema |
| `docker-compose.yml` | Services config |
| `lib/auth.ts` | Authentication |
| `lib/prisma.ts` | Database client |
| `app/api/*` | API endpoints |

## 🎨 Customization Points

### Change Pricing
Edit `.env`:
```env
POST_PURCHASE_PRICE=5
BOOST_PRICE=10
FREE_POSTS_PER_WEEK=1
```

### Modify Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name change_name`
3. Run `npx prisma generate`

### Add Translation
1. Edit `messages/en.json` and `messages/bg.json`
2. Add new keys
3. Use in components with `t('your.key')`

## 📱 API Testing

### Create Post (with auth)
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: multipart/form-data" \
  -F "title=My Knife" \
  -F "description=Beautiful knife" \
  -F "price=99.99" \
  -F "image-0=@/path/to/image.jpg"
```

### Get Posts
```bash
curl http://localhost:3000/api/posts?sort=newest
```

### Like Post (requires session)
```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/like \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

## 🔄 Reset & Restart

### Full Reset
```bash
# Stop everything
docker-compose down -v

# Start fresh
docker-compose up -d
npx prisma migrate reset --force
npx prisma migrate dev --name init
npm run dev
```

### Quick Restart
```bash
docker-compose restart
npm run dev
```

## 📊 Monitoring

### Check Service Health
```bash
# All services
docker-compose ps

# Specific service logs
docker-compose logs -f postgres
docker-compose logs -f minio
docker-compose logs -f redis
```

### Database Size
```bash
docker exec godknife-postgres psql -U godknife -d godknife -c "SELECT pg_database_size('godknife');"
```

### MinIO Stats
- Access console: http://localhost:9001
- View bucket usage and files

## 🎯 Development Workflow

1. Start Docker: `docker-compose up -d`
2. Start dev server: `npm run dev`
3. Make changes to code
4. Hot reload automatically applies
5. For schema changes:
   - Edit `prisma/schema.prisma`
   - Run `npx prisma migrate dev`
   - Restart dev server

## 📚 Learn More

- [Full Documentation](./IMPLEMENTATION.md)
- [Setup Guide](./READY.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://prisma.io/docs)

---

**Pro Tip**: Bookmark this file for quick reference! 🔖
