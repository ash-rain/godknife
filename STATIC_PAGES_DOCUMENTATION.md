# Static Pages Management System

## Overview

A complete static pages management system has been implemented for the GodKnife platform, allowing administrators to create and manage static content pages with full translation support for English and Bulgarian languages.

## Features Implemented

### 1. Database Schema
- **StaticPage Model**: Added to Prisma schema with the following fields:
  - `id`: Unique identifier
  - `slug`: URL-friendly identifier (unique)
  - `titleEn`: English title
  - `titleBg`: Bulgarian title
  - `contentEn`: English content (supports Markdown)
  - `contentBg`: Bulgarian content (supports Markdown)
  - `isActive`: Toggle for active/inactive status
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

### 2. Admin Interface

#### Pages Management (`/admin/pages`)
- **List View**: Displays all static pages in a table format
  - Shows slug, title (in current language), active status, and last updated date
  - Edit and delete actions for each page
- **Create/Edit Form**: Modal dialog with fields for:
  - Slug (read-only when editing)
  - Title (English and Bulgarian)
  - Content (English and Bulgarian) - textarea with Markdown support
  - Active status checkbox
- **Navigation**: Added "Pages" link to admin sidebar with FileCode icon

### 3. API Endpoints

#### Admin API Routes (Protected)
- `GET /api/admin/pages` - List all pages
- `POST /api/admin/pages` - Create new page
- `GET /api/admin/pages/[id]` - Get single page by ID
- `PUT /api/admin/pages/[id]` - Update page
- `DELETE /api/admin/pages/[id]` - Delete page

#### Public API Routes
- `GET /api/pages/[slug]` - Get active page by slug (public access)

### 4. Public Pages

#### Terms of Service (`/terms`)
- Fetches content from database if available
- Falls back to translation file if not found
- Displays content with Markdown rendering
- Full navigation and footer layout

#### Privacy Policy (`/privacy`)
- Same features as Terms page
- Dedicated route and content

### 5. Homepage Hero Section
- Dynamic hero section on homepage
- Fetches content from 'hero' slug in database
- Falls back to translation keys if not found
- Features:
  - Large title
  - Subtitle/description
  - Call-to-action buttons
  - Responsive design with gradient background

### 6. Translations

#### Added Translation Keys (en.json & bg.json)
- `admin.pages`: "Pages"
- `pages.managePages`: "Manage Pages"
- `pages.createPage`: "Create Page"
- `pages.editPage`: "Edit Page"
- `pages.slug`: "Slug"
- `pages.titleEn`: "Title (English)"
- `pages.titleBg`: "Title (Bulgarian)"
- `pages.contentEn`: "Content (English)"
- `pages.contentBg`: "Content (Bulgarian)"
- `pages.isActive`: "Active"
- `pages.lastUpdated`: "Last Updated"
- `pages.actions`: "Actions"
- `pages.saveChanges`: "Save Changes"
- `pages.hero.*`: Hero section content
- `pages.terms.*`: Terms of service content
- `pages.privacy.*`: Privacy policy content

### 7. Seeded Content

Created seed script (`scripts/seed-pages.ts`) that populates:
1. **Hero Section** - Homepage hero content in both languages
2. **Terms of Service** - Complete terms document in both languages
3. **Privacy Policy** - Complete privacy document in both languages

## Usage Guide

### For Administrators

#### Creating a New Page
1. Navigate to Admin → Pages
2. Click "Create Page"
3. Fill in the form:
   - Slug: URL-friendly identifier (e.g., "about-us")
   - Titles in both languages
   - Content in both languages (Markdown supported)
   - Set active status
4. Click "Save Changes"

#### Editing a Page
1. Navigate to Admin → Pages
2. Click "Edit" on the desired page
3. Update the fields (slug cannot be changed)
4. Click "Save Changes"

#### Managing Homepage Hero
- Edit the page with slug "hero"
- Title becomes the main headline
- Content becomes the subtitle

### For Developers

#### Accessing Page Content in Components
```typescript
const response = await fetch('/api/pages/[slug]')
const { page } = await response.json()
const title = locale === 'en' ? page.titleEn : page.titleBg
const content = locale === 'en' ? page.contentEn : page.contentBg
```

#### Creating New Static Pages
1. Create a new page in admin with desired slug
2. Create a route file at `app/[slug]/page.tsx`
3. Fetch content using the public API endpoint
4. Render with Markdown support

## Dependencies Added
- `react-markdown`: For rendering Markdown content in pages

## Files Created/Modified

### New Files
- `prisma/migrations/20251127010914_add_static_pages/migration.sql`
- `app/api/admin/pages/route.ts`
- `app/api/admin/pages/[id]/route.ts`
- `app/api/pages/[slug]/route.ts`
- `app/admin/pages/page.tsx`
- `app/terms/page.tsx`
- `app/privacy/page.tsx`
- `scripts/seed-pages.ts`

### Modified Files
- `prisma/schema.prisma` - Added StaticPage model
- `messages/en.json` - Added pages translations
- `messages/bg.json` - Added pages translations
- `app/admin/layout.tsx` - Added Pages navigation link
- `components/LanguageProvider.tsx` - Exported locale property
- `components/HomePage.tsx` - Added hero section with dynamic content

## Technical Notes

### Security
- All admin endpoints are protected with authentication and admin role checks
- Public endpoints only return active pages
- Input validation on all forms

### Internationalization
- Full support for English and Bulgarian
- Content stored separately for each language
- Language-aware rendering throughout the application

### Markdown Support
- Uses `react-markdown` for safe rendering
- Supports standard Markdown syntax
- Styled with Tailwind's prose classes

## Future Enhancements

Potential improvements for the future:
1. Rich text editor for content editing
2. Image upload support in page content
3. Page templates/layouts
4. Version history and rollback
5. Preview mode before publishing
6. SEO metadata fields (meta description, keywords)
7. URL redirect management
8. Page analytics/view counts
