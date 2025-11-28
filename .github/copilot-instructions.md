# GodKnife Platform - AI Agent Instructions

## Project Overview

GodKnife is a Next.js 16 marketplace for handmade knives with forum capabilities, built using React 19, TypeScript, Prisma ORM, and Docker-based infrastructure (PostgreSQL, MinIO, Redis, Soketi).

## Architecture & Key Components

### Infrastructure Stack
- **Next.js 16** with App Router (all routes in `app/` directory)
- **Database**: PostgreSQL (localhost:5432) managed via Prisma ORM
- **Object Storage**: MinIO (localhost:9009) for S3-compatible image storage in bucket `godknife-images`
- **Real-time**: Soketi (self-hosted Pusher alternative, port 6001) for messaging
- **Redis**: Port 6380 for caching/sessions

Start services: `docker-compose up -d && npm run dev`
Access MinIO console: http://localhost:9001 (godknife/godknife_password)

### Database Schema (Prisma)
Core models in `prisma/schema.prisma`:
- **User**: Auth, profile, `isAdmin`, `isModerator`, `postCredits`, `lastFreePostDate`
- **Post**: Marketplace items with images, `price`, `isGallery`, `isBoosted`, `categoryId`
- **Thread/ThreadComment**: Forum system with moderation status
- **Forum**: Named discussion spaces with slug, icon, color
- **Payment**: PayPal/MyPOS integration tracking with `PaymentType` (POST_CREDITS, POST_BOOST)
- **ModerationLog**: Audit trail for all moderation actions

Run migrations: `npx prisma migrate dev --name migration_name`
View data: `npx prisma studio` (http://localhost:5555)

### Authentication Pattern (NextAuth v5)
Configuration in `lib/auth.ts`:
- Credentials, Google, Facebook OAuth providers
- **Username generation**: Auto-creates unique usernames from name via `generateUniqueUsername()` for OAuth users
- Session extended with `isAdmin`, `isModerator` via callbacks
- Middleware (`middleware.ts`) protects `/admin/*` and `/api/admin/*` routes

Check auth in API routes:
```typescript
const session = await auth()
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### API Route Conventions
- All API routes use App Router pattern: `app/api/[resource]/route.ts`
- Export async functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Dynamic routes: `app/api/[resource]/[id]/route.ts` with params in second argument
- Admin routes require `session.user.isAdmin` check
- Moderation routes check `user.isModerator || user.isAdmin`

Example:
```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  // ...
}
```

### Image Processing Workflow
Uses `lib/image-processor.ts` and `lib/minio.ts`:
1. Accept FormData with files named `image-0`, `image-1`, etc. (max 10)
2. Resize to 3 sizes: `thumb` (150x150), `medium` (800x800), `large` (1920x1920)
3. Upload to MinIO with filename pattern: `{timestamp}-{random}-{suffix}.jpg`
4. Store array of filenames in Post.images field
5. Images are publicly accessible via MinIO at http://localhost:9009/{bucket}/{filename}

Example from `app/api/posts/route.ts`:
```typescript
// Extract files from FormData
const imageFiles: File[] = []
for (const [key, value] of formData.entries()) {
    if (key.startsWith('image-') && value instanceof File) {
        imageFiles.push(value)
    }
}

// Upload with resizing
await initializeBucket()
const uploadedImages: string[] = []

for (const file of imageFiles) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    
    // Upload original
    await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
        'Content-Type': 'image/jpeg',
    })
    
    // Upload resized versions (thumb, medium, large)
    for (const size of IMAGE_SIZES) {
        const resizedBuffer = await resizeImage(buffer, size)
        const resizedFilename = filename.replace('.jpg', `-${size.suffix}.jpg`)
        await minioClient.putObject(BUCKET_NAME, resizedFilename, resizedBuffer, resizedBuffer.length, {
            'Content-Type': 'image/jpeg'
        })
    }
    
    uploadedImages.push(filename)
}
```

### Post Limits System
Logic in `lib/post-limits.ts`:
- Free users: 1 post per week (tracked via `User.lastFreePostDate`)
- Paid credits: `User.postCredits` consumed per post
- Check before creation: `canUserCreatePost(userId)` returns `{ canPost, reason?, nextFreePostDate? }`
- Consume credit: `consumePostCredit(userId)` updates DB atomically

Example usage in post creation:
```typescript
const session = await auth()
const canPost = await canUserCreatePost(session.user.id)

if (!canPost.canPost) {
    return NextResponse.json({
        error: canPost.reason,
        nextFreePostDate: canPost.nextFreePostDate,
    }, { status: 403 })
}

// Create post...
await consumePostCredit(session.user.id) // Deducts credit or updates lastFreePostDate
```

### Internationalization (i18n)
- Configured via `i18n.ts` with `next-intl` library
- Locales: `en`, `bg` (English, Bulgarian)
- Translation files: `messages/en.json`, `messages/bg.json`
- Client-side: Use `LanguageProvider` context with `useLanguage()` hook
- Server-side: Import translations in Server Components
- Language switcher in `components/Navigation.tsx`

### Real-time Messaging (Pusher/Soketi)
Setup in `lib/pusher.ts`:
- Server: `pusherServer.trigger(channel, event, data)`
- Client: `getPusherClient()` returns configured PusherClient
- Hook: `hooks/usePusher.ts` manages connection and subscriptions
- Conversations API at `/api/conversations` and `/api/conversations/[id]/messages`

### Forum & Moderation System
Documented in `FORUM_FEATURES.md`:
- **Forums**: Categorized discussion spaces (slug-based URLs)
- **Threads**: Discussions with pin/lock/flag status
- **Comments**: Nested replies with moderation
- **Bans**: Temporary/permanent via `UserBan` model
- **Logs**: All actions tracked in `ModerationLog`

Moderation pattern from `app/api/moderation/threads/[id]/route.ts`:
```typescript
async function checkModeratorPermission(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isModerator: true, isAdmin: true }
    })
    return user?.isModerator || user?.isAdmin || false
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const isModerator = await checkModeratorPermission(session.user.id)
    if (!isModerator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const { action, reason } = await request.json() // Actions: pin, lock, flag, delete, etc.
    
    // Update thread and log action
    await prisma.$transaction([
        prisma.thread.update({ where: { id }, data: { /* ... */ } }),
        prisma.moderationLog.create({ data: { action, moderatorId: session.user.id, reason } })
    ])
}
```

### Testing Setup
Jest configured (`jest.config.js`, `jest.setup.js`):
- Run: `npm test` or `npm run test:watch`
- Tests use actual PostgreSQL database (ensure Docker running)
- Auth tests: `__tests__/auth/` cover registration, login, username generation
- Post tests: `__tests__/posts/` verify limits, creation
- Test README files in subdirectories explain coverage

## Critical Developer Workflows

### Local Development
```bash
# Full startup
docker-compose up -d && npm run dev

# Database reset (⚠️ deletes data)
npx prisma migrate reset --force

# Production build
npm run build && npm start  # Runs on port 8888
```

### Creating New Features
1. **API Route**: Create in `app/api/[feature]/route.ts`, add auth check
2. **Database Changes**: Modify `prisma/schema.prisma`, run `npx prisma migrate dev`
3. **Components**: Add to `components/`, use `useSession()` for auth state
4. **Types**: Extend `types/next-auth.d.ts` for session customization

### Admin vs Regular Users
- Admin check: `session?.user?.isAdmin` (set manually in DB via Prisma Studio)
- Moderators: `user.isModerator` for forum/content moderation
- Middleware automatically redirects non-admins from `/admin` routes

### Payment Integration
PayPal and MyPOS integration for post credits and boosts.

Example from `app/api/payments/paypal/create-order/route.ts`:
```typescript
const { type, postId } = await req.json() // type: 'POST_CREDITS' or 'BOOST'

let amount: number, quantity: number, description: string

if (type === 'POST_CREDITS') {
    amount = parseFloat(process.env.POST_PURCHASE_PRICE || '5')
    quantity = 5
    description = '5 Post Credits'
} else if (type === 'BOOST') {
    amount = parseFloat(process.env.BOOST_PRICE || '10')
    quantity = 1
    description = 'Boost Post for 10 days'
}

// Create PayPal order, store Payment record, return orderId
const payment = await prisma.payment.create({
    data: { userId, amount, provider: 'PAYPAL', type, quantity, status: 'PENDING' }
})
```

Capture flow updates `User.postCredits` or `Post.isBoosted` after payment verification.

## Project-Specific Conventions

### Naming Patterns
- Database fields: camelCase (`authorId`, `createdAt`)
- API routes: kebab-case URLs (`/api/post-credits`)
- Components: PascalCase files and exports
- Hooks: camelCase with `use` prefix

### Data Fetching
- Client components: `fetch()` in `useEffect` or event handlers
- Server components: `await prisma.[model].findMany(...)` directly
- Always include error handling and loading states

### Form Handling
- Use FormData for file uploads (images)
- Validation via Zod schemas (e.g., `createPostSchema` in post routes)
- Return structured errors: `{ error: string, field?: string }`

### URL Patterns
- Posts: `/posts/[id]`
- Forums: `/forums/[slug]`
- Threads: `/threads/[id]`
- User profiles: `/u/[username]`
- Search: `/search?q={query}&category={id}&sort={newest|hottest|boosted}`
- Admin pages: `/admin/[section]` (users, posts, settings, categories, forums)

## Documentation Files
- `QUICKSTART.md`: Commands reference and access URLs
- `STATUS.md`: Current working features and URLs
- `IMPLEMENTATION.md`: Complete feature checklist
- `FORUM_FEATURES.md`: Forum system API reference
- `CATEGORIES_IMPLEMENTATION.md`: Category/subcategory system with 8 main categories
- Test READMEs: `__tests__/{auth,posts}/README.md`

## Common Pitfalls
- **Image uploads**: Must use FormData, not JSON, with file fields named `image-{index}`
- **MinIO port**: Internal 9000, external 9009 - use correct port in env vars
- **Prisma Client**: Run `npx prisma generate` after schema changes
- **NextAuth callbacks**: Must extend session/token in `lib/auth.ts` for custom fields
- **Moderation**: Check both `isModerator` and `isAdmin` flags for permissions
- **Post limits**: Always call `canUserCreatePost()` before allowing post creation

## When Adding Features
1. Check existing patterns in `app/api/` for similar functionality
2. Update Prisma schema if new data models needed
3. Add translations to both `messages/en.json` and `messages/bg.json`
4. Consider admin access requirements and add middleware protection
5. Write tests in `__tests__/` directory matching feature area
6. Document complex features in markdown files (follow existing pattern)
