# Post System Test Suite

This directory contains comprehensive tests for the post creation and management system.

## Test Files

- **post-creation.test.ts**: Tests for creating posts, galleries, and data validation
- **post-limits.test.ts**: Tests for free post limits, paid credits, and timing logic

## Running Tests

```bash
# Run all post tests
npm test posts

# Run specific test file
npm test post-creation.test.ts
npm test post-limits.test.ts

# Run in watch mode
npm run test:watch
```

## Test Coverage

### Post Creation Tests (10 tests)
- ✅ Create post with valid data
- ✅ Create gallery post with multiple images
- ✅ Create post with price
- ✅ Retrieve posts by author
- ✅ Increment views count
- ✅ Filter active posts only
- ✅ Include like and comment counts
- ✅ Enforce title length constraints
- ✅ Handle empty images array
- ✅ Validate post data structure

### Post Limits Tests (13 tests)

#### Free Post Limits (4 tests)
- ✅ Allow first free post
- ✅ Allow free post after one week
- ✅ Deny free post within one week
- ✅ Return correct next free post date

#### Paid Post Credits (2 tests)
- ✅ Allow post with available credits
- ✅ Prioritize paid credits over free posts

#### Consuming Credits (4 tests)
- ✅ Consume paid credit when available
- ✅ Update lastFreePostDate for free posts
- ✅ Not modify lastFreePostDate for paid credits
- ✅ Handle non-existent user error

#### Adding Credits (3 tests)
- ✅ Add credits to user account
- ✅ Increment existing credits
- ✅ Handle bulk credit purchases

## Debug Tools

### Debug Script
Run `npx tsx scripts/debug-posts.ts` to verify the entire post creation setup:

This script tests:
1. Database connection
2. Posts table existence
3. MinIO connection
4. Bucket initialization
5. User creation
6. Free post limits
7. Credit system
8. Post creation
9. Credit consumption
10. Post retrieval
11. MinIO image upload

## Database Setup

Tests use the same PostgreSQL database configured in `.env`. Make sure Docker containers are running:

```bash
docker-compose up -d
```

## MinIO Setup

Post creation requires MinIO for image storage. Ensure credentials match docker-compose.yml:

```env
MINIO_ENDPOINT="localhost"
MINIO_PORT=9009
MINIO_ACCESS_KEY="godknife"
MINIO_SECRET_KEY="godknife_password"
MINIO_BUCKET_NAME="godknife-images"
```

## Post Creation Flow

1. **User Authentication** - User must be authenticated
2. **Check Limits** - Verify user can create post (credits or free post available)
3. **Validate Data** - Validate title, description, images
4. **Initialize Bucket** - Ensure MinIO bucket exists
5. **Upload Images** - Upload original and resized versions to MinIO
6. **Create Post** - Save post to database
7. **Consume Credit** - Deduct credit or update lastFreePostDate

## Common Issues

### Issue: MinIO SignatureDoesNotMatch
**Solution**: Check MINIO_SECRET_KEY matches docker-compose.yml (godknife_password)

### Issue: Free post limit reached
**Solution**: Either wait one week or purchase post credits

### Issue: Image upload fails
**Solution**: Ensure MinIO container is running and credentials are correct

## Notes

- Tests automatically clean up created data
- Each test is isolated and can run independently
- Test data uses 'test-post' prefix for easy identification
- Post limits reset weekly for free posts
