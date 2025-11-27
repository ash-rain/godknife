import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding static pages...')

    // Hero section
    await prisma.staticPage.upsert({
        where: { slug: 'hero' },
        update: {},
        create: {
            slug: 'hero',
            titleEn: 'Premium Handmade Knives',
            titleBg: 'Първокласни ръчно изработени ножове',
            contentEn: 'Discover exceptional craftsmanship from master knife makers around the world. Buy, sell, and showcase your finest blades.',
            contentBg: 'Открийте изключително майсторство от майстори на ножове от цял свят. Купувайте, продавайте и представяйте вашите най-фини остриета.',
            isActive: true
        }
    })

    // Terms of Service
    await prisma.staticPage.upsert({
        where: { slug: 'terms' },
        update: {},
        create: {
            slug: 'terms',
            titleEn: 'Terms of Service',
            titleBg: 'Условия заползване',
            contentEn: `# Terms of Service

Last updated: November 27, 2025

## 1. Acceptance of Terms

By accessing and using GodKnife, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License

Permission is granted to temporarily access the materials on GodKnife for personal, non-commercial transitory viewing only.

## 3. User Content

Users are responsible for the content they post. You retain ownership of your content but grant us a license to display it on our platform.

## 4. Prohibited Activities

- Posting illegal content
- Harassing other users
- Attempting to breach security
- Selling counterfeit items

## 5. Termination

We may terminate or suspend access to our service immediately, without prior notice, for conduct that we believe violates these Terms.

## 6. Limitation of Liability

GodKnife shall not be liable for any indirect, incidental, special, consequential or punitive damages.

## 7. Contact Us

If you have any questions about these Terms, please contact us.`,
            contentBg: `# Условия заползване

Последна актуализация: 27 ноември 2025

## 1. Приемане на условията

Като използвате GodKnife, вие приемате и се съгласявате да спазвате условията на това споразумение.

## 2. Лиценз за използване

Разрешава се временен достъп до материалите в GodKnife само за лично, некомерсиално преглеждане.

## 3. Потребителско съдържание

Потребителите носят отговорност за съдържанието, което публикуват. Вие запазвате собствеността върху вашето съдържание, но ни предоставяте лиценз да го показваме на нашата платформа.

## 4. Забранени дейности

- Публикуване на незаконно съдържание
- Тормоз на други потребители
- Опити за нарушаване на сигурността
- Продажба на фалшиви артикули

## 5. Прекратяване

Можем да прекратим или спрем достъпа до нашата услуга незабавно, без предизвестие, за поведение, което нарушава тези Условия.

## 6. Ограничение на отговорността

GodKnife не носи отговорност за непреки, случайни, специални, последващи или наказателни щети.

## 7. Свържете се с нас

Ако имате въпроси относно тези Условия, моля свържете се с нас.`,
            isActive: true
        }
    })

    // Privacy Policy
    await prisma.staticPage.upsert({
        where: { slug: 'privacy' },
        update: {},
        create: {
            slug: 'privacy',
            titleEn: 'Privacy Policy',
            titleBg: 'Политика за поверителност',
            contentEn: `# Privacy Policy

Last updated: November 27, 2025

## 1. Information We Collect

We collect information you provide directly to us, including:
- Name and email address
- Profile information
- Posts and comments
- Payment information

## 2. How We Use Your Information

We use the information we collect to:
- Provide and improve our services
- Process transactions
- Send you updates and marketing communications
- Respond to your comments and questions

## 3. Information Sharing

We do not sell your personal information. We may share your information with:
- Service providers who assist in our operations
- Law enforcement when required by law

## 4. Data Security

We implement appropriate security measures to protect your personal information.

## 5. Your Rights

You have the right to:
- Access your personal data
- Request correction of your data
- Request deletion of your data
- Object to processing of your data

## 6. Cookies

We use cookies to improve your experience on our site.

## 7. Changes to This Policy

We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.

## 8. Contact Us

If you have any questions about this Privacy Policy, please contact us.`,
            contentBg: `# Политика за поверителност

Последна актуализация: 27 ноември 2025

## 1. Информация, която събираме

Събираме информация, която ни предоставяте директно, включително:
- Име и имейл адрес
- Информация за профила
- Публикации и коментари
- Информация за плащане

## 2. Как използваме вашата информация

Използваме събраната информация, за да:
- Предоставяме и подобряваме нашите услуги
- Обработваме транзакции
- Изпращаме ви актуализации и маркетингови съобщения
- Отговаряме на вашите коментари и въпроси

## 3. Споделяне на информация

Ние не продаваме вашата лична информация. Можем да споделим вашата информация с:
- Доставчици на услуги, които подпомагат нашите операции
- Правоприлагащи органи, когато се изисква от закона

## 4. Сигурност на данните

Прилагаме подходящи мерки за сигурност за защита на вашата лична информация.

## 5. Вашите права

Имате право да:
- Достъпвате вашите лични данни
- Поискате корекция на вашите данни
- Поискате изтриване на вашите данни
- Възразите срещу обработката на вашите данни

## 6. Бисквитки

Използваме бисквитки за подобряване на вашето изживяване в нашия сайт.

## 7. Промени в тази политика

Можем да актуализираме тази политика за поверителност от време на време. Ще ви уведомим за всякакви промени, като публикуваме новата политика на тази страница.

## 8. Свържете се с нас

Ако имате въпроси относно тази Политика за поверителност, моля свържете се с нас.`,
            isActive: true
        }
    })

    console.log('Static pages seeded successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
