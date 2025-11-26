# Authentication System - Debug Summary & Fixes

## Issues Identified

### 1. Database Connection Error ❌
**Problem**: The application was using incorrect PostgreSQL credentials
- `.env` had `DATABASE_URL="postgresql://boyan@localhost:5432/godknife"`
- Docker container uses `godknife:godknife_password` credentials

**Fix**: Updated `.env` and `.env.example` with correct credentials:
```
DATABASE_URL="postgresql://godknife:godknife_password@localhost:5432/godknife"
```

### 2. Database Schema Not Synced ❌
**Problem**: Prisma schema was not applied to the database

**Fix**: Ran `npx prisma db push` to sync the schema with the database

### 3. Missing Test Suite ❌
**Problem**: No automated tests to verify authentication functionality

**Fix**: Created comprehensive test suite covering all authentication flows

## What Was Fixed

### ✅ Database Configuration
- Updated DATABASE_URL in `.env` to use Docker container credentials
- Updated `.env.example` template
- Verified database connection with Prisma

### ✅ Authentication System
The authentication system was actually working correctly once the database connection was fixed. The following components are functioning:

1. **User Registration** (`/api/auth/register`)
   - Email and password validation
   - Password hashing with bcrypt
   - Duplicate email/username prevention
   - Automatic field defaults (isAdmin: false, postCredits: 0)

2. **Credentials Login** (`/auth/signin`)
   - Email/password authentication
   - Password verification
   - JWT session management

3. **Social Login** (Google, Facebook)
   - OAuth flow with NextAuth.js
   - PrismaAdapter for account creation
   - Automatic username generation for OAuth users
   - Support for linking multiple OAuth accounts

4. **Username Generation**
   - Automatic generation from user's name
   - Unique username verification
   - Fallback to numbered variants (e.g., johndoe1234)
   - Handles special characters and long names

## Test Suite

Created comprehensive tests in `__tests__/auth/`:

### Test Coverage (18 tests, all passing ✅)

#### Registration Tests (4 tests)
- ✅ Register new user with valid data
- ✅ Prevent duplicate email registration
- ✅ Prevent duplicate username registration
- ✅ Set default values for new users

#### Credentials Login Tests (4 tests)
- ✅ Authenticate with correct credentials
- ✅ Reject wrong password
- ✅ Handle non-existent email
- ✅ Prevent login for OAuth-only users

#### Social Login Tests (5 tests)
- ✅ Create user and account on first OAuth login
- ✅ Link multiple OAuth accounts to same user
- ✅ Auto-generate username for OAuth users
- ✅ Handle existing OAuth account login
- ✅ Support Google and Facebook providers

#### Username Generation Tests (5 tests)
- ✅ Generate username from full name
- ✅ Generate unique username when base is taken
- ✅ Handle special characters in names
- ✅ Handle very long names (truncate to 15 chars)
- ✅ Handle empty/null names (default to 'user')

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test registration.test.ts
```

## Authentication Configuration

### Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://godknife:godknife_password@localhost:5432/godknife"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Email (optional)
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
EMAIL_FROM="noreply@example.com"
```

### NextAuth Configuration (`lib/auth.ts`)

Key features:
- `trustHost: true` - Fixes UntrustedHost error
- `PrismaAdapter` - Handles database operations
- Multiple providers: Google, Facebook, Email, Credentials
- Automatic username generation in `signIn` callback
- JWT session strategy for Credentials provider
- Custom session callback to include user data

## Debug Tools

### Debug Script
Created `scripts/debug-auth.ts` to verify authentication setup:

```bash
npx tsx scripts/debug-auth.ts
```

This script tests:
1. Database connection
2. Users table existence
3. Test user creation
4. Password verification
5. User lookup
6. Accounts table check

## How Social Login Works

1. **User clicks "Sign in with Google/Facebook"**
   - NextAuth redirects to OAuth provider
   - User authenticates on provider's site
   - Provider redirects back with authorization code

2. **NextAuth processes the OAuth callback**
   - Exchanges code for access token
   - Retrieves user profile from provider
   - PrismaAdapter checks if user exists

3. **PrismaAdapter creates/updates records**
   - Creates User record (if new user)
   - Creates Account record linking User to OAuth provider
   - Links Account to existing User (if user exists)

4. **Username generation (signIn callback)**
   - Checks if user has a username
   - Generates username from name if missing
   - Ensures uniqueness with random numbers if needed

5. **Session creation**
   - Creates JWT token with user ID
   - Includes admin status and post credits
   - Returns session to client

## Verification Steps

To verify everything is working:

1. **Start Docker containers**:
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**:
   ```bash
   npx prisma db push
   ```

3. **Run authentication tests**:
   ```bash
   npm test
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Test authentication flows**:
   - Register new user: http://localhost:3000/auth/register
   - Sign in: http://localhost:3000/auth/signin
   - Test OAuth: Click "Sign in with Google/Facebook"

## Common Issues & Solutions

### Issue: "Authentication failed against database server"
**Solution**: Check DATABASE_URL has correct credentials from docker-compose.yml

### Issue: "Nodemailer requires a server configuration"
**Solution**: EmailProvider is optional. If not using email auth, the error shouldn't affect other auth methods. Added conditional check in auth.ts.

### Issue: "UntrustedHost" error
**Solution**: Added `trustHost: true` to NextAuth config

### Issue: Social login creates user but no username
**Solution**: Username is auto-generated in the `signIn` callback. The first OAuth login will create the username automatically.

### Issue: Tests fail with duplicate emails
**Solution**: Tests now properly clean up data in beforeEach/afterEach hooks

## Next Steps

The authentication system is now fully functional. Consider:

1. **Email verification flow** - Implement email verification for registered users
2. **Password reset** - Add forgot password functionality
3. **Two-factor authentication** - Add 2FA support
4. **Account linking UI** - Allow users to link/unlink OAuth accounts
5. **Session management** - Add ability to view/revoke active sessions
6. **Rate limiting** - Add rate limiting to login endpoints
7. **Audit logging** - Log authentication events for security

## Files Modified/Created

### Modified
- `.env` - Updated DATABASE_URL
- `.env.example` - Updated with correct credentials
- `lib/auth.ts` - Added trustHost: true
- `package.json` - Added test scripts and Jest dependencies

### Created
- `__tests__/auth/registration.test.ts` - Registration tests
- `__tests__/auth/credentials-login.test.ts` - Login tests
- `__tests__/auth/social-login.test.ts` - OAuth tests
- `__tests__/auth/username-generation.test.ts` - Username generation tests
- `__tests__/auth/README.md` - Test documentation
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup file
- `scripts/debug-auth.ts` - Authentication debug script
- `AUTHENTICATION_DEBUG.md` - This file

## Test Results

```
Test Suites: 4 passed, 4 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        3.01 s
```

All authentication flows are working correctly! ✅
