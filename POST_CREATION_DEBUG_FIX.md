# Post Creation Debug & Fix Summary

## Issues Found and Fixed

### 1. Critical Bug: useState Instead of useEffect
**Problem:** `PostCreateModal.tsx` was using `useState(() => {})` instead of `useEffect(() => {})` to fetch categories on component mount.
**Fix:** 
- Added `useEffect` to imports
- Changed `useState(() => { fetchCategories() })` to `useEffect(() => { fetchCategories() }, [])`
**Impact:** This would cause categories to never load, preventing users from selecting categories when creating posts.

### 2. Enhanced Error Logging
**Added comprehensive logging to help diagnose issues:**

#### Server-side (`app/api/posts/route.ts`):
- User ID and post permissions check
- Post data being processed
- Image processing progress (per image, per size variant)
- MinIO bucket initialization status
- Success confirmation with post ID
- Detailed error messages with stack traces

#### Client-side (`components/PostCreateModal.tsx`):
- Form data being submitted
- Number and details of images being uploaded
- Request/response logging
- Error details

## How to Test

1. **Open browser console** (F12) to see client-side logs
2. **Watch terminal** where `npm run dev` is running for server-side logs
3. **Create a new post**:
   - Click "New Post" button
   - Fill in title and description (required)
   - Select images (at least 1, max 10)
   - Optionally select category and subcategory
   - Toggle "Gallery" if it's not for sale
   - Add price if it's for sale
   - Click "Publish"

## Expected Log Flow

### Client Console:
```
Creating post with data: {title: "...", description: "...", ...}
Images: 3 files
Appending image-0: photo1.jpg 2048576
Appending image-1: photo2.jpg 1843921
Appending image-2: photo3.jpg 2194835
Sending request to /api/posts...
Response status: 201
Response data: {id: "...", title: "...", ...}
Post created successfully!
```

### Server Terminal:
```
Creating post for user: clxxx...
Post data: {title: "...", description: "...", price: undefined, isGallery: true, ...}
Processing 3 images
Initializing MinIO bucket
MinIO bucket ready
Processing image 1/3: photo1.jpg Size: 2048576
Generated filename: 1732849372918-abc123.jpg
Uploading original...
Original uploaded
Uploading thumb version...
Uploading medium version...
Uploading large version...
All versions uploaded for 1732849372918-abc123.jpg
...
All images uploaded: ["1732849372918-abc123.jpg", ...]
Post created successfully: clxxx...
```

## Common Issues to Check

### If categories don't load:
- Check browser console for fetch errors
- Verify `/api/categories` endpoint is working
- Check if categories exist in database: `npx prisma studio`

### If image upload fails:
1. **Check MinIO is running:**
   ```bash
   docker ps | grep minio
   ```
   Should show `godknife-minio` running

2. **Verify MinIO config in `.env`:**
   ```
   MINIO_ENDPOINT="localhost"
   MINIO_PORT=9009
   MINIO_USE_SSL=false
   ```

3. **Check file size:** Max 5MB per image (adjust if needed)

4. **Check image format:** Should be image/* (jpg, png, etc.)

### If "user cannot create post" error:
- Check post limits in `lib/post-limits.ts`
- Free users: 1 post per week
- Paid users: based on `postCredits` field
- Check user credits: `npx prisma studio` → Users table

### If validation errors:
- Title: min 3 chars, max 200 chars
- Description: min 10 chars
- Images: min 1, max 10
- Price: valid number if provided

## Files Modified

1. `components/PostCreateModal.tsx`:
   - Fixed useEffect bug (critical)
   - Added client-side logging

2. `app/api/posts/route.ts`:
   - Added comprehensive server-side logging
   - Enhanced error messages with details

## Next Steps

1. The dev server should auto-reload with these changes
2. Try creating a post and watch the logs
3. If errors occur, the detailed logs will show exactly where it fails
4. Share the error logs for further diagnosis if needed

## Additional Debug Commands

```bash
# Check MinIO bucket
curl http://localhost:9009/godknife-images/

# List Docker containers
docker ps

# View MinIO logs
docker logs godknife-minio

# Access MinIO console
# URL: http://localhost:9001
# User: godknife
# Pass: godknife_password
```
