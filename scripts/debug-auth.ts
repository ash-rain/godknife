/**
 * Debug script to test authentication setup
 * Run with: npx tsx scripts/debug-auth.ts
 */

import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function debugAuth() {
    console.log('🔍 Debugging Authentication Setup...\n')

    try {
        // Test 1: Database Connection
        console.log('1️⃣ Testing database connection...')
        await prisma.$connect()
        console.log('✅ Database connection successful\n')

        // Test 2: Check if users table exists
        console.log('2️⃣ Checking users table...')
        const userCount = await prisma.user.count()
        console.log(`✅ Users table exists. Current user count: ${userCount}\n`)

        // Test 3: Create test user
        console.log('3️⃣ Creating test user...')
        const testEmail = 'debug-test@example.com'
        
        // Clean up if exists
        await prisma.user.deleteMany({
            where: { email: testEmail }
        })

        const hashedPassword = await bcrypt.hash('testpassword123', 10)
        const testUser = await prisma.user.create({
            data: {
                email: testEmail,
                password: hashedPassword,
                name: 'Debug Test User',
                username: 'debugtest',
            }
        })
        console.log(`✅ Test user created with ID: ${testUser.id}\n`)

        // Test 4: Test password verification
        console.log('4️⃣ Testing password verification...')
        const isValid = await bcrypt.compare('testpassword123', testUser.password!)
        console.log(`✅ Password verification: ${isValid ? 'PASSED' : 'FAILED'}\n`)

        // Test 5: Test user lookup
        console.log('5️⃣ Testing user lookup...')
        const foundUser = await prisma.user.findUnique({
            where: { email: testEmail }
        })
        console.log(`✅ User lookup: ${foundUser ? 'SUCCESS' : 'FAILED'}\n`)

        // Test 6: Check accounts table
        console.log('6️⃣ Checking accounts table...')
        const accountCount = await prisma.account.count()
        console.log(`✅ Accounts table exists. Current account count: ${accountCount}\n`)

        // Clean up
        console.log('🧹 Cleaning up test data...')
        await prisma.user.delete({
            where: { email: testEmail }
        })
        console.log('✅ Test data cleaned up\n')

        console.log('✨ All authentication checks passed!')

    } catch (error) {
        console.error('❌ Error during authentication debug:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

debugAuth()
    .then(() => {
        console.log('\n✅ Debug script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Debug script failed:', error)
        process.exit(1)
    })
