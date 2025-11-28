# User Profile System Documentation

## Overview
Complete user profile system with public profiles, edit functionality, and image uploads.

## URL Structure
- **Public Profile**: `/u/[username]` - View any user's public profile
- **Edit Profile**: `/u/[username]/edit` - Edit own profile (authenticated users only)

## Features

### Public Profile Page (`/u/[username]/page.tsx`)
- **Profile Header**:
  - Cover image (gradient background or custom uploaded image)
  - Profile picture (avatar)
  - User information: name, username, bio, location, website
  - Member since date
  - Post count
  - Edit Profile button (only visible to profile owner)

- **Tabbed Content**:
  - **Gallery Tab**: Displays posts where `isGallery = true`
  - **Marketplace Tab**: Displays posts where `isGallery = false` (for sale items)
  - Pagination support (12 posts per page)
  - Empty state messages for each tab

### Edit Profile Page (`/u/[username]/edit/page.tsx`)
- **Authentication Required**: Redirects to signin if not authenticated
- **Authorization Check**: Users can only edit their own profile
- **Editable Fields**:
  - Name
  - Bio (textarea)
  - Location
  - Website (URL)
- **Image Uploads**:
  - Profile image (with camera icon overlay)
  - Cover image (with camera icon overlay)
  - Real-time preview after upload
  - File validation (type and size)
  - Images processed through MinIO with 3 sizes (thumb, medium, large)

## API Routes

### Get User Profile
```
GET /api/users/[username]
```
Returns user profile data including post count.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "username": "string",
  "image": "string",
  "bio": "string",
  "location": "string",
  "website": "string",
  "coverImage": "string",
  "createdAt": "string",
  "_count": {
    "posts": number
  }
}
```

### Update User Profile
```
PUT /api/users/[username]
Content-Type: application/json
```
Updates user profile fields (name, bio, location, website).

**Request Body:**
```json
{
  "name": "string",
  "bio": "string",
  "location": "string",
  "website": "string"
}
```

### Get User Posts
```
GET /api/users/[username]/posts?type={gallery|marketplace}&page={number}&limit={number}
```
Fetches user's posts filtered by type with pagination.

**Query Parameters:**
- `type`: 'gallery' (isGallery=true) or 'marketplace' (isGallery=false)
- `page`: Page number (default: 1)
- `limit`: Posts per page (default: 12)

**Response:**
```json
{
  "posts": [...],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

### Upload Profile/Cover Image
```
POST /api/users/[username]/upload-image
Content-Type: multipart/form-data
```
Uploads and processes profile or cover images via MinIO.

**Request Body (FormData):**
- `image`: File (required)
- `type`: 'profile' or 'cover' (required)

**Response:**
```json
{
  "success": true,
  "filename": "string",
  "user": {
    "id": "string",
    "name": "string",
    "username": "string",
    "image": "string",
    "coverImage": "string",
    "bio": "string",
    "location": "string",
    "website": "string"
  }
}
```

## Database Schema
User model fields used:
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  username      String?   @unique
  image         String?
  bio           String?
  location      String?
  website       String?
  coverImage    String?
  createdAt     DateTime  @default(now())
  posts         Post[]
}
```

## Navigation Integration
- Profile link added to:
  - Desktop: Dropdown menu under profile picture
  - Mobile: Menu drawer
- Links use pattern: `/u/[username]`

## User Links Throughout App
Updated existing links to use new `/u/[username]` pattern:
- Post detail pages: Author links
- Comments: User links
- Messages: Conversation participant links

## Image Storage
Images stored in MinIO with 3 variants:
- **thumb**: 150x150 (profile pictures, thumbnails)
- **medium**: 800x800 (profile display, cards)
- **large**: 1920x1920 (cover images, full view)

Naming convention: `{type}-{timestamp}-{random}.jpg`
- Profile: `profile-1234567890-abc123.jpg`
- Cover: `cover-1234567890-xyz789.jpg`

## Translations
Added to `messages/en.json` and `messages/bg.json`:
- `profile.memberSince`
- `profile.joinedOn`
- `profile.noGalleryPosts`
- `profile.noMarketplacePosts`
- `profile.viewProfile`
- `profile.myProfile`
- `profile.uploadProfileImage`
- `profile.uploadCoverImage`
- `profile.updateProfile`
- `profile.profileUpdated`
- `profile.profileImage`
- `profile.coverImage`
- `profile.marketplace`

## Security
- Profile viewing: Public (no authentication required)
- Profile editing: Authenticated users only, can only edit own profile
- Image uploads: Authenticated users only, can only upload to own profile
- File validation: Type checking (images only), size limit (5MB)

## Responsive Design
- Mobile-first approach
- Stacked layout on small screens
- Grid layout for posts adapts to screen size
- Touch-friendly navigation tabs
- Optimized image loading with proper error handling
