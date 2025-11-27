# Production Environment Variables Setup

## Critical Environment Variables for Admin Access

To ensure the admin panel works correctly in production, you **must** set these environment variables:

### Required Variables

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# Database
DATABASE_URL=your-production-database-url
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use this Node.js command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Important Notes

1. **NEXTAUTH_URL**: Must match your production domain exactly, including protocol (https://)
   - ✅ Correct: `https://godknife.com`
   - ❌ Wrong: `godknife.com` or `http://godknife.com` (if using HTTPS)

2. **NEXTAUTH_SECRET**: Must be the same secret used when the session was created
   - If you change this, all existing sessions will be invalidated
   - Must be at least 32 characters long

3. **Cookie Configuration**: The middleware now automatically handles the correct cookie name for production:
   - Development: `next-auth.session-token`
   - Production (HTTPS): `__Secure-next-auth.session-token`

## Deployment Checklist

- [ ] Set `NEXTAUTH_URL` in your hosting platform (Vercel/Netlify/etc.)
- [ ] Set `NEXTAUTH_SECRET` in your hosting platform
- [ ] Ensure your domain is using HTTPS
- [ ] Verify `DATABASE_URL` is set correctly
- [ ] Clear browser cookies and sign in again after deployment
- [ ] Check that `isAdmin` is set to `true` in your database for your user

## Troubleshooting

### Still redirecting after setting environment variables?

1. **Clear your cookies** - Old sessions may be cached
2. **Check your user in the database**:
   ```sql
   SELECT id, email, isAdmin FROM "User" WHERE email = 'your@email.com';
   ```
3. **Verify environment variables are loaded** - Check your hosting platform's dashboard
4. **Check the browser console** for any errors
5. **Sign out and sign in again** to get a fresh session with the admin flag

### Verify Admin Status

Run this in your database:

```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'your@email.com';
```

## Testing Locally Before Production

Test with production-like settings locally:

```bash
# .env.local
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

Then run:
```bash
npm run build
npm start
```
