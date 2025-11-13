// Test script for username generation
// Run with: npx tsx scripts/test-username-generation.ts

// Helper function to generate a unique username (same as in auth.ts)
function generateUsername(name: string | null): string {
    // Create base username from name
    let baseUsername = 'user'
    if (name) {
        // Remove special characters and spaces, convert to lowercase
        baseUsername = name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15) // Limit length
    }

    // If base is empty, use 'user'
    if (!baseUsername) {
        baseUsername = 'user'
    }

    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `${baseUsername}${randomNum}`
}

// Test cases
console.log('Testing username generation:\n')

const testNames = [
    'John Doe',
    'María García',
    'أحمد محمد',
    'Иван Петров',
    '李明',
    'test@user',
    'A',
    null,
    '',
    '!@#$%^&*()',
    'VeryLongNameThatShouldBeTruncated'
]

testNames.forEach(name => {
    const username = generateUsername(name)
    console.log(`Name: "${name}" => Username: "${username}"`)
})

console.log('\n✅ Username generation test complete!')
