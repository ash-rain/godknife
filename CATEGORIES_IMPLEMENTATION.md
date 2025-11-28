# Post Categories and Search Implementation

## Overview
This document describes the implementation of post categories, subcategories, and search functionality for the GodKnife knife marketplace.

## What Was Implemented

### 1. Database Schema Updates
- **Category Model**: Added with bilingual support (English/Bulgarian)
  - Fields: `nameEn`, `nameBg`, `slug`, `descriptionEn`, `descriptionBg`, `icon`, `order`, `isActive`
  
- **Subcategory Model**: Added with bilingual support
  - Fields: `nameEn`, `nameBg`, `slug`, `descriptionEn`, `descriptionBg`, `categoryId`, `order`, `isActive`
  
- **Post Model**: Updated to include category relationships
  - Added fields: `categoryId`, `subcategoryId`
  - Added relations to `Category` and `Subcategory` models

### 2. Seed Data
Created comprehensive knife categories with subcategories in both English and Bulgarian:

#### Categories:
1. **Kitchen Knives** (9 subcategories: Chef's Knife, Santoku, Paring Knife, etc.)
2. **Hunting Knives** (5 subcategories: Fixed Blade, Folding, Skinning Knife, etc.)
3. **Tactical Knives** (5 subcategories: Combat, Survival, Tanto, Karambit, etc.)
4. **Pocket Knives** (5 subcategories: Multi-Tool, EDC Folder, Traditional, etc.)
5. **Japanese Knives** (6 subcategories: Gyuto, Nakiri, Yanagiba, Deba, etc.)
6. **Specialty Knives** (6 subcategories: Bushcraft, Throwing, Diving, etc.)
7. **Fixed Blade Knives** (4 subcategories: Full Tang, Partial Tang, Neck Knife, etc.)
8. **Collectible & Custom** (5 subcategories: Handmade, Damascus Steel, Art Knives, etc.)

**Seed Script Location**: `/scripts/seed-categories.ts`

### 3. API Endpoints

#### Category Endpoints:
- `GET /api/categories` - Fetch all active categories with subcategories and post counts
- `GET /api/categories/[slug]` - Fetch a specific category by slug

#### Updated Post Endpoints:
- `POST /api/posts` - Now accepts `categoryId` and `subcategoryId`
- `GET /api/posts` - Now supports filtering by:
  - `categoryId` - Filter by category
  - `subcategoryId` - Filter by subcategory
  - `search` - Text search in title and description
  - `sort` - Sort by newest, hottest, or boosted
- `GET /api/posts/[id]` - Now includes category and subcategory information

### 4. User Interface Components

#### HomePage (`/components/HomePage.tsx`)
- **Search Bar in Hero Section**:
  - Category dropdown with all available categories
  - Search input for text queries
  - Integrated search button that redirects to search results page
  - Fully bilingual (English/Bulgarian)

#### Search Results Page (`/app/search/page.tsx`)
- Dedicated search results page at `/search`
- Query parameters:
  - `q` - Search query
  - `category` - Category ID filter
  - `sort` - Sort option (newest, hottest, boosted)
- Displays:
  - Active filters (search query, selected category)
  - Number of results found
  - Sort options (newest, hottest, boosted)
  - Grid of post cards matching the criteria

#### PostCard (`/components/PostCard.tsx`)
- **Category Badges**:
  - Blue badge for main category
  - Gray badge for subcategory
  - Displayed at the top of each post card
  - Bilingual support

#### PostCreateModal (`/components/PostCreateModal.tsx`)
- **Category Selection**:
  - Category dropdown with all available categories
  - Subcategory dropdown (conditionally shown based on selected category)
  - Dynamic subcategory loading
  - Optional fields (posts can be created without categories)

#### Post Detail Page (`/app/posts/[id]/page.tsx`)
- **Category Display**:
  - Category badge (clickable, links to category search)
  - Subcategory badge (read-only)
  - Positioned at the top of post details
  - Bilingual support

### 5. Translations

#### English (`/messages/en.json`)
```json
{
  "post": {
    "category": "Category",
    "subcategory": "Subcategory",
    "selectCategory": "Select a category",
    "selectSubcategory": "Select a subcategory"
  },
  "search": {
    "searchResults": "Search Results",
    "query": "Search",
    "allCategories": "All Categories",
    "searchPlaceholder": "Search for knives...",
    "resultsFound": "results found",
    "noResults": "No results found",
    "tryDifferentSearch": "Try adjusting your search terms or filters"
  }
}
```

#### Bulgarian (`/messages/bg.json`)
All corresponding translations in Bulgarian (Cyrillic).

## How to Use

### Initial Setup

1. **Run Migration** (when database is accessible):
   ```bash
   npx prisma migrate dev --name add_categories_and_subcategories
   ```

2. **Seed Categories**:
   ```bash
   npx tsx scripts/seed-categories.ts
   ```

### For Users

#### Searching for Posts:
1. Visit the homepage
2. Use the search bar in the hero section:
   - Select a category from the dropdown (optional)
   - Enter search terms (optional)
   - Click the search button
3. View and filter results on the search page

#### Creating Posts with Categories:
1. Click "New Post" or "Sell Your Knife"
2. Fill in post details
3. Select a category from the dropdown (optional)
4. If a category is selected, choose a subcategory (optional)
5. Complete the rest of the form and publish

#### Browsing by Category:
1. Click on a category badge on any post card
2. View all posts in that category
3. Use sort options to refine results

### For Developers

#### Adding New Categories:
1. Add to the `categories` array in `/scripts/seed-categories.ts`
2. Run the seed script: `npx tsx scripts/seed-categories.ts`

#### Querying Posts with Categories:
```typescript
const posts = await prisma.post.findMany({
  where: {
    categoryId: 'category-id',
    // OR
    subcategoryId: 'subcategory-id',
  },
  include: {
    category: true,
    subcategory: true,
  },
})
```

## File Structure

```
/app
  /api
    /categories
      route.ts                    # List all categories
      /[slug]
        route.ts                  # Get single category
    /posts
      route.ts                    # Updated with category filtering
      /[id]
        route.ts                  # Updated to include category data
  /search
    page.tsx                      # New search results page
  /posts/[id]
    page.tsx                      # Updated with category display

/components
  HomePage.tsx                    # Updated with search bar
  PostCard.tsx                    # Updated with category badges
  PostCreateModal.tsx             # Updated with category selectors

/prisma
  schema.prisma                   # Updated with Category and Subcategory models

/scripts
  seed-categories.ts              # Seed script for knife categories

/messages
  en.json                         # English translations
  bg.json                         # Bulgarian translations
```

## Features

✅ Bilingual category support (English/Bulgarian)
✅ Hierarchical category structure (Categories → Subcategories)
✅ Search functionality with text and category filters
✅ Category badges on post cards
✅ Category selection in post creation
✅ Category filtering in search results
✅ Dedicated search results page
✅ SEO-friendly category slugs
✅ Active/inactive category management
✅ Post count per category

## Future Enhancements

- Admin panel for managing categories
- Category-specific landing pages
- Popular categories widget
- Recent posts by category
- Category analytics
- Multi-category support per post
- Advanced filters (price range, date range, etc.)

## Notes

- Categories are optional for posts (can be null)
- All category names support both English and Bulgarian
- Category slugs are URL-friendly
- Subcategories are tied to specific parent categories
- Search supports both title and description fields
- Category selection is dynamic (subcategories load based on selected category)
