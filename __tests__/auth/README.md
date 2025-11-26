# Authentication Test Suite

This directory contains comprehensive tests for the authentication system.

## Test Files

- **registration.test.ts**: Tests for user registration
- **credentials-login.test.ts**: Tests for email/password login
- **social-login.test.ts**: Tests for OAuth (Google, Facebook) login
- **username-generation.test.ts**: Tests for automatic username generation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test registration.test.ts
```

## Test Coverage

The test suite covers:
- ✅ User registration with validation
- ✅ Duplicate email/username prevention
- ✅ Password hashing and verification
- ✅ OAuth account creation and linking
- ✅ Automatic username generation
- ✅ Default field values
- ✅ Credentials authentication

## Database Setup

Tests use the same PostgreSQL database configured in `.env`. Make sure Docker containers are running:

```bash
docker-compose up -d
```

## Notes

- Tests automatically clean up created data
- Each test is isolated and can run independently
- Test data uses `test@` email prefix for easy identification
