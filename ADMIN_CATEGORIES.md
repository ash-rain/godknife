# Admin Category Management System

## Overview
A comprehensive CRUD (Create, Read, Update, Delete) admin interface for managing categories and subcategories in the GodKnife knife marketplace.

## Features

### ✅ Complete CRUD Operations
- **Create**: Add new categories with unlimited subcategories
- **Read**: View all categories with post counts and subcategory details
- **Update**: Edit existing categories and their subcategories
- **Delete**: Remove categories (with cascade deletion of subcategories)

### ✅ Category Management
- Bilingual support (English/Bulgarian) for all fields
- SEO-friendly slug generation
- Icon/emoji support for visual categorization
- Custom ordering for display priority
- Active/Inactive status toggle
- Post count tracking per category

### ✅ Subcategory Management
- Unlimited subcategories per category
- Individual active/inactive status per subcategory
- Custom ordering within category
- Bilingual names and slugs
- Inline editing within the parent category

### ✅ User Interface
- Responsive table layout
- Expandable/collapsible subcategory view
- Modal-based creation and editing
- Real-time validation
- Confirmation dialogs for destructive actions
- Loading states and error handling
- Dark mode support

## Access

**URL**: `/admin/categories`

**Requirements**: Admin user authentication

## File Structure

```
/app
  /admin
    /categories
      page.tsx                    # Main admin UI component
    layout.tsx                    # Updated with Categories link
  /api
    /admin
      /categories
        route.ts                  # GET all, POST create
        /[id]
          route.ts                # PUT update, DELETE

/messages
  en.json                         # English translations
  bg.json                         # Bulgarian translations
```

## API Endpoints

### GET `/api/admin/categories`
Fetch all categories with subcategories and post counts (admin only).

**Response**:
```json
{
  "categories": [
    {
      "id": "...",
      "nameEn": "Kitchen Knives",
      "nameBg": "Кухненски ножове",
      "slug": "kitchen-knives",
      "descriptionEn": "...",
      "descriptionBg": "...",
      "icon": "🔪",
      "order": 1,
      "isActive": true,
      "subcategories": [...],
      "_count": {
        "posts": 15
      }
    }
  ]
}
```

### POST `/api/admin/categories`
Create a new category with optional subcategories.

**Request Body**:
```json
{
  "nameEn": "New Category",
  "nameBg": "Нова категория",
  "slug": "new-category",
  "descriptionEn": "Description",
  "descriptionBg": "Описание",
  "icon": "🔪",
  "order": 1,
  "isActive": true,
  "subcategories": [
    {
      "nameEn": "Subcategory 1",
      "nameBg": "Подкатегория 1",
      "slug": "subcategory-1",
      "order": 0,
      "isActive": true
    }
  ]
}
```

**Response**: `201 Created` with category object

### PUT `/api/admin/categories/[id]`
Update an existing category and replace all its subcategories.

**Request Body**: Same as POST

**Response**: `200 OK` with updated category object

### DELETE `/api/admin/categories/[id]`
Delete a category and all its subcategories (cascade).

**Response**: `200 OK` with `{ "success": true }`

**Note**: Posts in deleted categories will have their `categoryId` set to null (not deleted).

## Usage Guide

### Creating a Category

1. Navigate to `/admin/categories`
2. Click "Create Category" button
3. Fill in the form:
   - **Name (English)** - Required
   - **Name (Bulgarian)** - Required
   - **Slug** - Required, URL-friendly identifier
   - **Icon** - Optional emoji
   - **Order** - Display priority (lower = first)
   - **Descriptions** - Optional detailed descriptions
   - **Active** - Enable/disable visibility
4. Add subcategories using "+ Add Subcategory"
5. Click "Create"

### Editing a Category

1. Click the edit icon (✏️) next to any category
2. Modify any fields
3. Add/remove/edit subcategories
4. Click "Update"

**Note**: Editing replaces all subcategories. Ensure all desired subcategories are present in the form.

### Deleting a Category

1. Click the delete icon (🗑️) next to any category
2. Confirm deletion in the dialog
3. Category and all subcategories will be permanently deleted
4. Posts will remain but lose category assignment

### Viewing Subcategories

- Click on the subcategory count badge to expand/collapse
- View all subcategories with their names, slugs, and status
- Subcategories display in a grid layout when expanded

## Form Validation

### Required Fields
- Name (English)
- Name (Bulgarian)
- Slug

### Slug Validation
- Must be unique across all categories
- Should be URL-friendly (lowercase, hyphens)
- Checked on both create and update

### Subcategory Validation
- Each subcategory requires nameEn, nameBg, and slug
- Slugs must be unique within subcategories
- Order can be any number (used for sorting)

## Data Model

### Category
```typescript
{
  id: string
  nameEn: string
  nameBg: string
  slug: string (unique)
  descriptionEn?: string
  descriptionBg?: string
  icon?: string
  order: number
  isActive: boolean
  subcategories: Subcategory[]
  posts: Post[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Subcategory
```typescript
{
  id: string
  nameEn: string
  nameBg: string
  slug: string (unique)
  descriptionEn?: string
  descriptionBg?: string
  categoryId: string
  order: number
  isActive: boolean
  category: Category
  posts: Post[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Security

- All endpoints require admin authentication
- Session validation using NextAuth
- Non-admin users redirected to home page
- Database operations use Prisma for SQL injection protection

## Best Practices

### Slug Naming
- Use lowercase letters
- Use hyphens for spaces: `kitchen-knives`
- Keep it descriptive but concise
- Match the English name when possible

### Ordering
- Use increments of 10 (10, 20, 30) for easy reordering
- Lower numbers appear first
- Categories and subcategories ordered independently

### Icons
- Use single emoji characters
- Choose relevant icons (🔪 for knives, 🇯🇵 for Japanese)
- Optional but enhances visual recognition

### Descriptions
- Keep concise (1-2 sentences)
- Helpful for SEO and category landing pages
- Optional but recommended for main categories

## Troubleshooting

### "Category with this slug already exists"
- Choose a different, unique slug
- Slugs must be unique across all categories

### Cannot delete category
- Check if there are associated posts (shown in count column)
- Currently allows deletion even with posts
- To prevent: Uncomment validation in delete endpoint

### Subcategories not saving
- Ensure all required fields are filled
- Check that subcategory slugs are unique
- Verify no validation errors in console

### Changes not reflecting
- Refresh the page after operations
- Check browser console for errors
- Verify admin authentication

## Future Enhancements

- [ ] Bulk operations (activate/deactivate multiple)
- [ ] Drag-and-drop reordering
- [ ] Category duplication
- [ ] Import/Export categories
- [ ] Category merge functionality
- [ ] Usage analytics per category
- [ ] Automatic slug generation from name
- [ ] Rich text editor for descriptions
- [ ] Category images/thumbnails
- [ ] Search and filter in admin list

## Related Documentation

- See `CATEGORIES_IMPLEMENTATION.md` for frontend implementation
- See `/scripts/seed-categories.ts` for sample data structure
- See Prisma schema for complete data model
