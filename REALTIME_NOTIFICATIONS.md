# Real-time Messaging & Notifications

This document describes the implementation of real-time messaging notifications with unread conversation counts.

## Features

### 1. Unread Message Counter
- **Badge Display**: Red notification badge on the Messages navigation item showing unread conversation count
- **Badge Limits**: Shows "9+" when there are more than 9 unread conversations
- **Responsive Design**: Works in both desktop and mobile navigation views

### 2. Real-time Updates
- **WebSocket Connection**: Uses Soketi (Pusher-compatible server) for real-time notifications
- **Instant Updates**: Unread count updates immediately when new messages arrive
- **User Channels**: Each user subscribes to their personal notification channel (`user-{userId}`)

## Technical Implementation

### Components

#### Navigation Component (`components/Navigation.tsx`)
- Displays unread conversation count badge
- Fetches initial count on mount
- Subscribes to real-time updates via `useNotifications` hook
- Badge appears on both desktop and mobile views

#### Pusher Hook (`hooks/usePusher.ts`)
- `usePusher()`: Manages Pusher client connection
- `useNotifications()`: Subscribes to user notification channel
- Handles connection lifecycle and error handling

### API Endpoints

#### GET `/api/conversations/unread`
Returns the count of unread conversations for the authenticated user.

**Response:**
```json
{
  "count": 3
}
```

**Logic:**
- Conversations are unread if `lastReadAt` is null or older than `updatedAt`
- Only counts conversations where user is a participant

#### POST `/api/conversations/route.ts`
Enhanced to send real-time notifications to recipients when messages are sent.

#### POST `/api/conversations/[id]/messages/route.ts`
Enhanced to send real-time notifications to recipients when messages are sent in existing conversations.

### Soketi Configuration

#### Docker Compose Setup
```yaml
soketi:
  image: quay.io/soketi/soketi:latest-16-alpine
  container_name: godknife-soketi
  restart: unless-stopped
  ports:
    - "6001:6001"  # WebSocket server
    - "9601:9601"  # Metrics endpoint
  environment:
    SOKETI_DEBUG: "1"
    SOKETI_METRICS_SERVER_PORT: "9601"
    SOKETI_DEFAULT_APP_ID: "godknife-app"
    SOKETI_DEFAULT_APP_KEY: "godknife-key"
    SOKETI_DEFAULT_APP_SECRET: "godknife-secret"
```

#### Environment Variables
```bash
# Server-side Pusher config
PUSHER_APP_ID="godknife-app"
PUSHER_KEY="godknife-key"
PUSHER_SECRET="godknife-secret"
PUSHER_HOST="localhost"
PUSHER_PORT="6001"
PUSHER_USE_TLS="false"

# Client-side Pusher config
NEXT_PUBLIC_PUSHER_KEY="godknife-key"
NEXT_PUBLIC_PUSHER_HOST="localhost"
NEXT_PUBLIC_PUSHER_PORT="6001"
NEXT_PUBLIC_PUSHER_USE_TLS="false"
```

## Event Flow

### New Message Flow
1. User A sends a message to User B
2. API creates message and updates conversation timestamp
3. API triggers two events:
   - `conversation-{conversationId}` → `new-message` (for real-time chat)
   - `user-{recipientId}` → `new-message` (for notification badge)
4. User B's Navigation component receives the event
5. Navigation component refetches unread count
6. Badge updates with new count

### Read Message Flow
1. User opens conversation
2. GET `/api/conversations/[id]/messages` marks conversation as read
3. Updates `lastReadAt` timestamp for participant
4. Next unread count fetch returns decreased count

## Database Schema

### ConversationParticipant
```prisma
model ConversationParticipant {
  id             String       @id @default(cuid())
  conversationId String
  userId         String
  conversation   Conversation @relation(...)
  user           User         @relation(...)
  lastReadAt     DateTime?    // Tracks when user last read messages
  createdAt      DateTime     @default(now())
}
```

The `lastReadAt` field is crucial for determining unread status. It's compared against `Conversation.updatedAt` to identify unread messages.

## Testing

1. Start Docker containers: `docker-compose up -d`
2. Verify Soketi is running: Check logs with `docker logs godknife-soketi`
3. Start dev server: `npm run dev`
4. Open app in two browser sessions (different users)
5. Send message from one user to another
6. Verify badge appears instantly on recipient's navigation

## Deployment Considerations

### Production Environment
- Use TLS for Soketi: Set `PUSHER_USE_TLS="true"`
- Use proper domain for `PUSHER_HOST` (e.g., `soketi.yourdomain.com`)
- Consider using managed Pusher service instead of self-hosted Soketi
- Implement authentication for private channels if needed

### Scaling
- Soketi can be scaled horizontally with Redis adapter
- Consider implementing presence channels for "user is typing" features
- Add connection state indicators in UI
- Implement reconnection logic for unstable connections

## Future Enhancements

- [ ] Show preview of latest unread message
- [ ] Add sound/desktop notifications for new messages
- [ ] Implement "mark all as read" functionality
- [ ] Add typing indicators in conversations
- [ ] Show online/offline status for users
- [ ] Add notification preferences (mute conversations, etc.)
