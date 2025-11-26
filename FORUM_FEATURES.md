# Forum & Moderation Features

## Overview

This document describes the comprehensive Reddit-like forum system with advanced moderation features built into the application.

## Features

### Forum System

#### Forums
- Create and manage multiple forums
- Each forum has:
  - Name and slug (URL-friendly identifier)
  - Description
  - Icon and color customization
  - Order/priority for display
  - Active/inactive status

#### Threads
- Users can create discussion threads within forums
- Thread features:
  - Title and content
  - View counter
  - Pin status (featured at top)
  - Lock status (prevents new comments)
  - Status: ACTIVE, PENDING, FLAGGED, DELETED, LOCKED
  - Author information

#### Comments
- Threaded comments with nested replies
- Comment features:
  - Reply to other comments
  - Status: ACTIVE, PENDING, FLAGGED, DELETED
  - Author information and timestamps

### Moderation Features

#### Thread Moderation
- **Pin/Unpin**: Feature important threads at the top of the forum
- **Lock/Unlock**: Prevent or allow new comments
- **Flag/Unflag**: Mark threads for review
- **Delete/Restore**: Soft delete threads (recoverable)
- **Approve**: Mark pending threads as approved

#### Comment Moderation
- **Flag/Unflag**: Mark comments for review
- **Delete/Restore**: Soft delete comments (recoverable)
- **Approve**: Mark pending comments as approved

#### User Management
- **Ban Users**: 
  - Temporary bans with expiration date
  - Permanent bans
  - Ban reason tracking
  - Prevents posting threads and comments
- **Unban Users**: Lift bans and restore posting privileges
- **User Roles**:
  - Admin: Full access to all features
  - Moderator: Can moderate content but not manage settings
  - Regular User: Can create threads and comment

#### Moderation Logging
- All moderation actions are logged with:
  - Action type
  - Moderator who performed the action
  - Target user
  - Reason (optional)
  - Timestamp
  - Related thread/comment

## API Routes

### Forums

#### GET /api/forums
List all active forums with thread counts.

#### POST /api/forums (Admin only)
Create a new forum.
```json
{
  "name": "General Discussion",
  "slug": "general",
  "description": "A place for general discussions",
  "icon": "💬",
  "color": "#3B82F6",
  "order": 0
}
```

#### GET /api/forums/[slug]
Get a specific forum with threads (paginated).

#### PATCH /api/forums/[slug] (Admin only)
Update forum details.

#### DELETE /api/forums/[slug] (Admin only)
Delete a forum and all its threads.

### Threads

#### GET /api/forums/[slug]/threads
List threads in a forum (paginated, sorted by pinned then date).

#### POST /api/forums/[slug]/threads
Create a new thread in a forum.
```json
{
  "title": "My Thread Title",
  "content": "Thread content goes here"
}
```

#### GET /api/threads/[id]
Get a specific thread with all comments.

#### PATCH /api/threads/[id]
Update a thread (author or moderator only).

#### DELETE /api/threads/[id]
Soft delete a thread (author or moderator only).

### Comments

#### GET /api/threads/[id]/comments
Get all comments for a thread.

#### POST /api/threads/[id]/comments
Add a comment to a thread.
```json
{
  "content": "My comment",
  "parentId": "optional-parent-comment-id"
}
```

### Moderation

#### POST /api/moderation/threads/[id]
Moderate a thread (moderators only).
```json
{
  "action": "pin|unpin|lock|unlock|flag|unflag|approve|delete|restore",
  "reason": "Optional reason"
}
```

#### POST /api/moderation/comments/[id]
Moderate a comment (moderators only).
```json
{
  "action": "flag|unflag|approve|delete|restore",
  "reason": "Optional reason"
}
```

#### POST /api/moderation/users/ban
Ban a user (moderators only).
```json
{
  "userId": "user-id",
  "reason": "Reason for ban",
  "duration": 7, // days, optional
  "isPermanent": false
}
```

#### DELETE /api/moderation/users/ban?userId=user-id
Unban a user (moderators only).

#### GET /api/moderation/logs
Get moderation logs (moderators only, paginated).

## Pages

### User-Facing Pages

- `/forums` - List all forums
- `/forums/[slug]` - View a specific forum with threads
- `/forums/[slug]/new-thread` - Create a new thread
- `/threads/[id]` - View a thread with comments

### Admin Pages

- `/admin/forums` - Manage forums
- `/admin/forums/create` - Create a new forum
- `/admin/forums/[slug]/edit` - Edit a forum
- `/admin/forums/[slug]/threads` - Manage threads in a forum

## Components

### ForumList
Displays a list of forums with their descriptions and latest activity.

### ThreadList
Shows threads in a forum with pinned/locked indicators, view counts, and comment counts.

### ThreadDetail
Complete thread view with:
- Thread content
- Moderation actions (for moderators)
- Nested comments with replies
- Comment form
- Lock/ban status indicators

## Database Schema

### Key Models

**Forum**
- id, name, slug, description, icon, color, order, isActive
- Relations: threads

**Thread**
- id, title, content, forumId, authorId
- isPinned, isLocked, status, views
- Relations: forum, author, comments, moderationLogs

**ThreadComment**
- id, content, threadId, authorId, parentId, status
- Relations: thread, author, parent, replies, moderationLogs

**ModerationLog**
- id, action, reason, moderatorId, targetUserId
- threadId, commentId, postId
- Relations: moderator, targetUser, thread, comment

**UserBan**
- id, userId, bannedById, reason
- expiresAt, isPermanent, isActive
- Relations: user, bannedBy

## Testing

Comprehensive tests are provided in:
- `__tests__/forums/forum-operations.test.ts` - Tests for forum, thread, and comment CRUD operations
- `__tests__/forums/moderation-features.test.ts` - Tests for all moderation features

Run tests with:
```bash
npm test
```

## Permissions

### Regular Users
- View forums and threads
- Create threads
- Comment on threads
- Edit/delete their own content

### Moderators
- All regular user permissions
- Pin/unpin threads
- Lock/unlock threads
- Flag/unflag content
- Delete/restore any content
- Ban/unban users (except admins and moderators)
- View moderation logs

### Admins
- All moderator permissions
- Create/edit/delete forums
- Manage all settings
- Access to admin panel

## Security Features

1. **Authentication Required**: All write operations require authentication
2. **Role-Based Access Control**: Moderation actions check for moderator/admin role
3. **Ban Enforcement**: Banned users cannot create threads or comments
4. **Soft Deletes**: Content is marked as deleted, not physically removed
5. **Audit Trail**: All moderation actions are logged
6. **Protection Against Self-Actions**: Users cannot ban themselves
7. **Protection of Privileged Users**: Moderators and admins cannot be banned

## Future Enhancements

Potential additions:
- User warnings system
- Automatic ban on repeated violations
- Report system for users to flag content
- Email notifications for moderation actions
- Bulk moderation actions
- Custom moderation rules per forum
- Vote/karma system
- Awards and badges
- User profiles with post history
- Search functionality
- Tags/categories for threads
