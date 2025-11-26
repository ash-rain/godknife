# Post Creation System - Debug Summary & Fixes

## Issues Identified

### 1. MinIO Credentials Mismatch ❌
**Problem**: The application was using incorrect MinIO credentials
- `.env` had `MINIO_SECRET_KEY="godknife_minio_password"`
- Docker container uses `MINIO_ROOT_PASSWORD: godknife_password`

**Error Message**:
```
Error [S3Error]: The request signature we calculated does not match 
the signature you provided. Check your key and signing method.
```

**Fix**: Updated `.env` and `.env.example` with correct credentials:
```env
MINIO_ACCESS_KEY="godknife"
MINIO_SECRET_KEY="godknife_password"
```

## What Was Fixed

### ✅ MinIO Configuration
- Updated MINIO_SECRET_KEY in `.env` to match Docker container
- Updated `.env.example` template
- Verified MinIO connection with debug script

### ✅ Post Creation System
The post creation system is fully functional once MinIO credentials were fixed:

1. **Post Creation API** (`/api/posts`)
   - Validates title (3-200 chars), description (10+ chars)
   - Supports up to 10 images
   - Handles gallery posts and pricing
   - Uploads images with multiple sizes to MinIO
   - Creates post record in database
   - Consumes post credit or free post

2. **Post Limits System** (`lib/post-limits.ts`)
   - Free post: 1 per week per user
   - Paid credits: Unlimited posts with purchased credits
   - Priority: Paid credits used before free posts
   - Tracks lastFreePostDate for free post timing

3. **Image Processing**
   - Uploads original image to MinIO
   - Creates resized versions (thumbnail, small, medium, large)
   - Stores in godknife-images bucket
   - Supports public read access

4. **Database Schema**
   - Posts table with all required fields
   - User relationship for author
   - Support for likes, comments, shares
   - Status field (ACTIVE, DELETED)
   - Boost functionality

## Test Suite

Created comprehensive tests in `__tests__/posts/`:

### Test Coverage (25 tests, all passing ✅)

#### Post Creation Tests (10 tests)
- ✅ Create post with valid data
- ✅ Create gallery post with multiple images
- ✅ Create post with price
- ✅ Retrieve posts by author
- ✅ Increment views count
- ✅ Filter active posts only
- ✅ Include like and comment counts
- ✅ Allow short titles at DB level (API validates)
- ✅ Handle empty images array
- ✅ Verify default field values

#### Post Limits Tests (15 tests)

**Free Post Limits (4 tests)**
- ✅ Allow first free post when no lastFreePostDate
- ✅ Allow free post after one week
- ✅ Deny free post within one week
- ✅ Return correct nextFreePostDate

**Paid Post Credits (2 tests)**
- ✅ Allow post with available credits
- ✅ Prioritize paid credits over free posts

**Consuming Credits (4 tests)**
- ✅ Consume paid credit when available
- ✅ Update lastFreePostDate for free posts
- ✅ Not modify lastFreePostDate for paid credits
- ✅ Handle non-existent user error

**Adding Credits (3 tests)**
- ✅ Add credits to user account
- ✅ Increment existing credits
- ✅ Handle bulk credit purchases

**Edge Cases (2 tests)**
- ✅ Handle user not found
- ✅ Handle zero credits correctly

### Running Tests

```bash
# Run all post tests
npm test posts

# Run specific test file
npm test post-creation.test.ts
npm test post-limits.test.ts

# Run all tests
npm test
```

## Post Creation Flow

### 1. User Initiates Post Creation
User fills out form with:
- Title (required, 3-200 chars)
- Description (required, 10+ chars)
- Images (required, 1-10 files)
- Price (optional)
- Is Gallery (optional)

### 2. API Validates Request
```typescript
POST /api/posts
Authorization: Required (session)
Content-Type: multipart/form-data
```

Validations:
- User is authenticated
- User has credits or free post available
- Title meets length requirements
- Description meets length requirements
- At least 1 image provided
- Max 10 images

### 3. Check Post Limits
```typescript
const canPost = await canUserCreatePost(userId)
// Returns: { canPost: boolean, reason?: string, nextFreePostDate?: Date }
```

Logic:
- If user has postCredits > 0: Allow
- Else if lastFreePostDate is null or > 1 week ago: Allow free post
- Else: Deny with nextFreePostDate

### 4. Upload Images to MinIO
For each image:
1. Convert to buffer
2. Generate unique filename with timestamp
3. Upload original image
4. Create and upload resized versions:
   - Thumbnail (150px)
   - Small (300px)
   - Medium (600px)
   - Large (1200px)

### 5. Create Post Record
```typescript
await prisma.post.create({
    data: {
        title,
        description,
        price,
        isGallery,
        images: uploadedFilenames,
        authorId: userId,
    }
})
```

### 6. Consume Post Credit
If user has credits:
- Decrement postCredits by 1

Else (free post):
- Set lastFreePostDate to now

## Debug Tools

### Debug Script
Created `scripts/debug-posts.ts` to verify post creation setup:

```bash
npx tsx scripts/debug-posts.ts
```

This script tests:
1. ✅ Database connection
2. ✅ Posts table existence
3. ✅ MinIO connection
4. ✅ Bucket initialization
5. ✅ User creation
6. ✅ Free post limit check
7. ✅ Credit system
8. ✅ Post creation
9. ✅ Credit consumption
10. ✅ Post retrieval
11. ✅ MinIO image upload
12. ✅ Cleanup

## Environment Configuration

### Required Environment Variables

```env
# MinIO Configuration
MINIO_ENDPOINT="localhost"
MINIO_PORT=9009
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="godknife"
MINIO_SECRET_KEY="godknife_password"
MINIO_BUCKET_NAME="godknife-images"

# Public MinIO URL
NEXT_PUBLIC_MINIO_URL="http://localhost:9009"

# Site Configuration
POSTS_PRICE_EUR=5
POSTS_PER_PURCHASE=5
FREE_POSTS_PER_WEEK=1
```

### Docker Services Required

```bash
# Start all services
docker-compose up -d

# Check status
docker ps
```

Required containers:
- `godknife-postgres` - Database
- `godknife-minio` - Object storage
- `godknife-createbuckets` - Auto-creates bucket

## API Endpoints

### Create Post
```http
POST /api/posts
Authorization: Required
Content-Type: multipart/form-data

Body:
- title: string (3-200 chars)
- description: string (10+ chars)
- price: number (optional)
- isGallery: boolean (optional)
- image-0: File
- image-1: File
...
```

**Responses:**
- 201: Post created successfully
- 401: Unauthorized (not logged in)
- 403: Post limit reached
- 400: Validation error
- 500: Server error

### Get Posts
```http
GET /api/posts?page=1&limit=20&sort=newest&authorId=xxx
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Posts per page (default: 20)
- `sort`: newest | hottest | boosted (default: newest)
- `authorId`: Filter by author (optional)

**Response:**
```json
{
  "posts": [...],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

## Common Issues & Solutions

### Issue: "SignatureDoesNotMatch" when uploading images
**Solution**: 
1. Check MINIO_SECRET_KEY matches docker-compose.yml
2. Should be `godknife_password`, not `godknife_minio_password`
3. Restart app after changing .env

### Issue: "Free post limit reached"
**Solution**: 
- Wait until nextFreePostDate
- Or purchase post credits via payment system
- Or admin can add credits: `await addPostCredits(userId, amount)`

### Issue: Bucket not found
**Solution**:
1. Check docker-compose has createbuckets service
2. Run `docker-compose up -d` to start services
3. Bucket is auto-created on first use by initializeBucket()

### Issue: Images not displaying
**Solution**:
1. Check NEXT_PUBLIC_MINIO_URL in .env
2. Should be `http://localhost:9009`
3. Verify bucket policy allows public read access

### Issue: Post creation works but credits not consumed
**Solution**:
- Check consumePostCredit() is called after post creation
- Verify user ID is correct
- Check database transaction completes

## Testing Checklist

Before deploying, verify:

- [ ] All 25 tests passing (`npm test posts`)
- [ ] Debug script runs successfully (`npx tsx scripts/debug-posts.ts`)
- [ ] MinIO credentials match docker-compose.yml
- [ ] Docker containers running (`docker-compose up -d`)
- [ ] Bucket created and accessible
- [ ] Can create post via API
- [ ] Images upload successfully
- [ ] Credits consumed correctly
- [ ] Free post limits enforced
- [ ] Post retrieval works

## Files Modified/Created

### Modified
- `.env` - Updated MINIO_SECRET_KEY
- `.env.example` - Updated MinIO credentials template

### Created
- `__tests__/posts/post-creation.test.ts` - Post creation tests
- `__tests__/posts/post-limits.test.ts` - Post limits tests
- `__tests__/posts/README.md` - Test documentation
- `scripts/debug-posts.ts` - Post system debug script
- `POST_CREATION_DEBUG.md` - This file

## Next Steps

Post creation is fully functional. Consider:

1. **Image optimization** - Add compression, watermarks
2. **Video support** - Extend to support video posts
3. **Post scheduling** - Allow scheduling posts for future
4. **Post drafts** - Save drafts before publishing
5. **Batch upload** - Upload multiple posts at once
6. **Analytics** - Track post performance metrics
7. **Content moderation** - Add review queue for posts
8. **Rich text editor** - Better description formatting
9. **Post templates** - Reusable post templates
10. **Boost analytics** - Track boost effectiveness

## Test Results

```
Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Time:        2.797 s
```

```
✨ All post creation checks passed!

📊 Summary:
   ✅ Database connection
   ✅ Posts table exists
   ✅ MinIO connection
   ✅ Bucket initialization
   ✅ Post limits system
   ✅ Credit system
   ✅ Post creation
   ✅ MinIO image upload
```

All post creation functionality is working correctly! ✅
