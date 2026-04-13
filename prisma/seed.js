import { PrismaClient } from "../app/generated/prisma/client.js";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    // Read the JSON backup file
    const jsonPath = path.join(process.cwd(), 'products-backup.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const backup = JSON.parse(jsonData);

    console.log(`Found ${backup.totalProducts} products in backup file`);
    console.log(`Backup date: ${backup.exportDate}`);

    // First, seed categories (if they exist in your backup)
    const categories = [
      { id: 1, name: 'Drip Pipes' },
      { id: 2, name: 'Micro Tubes' },
      { id: 3, name: 'Drip Fittings' },
      { id: 4, name: 'PVC Fittings' },
      { id: 5, name: 'Thinners and Cleaners' },
      { id: 6, name: 'PVC Solvents' },
      { id: 7, name: 'Nursery Covers' },
      { id: 8, name: 'Rain Pipes' },
      { id: 9, name: 'Cleaning Solutions' },
    ];

    console.log('Seeding categories...');
    const categoryResult = await prisma.category.createMany({
      data: categories,
      skipDuplicates: true,
    });
    console.log(`Categories seeded: ${categoryResult.count} created`);

    // Prepare products data from JSON
    // Remove relations (category, orderItems) and convert dates
    const productsToSeed = backup.products.map(product => {
      const { category, orderItems, ...productData } = product;
      
      return {
        ...productData,
        createdAt: new Date(productData.createdAt),
        updatedAt: new Date(productData.updatedAt),
      };
    });

    console.log('Seeding products...');
    const productResult = await prisma.product.createMany({
      data: productsToSeed,
      skipDuplicates: true,
    });

    console.log(`✅ Products seeded: ${productResult.count} created`);
    console.log(`✅ Total products in database: ${backup.totalProducts}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });