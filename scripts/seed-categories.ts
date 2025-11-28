import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Knife categories with subcategories in English and Bulgarian
const categories = [
    {
        nameEn: 'Kitchen Knives',
        nameBg: 'Кухненски ножове',
        slug: 'kitchen-knives',
        descriptionEn: 'Professional and everyday kitchen knives',
        descriptionBg: 'Професионални и ежедневни кухненски ножове',
        icon: '🔪',
        order: 1,
        subcategories: [
            { nameEn: "Chef's Knife", nameBg: 'Готвачки нож', slug: 'chefs-knife', order: 1 },
            { nameEn: 'Santoku', nameBg: 'Сантоку', slug: 'santoku', order: 2 },
            { nameEn: 'Paring Knife', nameBg: 'Нож за белене', slug: 'paring-knife', order: 3 },
            { nameEn: 'Bread Knife', nameBg: 'Нож за хляб', slug: 'bread-knife', order: 4 },
            { nameEn: 'Cleaver', nameBg: 'Сатър', slug: 'cleaver', order: 5 },
            { nameEn: 'Utility Knife', nameBg: 'Универсален нож', slug: 'utility-knife', order: 6 },
            { nameEn: 'Boning Knife', nameBg: 'Нож за обезкостяване', slug: 'boning-knife', order: 7 },
            { nameEn: 'Fillet Knife', nameBg: 'Нож за филетиране', slug: 'fillet-knife', order: 8 },
            { nameEn: 'Steak Knife', nameBg: 'Нож за стек', slug: 'steak-knife', order: 9 },
        ],
    },
    {
        nameEn: 'Hunting Knives',
        nameBg: 'Ловни ножове',
        slug: 'hunting-knives',
        descriptionEn: 'Knives designed for hunting and outdoor activities',
        descriptionBg: 'Ножове предназначени за лов и дейности на открито',
        icon: '🦌',
        order: 2,
        subcategories: [
            { nameEn: 'Fixed Blade', nameBg: 'С фиксирано острие', slug: 'fixed-blade-hunting', order: 1 },
            { nameEn: 'Folding Hunting Knife', nameBg: 'Сгъваем ловен нож', slug: 'folding-hunting', order: 2 },
            { nameEn: 'Skinning Knife', nameBg: 'Нож за одиране', slug: 'skinning-knife', order: 3 },
            { nameEn: 'Gut Hook Knife', nameBg: 'Нож с кука', slug: 'gut-hook-knife', order: 4 },
            { nameEn: 'Caping Knife', nameBg: 'Нож за обработка', slug: 'caping-knife', order: 5 },
        ],
    },
    {
        nameEn: 'Tactical Knives',
        nameBg: 'Тактически ножове',
        slug: 'tactical-knives',
        descriptionEn: 'Military and tactical knives for professional use',
        descriptionBg: 'Военни и тактически ножове за професионална употреба',
        icon: '⚔️',
        order: 3,
        subcategories: [
            { nameEn: 'Combat Knife', nameBg: 'Боен нож', slug: 'combat-knife', order: 1 },
            { nameEn: 'Survival Knife', nameBg: 'Нож за оцеляване', slug: 'survival-knife', order: 2 },
            { nameEn: 'Tanto', nameBg: 'Танто', slug: 'tanto', order: 3 },
            { nameEn: 'Karambit', nameBg: 'Карамбит', slug: 'karambit', order: 4 },
            { nameEn: 'Push Dagger', nameBg: 'Ритащ кинжал', slug: 'push-dagger', order: 5 },
        ],
    },
    {
        nameEn: 'Pocket Knives',
        nameBg: 'Джобни ножове',
        slug: 'pocket-knives',
        descriptionEn: 'Everyday carry and folding pocket knives',
        descriptionBg: 'Ежедневни и сгъваеми джобни ножове',
        icon: '🗡️',
        order: 4,
        subcategories: [
            { nameEn: 'Multi-Tool', nameBg: 'Мултитул', slug: 'multi-tool', order: 1 },
            { nameEn: 'EDC Folder', nameBg: 'EDC сгъваем', slug: 'edc-folder', order: 2 },
            { nameEn: 'Traditional Pocket Knife', nameBg: 'Традиционен джобен нож', slug: 'traditional-pocket', order: 3 },
            { nameEn: 'Automatic Knife', nameBg: 'Автоматичен нож', slug: 'automatic-knife', order: 4 },
            { nameEn: 'Slipjoint', nameBg: 'Слипджойнт', slug: 'slipjoint', order: 5 },
        ],
    },
    {
        nameEn: 'Japanese Knives',
        nameBg: 'Японски ножове',
        slug: 'japanese-knives',
        descriptionEn: 'Traditional Japanese knife styles',
        descriptionBg: 'Традиционни японски ножове',
        icon: '🇯🇵',
        order: 5,
        subcategories: [
            { nameEn: 'Gyuto', nameBg: 'Гюто', slug: 'gyuto', order: 1 },
            { nameEn: 'Nakiri', nameBg: 'Накири', slug: 'nakiri', order: 2 },
            { nameEn: 'Yanagiba', nameBg: 'Янагиба', slug: 'yanagiba', order: 3 },
            { nameEn: 'Deba', nameBg: 'Деба', slug: 'deba', order: 4 },
            { nameEn: 'Petty', nameBg: 'Пети', slug: 'petty', order: 5 },
            { nameEn: 'Usuba', nameBg: 'Усуба', slug: 'usuba', order: 6 },
        ],
    },
    {
        nameEn: 'Specialty Knives',
        nameBg: 'Специализирани ножове',
        slug: 'specialty-knives',
        descriptionEn: 'Specialized knives for specific tasks',
        descriptionBg: 'Специализирани ножове за специфични задачи',
        icon: '✨',
        order: 6,
        subcategories: [
            { nameEn: 'Bushcraft Knife', nameBg: 'Нож за бушкрафт', slug: 'bushcraft-knife', order: 1 },
            { nameEn: 'Throwing Knife', nameBg: 'Нож за хвърляне', slug: 'throwing-knife', order: 2 },
            { nameEn: 'Diving Knife', nameBg: 'Нож за гмуркане', slug: 'diving-knife', order: 3 },
            { nameEn: 'Carving Knife', nameBg: 'Нож за рязане', slug: 'carving-knife', order: 4 },
            { nameEn: 'Cheese Knife', nameBg: 'Нож за сирене', slug: 'cheese-knife', order: 5 },
            { nameEn: 'Oyster Knife', nameBg: 'Нож за стриди', slug: 'oyster-knife', order: 6 },
        ],
    },
    {
        nameEn: 'Fixed Blade Knives',
        nameBg: 'Ножове с фиксирано острие',
        slug: 'fixed-blade-knives',
        descriptionEn: 'Knives with fixed, non-folding blades',
        descriptionBg: 'Ножове с фиксирано, несгъваемо острие',
        icon: '🔪',
        order: 7,
        subcategories: [
            { nameEn: 'Full Tang', nameBg: 'Пълен танг', slug: 'full-tang', order: 1 },
            { nameEn: 'Partial Tang', nameBg: 'Частичен танг', slug: 'partial-tang', order: 2 },
            { nameEn: 'Neck Knife', nameBg: 'Нож за врат', slug: 'neck-knife', order: 3 },
            { nameEn: 'Boot Knife', nameBg: 'Нож за ботуш', slug: 'boot-knife', order: 4 },
        ],
    },
    {
        nameEn: 'Collectible & Custom',
        nameBg: 'Колекционерски и персонализирани',
        slug: 'collectible-custom',
        descriptionEn: 'Custom made and collectible knives',
        descriptionBg: 'Ръчно изработени и колекционерски ножове',
        icon: '💎',
        order: 8,
        subcategories: [
            { nameEn: 'Handmade', nameBg: 'Ръчно изработени', slug: 'handmade', order: 1 },
            { nameEn: 'Damascus Steel', nameBg: 'Дамаска стомана', slug: 'damascus-steel', order: 2 },
            { nameEn: 'Art Knives', nameBg: 'Арт ножове', slug: 'art-knives', order: 3 },
            { nameEn: 'Limited Edition', nameBg: 'Лимитирана серия', slug: 'limited-edition', order: 4 },
            { nameEn: 'Custom Orders', nameBg: 'Персонализирани поръчки', slug: 'custom-orders', order: 5 },
        ],
    },
]

async function seedCategories() {
    console.log('🌱 Starting category seeding...')

    try {
        // Clear existing categories and subcategories
        await prisma.subcategory.deleteMany()
        await prisma.category.deleteMany()
        console.log('✅ Cleared existing categories')

        // Create categories with subcategories
        for (const categoryData of categories) {
            const { subcategories, ...categoryInfo } = categoryData

            const category = await prisma.category.create({
                data: {
                    ...categoryInfo,
                    subcategories: {
                        create: subcategories.map((sub) => ({
                            ...sub,
                            isActive: true,
                        })),
                    },
                },
                include: {
                    subcategories: true,
                },
            })

            console.log(
                `✅ Created category: ${category.nameEn} with ${category.subcategories.length} subcategories`
            )
        }

        console.log('🎉 Category seeding completed successfully!')
    } catch (error) {
        console.error('❌ Error seeding categories:', error)
        throw error
    }
}

// Run the seeding
seedCategories()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
