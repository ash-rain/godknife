import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Forum data with bilingual support
const forums = [
    {
        name: 'Обща дискусия | General Discussion',
        slug: 'general-discussion',
        description: 'Говорете за всичко свързано с ножове, занаяти и общността | Talk about anything related to knives, craftsmanship, and the community',
        icon: '💬',
        color: '#3B82F6',
        order: 1,
    },
    {
        name: 'Изработка на ножове и техники | Knife Making & Techniques',
        slug: 'knife-making-techniques',
        description: 'Споделете знанията си за коване, шлайфане, термична обработка и други техники за изработка на ножове | Share your knowledge about forging, grinding, heat treatment, and other knife making techniques',
        icon: '🔨',
        color: '#EF4444',
        order: 2,
    },
    {
        name: 'Материали и консумативи | Materials & Supplies',
        slug: 'materials-supplies',
        description: 'Обсъждайте типове стомана, материали за дръжки, инструменти и къде да намерите качествени материали | Discuss steel types, handle materials, tools, and where to source quality supplies',
        icon: '⚗️',
        color: '#8B5CF6',
        order: 3,
    },
    {
        name: 'Покажете работата си | Show Your Work',
        slug: 'show-your-work',
        description: 'Покажете готовите си ножове и текущи проекти. Получете обратна връзка от общността | Showcase your finished knives and works in progress. Get feedback from the community',
        icon: '✨',
        color: '#10B981',
        order: 4,
    },
    {
        name: 'Заточване и поддръжка | Sharpening & Maintenance',
        slug: 'sharpening-maintenance',
        description: 'Съвети и техники за поддържане на ножовете ви в перфектно състояние | Tips and techniques for keeping your knives in perfect condition',
        icon: '🪨',
        color: '#F59E0B',
        order: 5,
    },
    {
        name: 'Дискусии за пазара | Marketplace Discussion',
        slug: 'marketplace-discussion',
        description: 'Въпроси относно покупка, продажба, доставка и политики на пазара | Questions about buying, selling, shipping, and marketplace policies',
        icon: '🏪',
        color: '#06B6D4',
        order: 6,
    },
    {
        name: 'Ревюта на инструменти и оборудване | Tool & Equipment Reviews',
        slug: 'tool-equipment-reviews',
        description: 'Споделете опита си с шмиргели, пещи, термични печки и друго оборудване | Share your experiences with grinders, forges, heat treating ovens, and other equipment',
        icon: '🛠️',
        color: '#EC4899',
        order: 7,
    },
    {
        name: 'Традиционни и исторически ножове | Traditional & Historical Knives',
        slug: 'traditional-historical',
        description: 'Обсъдете традиционни стилове ножове, исторически техники и културно наследство на острието | Discuss traditional knife styles, historical techniques, and cultural blade heritage',
        icon: '📜',
        color: '#84CC16',
        order: 8,
    },
]

async function main() {
    console.log('🌱 Starting forum seeding...')

    try {
        // Check if forums already exist
        const existingForums = await prisma.forum.findMany()

        if (existingForums.length > 0) {
            console.log(`⚠️  Found ${existingForums.length} existing forums`)
            console.log('   You can delete them first if you want to reseed')
            console.log('   Run: npx prisma studio and delete from Forum table')

            // Ask user or just update existing forums
            console.log('   Updating existing forums...')

            for (const forum of forums) {
                await prisma.forum.upsert({
                    where: { slug: forum.slug },
                    update: {
                        name: forum.name,
                        description: forum.description,
                        icon: forum.icon,
                        color: forum.color,
                        order: forum.order,
                        isActive: true,
                    },
                    create: forum,
                })
                console.log(`   ✓ ${forum.name}`)
            }

            console.log('✅ Forums updated successfully!')
        } else {
            // Create new forums
            for (const forum of forums) {
                await prisma.forum.create({
                    data: forum,
                })
                console.log(`   ✓ Created: ${forum.name}`)
            }

            console.log('✅ Forums created successfully!')
        }

        // Display summary
        const allForums = await prisma.forum.findMany({
            orderBy: { order: 'asc' },
        })

        console.log('\n📊 Forum Summary:')
        console.log('─'.repeat(80))
        allForums.forEach((forum) => {
            console.log(`${forum.icon}  ${forum.name} (${forum.slug})`)
            console.log(`   ${forum.description}`)
            console.log(`   Color: ${forum.color} | Order: ${forum.order}`)
            console.log()
        })

    } catch (error) {
        console.error('❌ Error seeding forums:', error)
        throw error
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
