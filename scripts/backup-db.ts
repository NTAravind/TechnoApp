import { PrismaClient } from '../app/generated/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const backupDir = path.join(process.cwd(), 'backup');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const models = [
        'category',
        'product',
        'customer',
        'order',
        'orderItem',
        'partner',
        'pushSubscription',
    ] as const;

    console.log('Starting database backup...');

    for (const model of models) {
        try {
            // @ts-ignore: Dynamic access to prisma models
            const data = await prisma[model].findMany();
            const filePath = path.join(backupDir, `${model}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Backed up ${model} (${data.length} records) to ${filePath}`);
        } catch (error) {
            console.error(`❌ Failed to backup ${model}:`, error);
        }
    }

    console.log('Backup completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
