import prisma from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

interface CSVRow {
  CircleName: string;
  RegionName: string;
  DivisionName: string;
  OfficeName: string;
  Pincode: string;
  OfficeType: string;
  Delivery: string;
  District: string;
  StateName: string;
  Latitude: string;
  Longitude: string;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/"/g, '').trim() || '';
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

async function seedPincodes() {
  console.log('🚀 Starting pincode seed (createMany mode)...');

  try {
    const csvPath = path.join(process.cwd(), 'CSV', 'pincode.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found at:', csvPath);
      return { success: false, error: 'CSV file not found' };
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);

    console.log(`📊 Found ${rows.length} rows in CSV`);

    const uniquePincodes = new Map<string, CSVRow>();
    
    for (const row of rows) {
      const pincode = row.Pincode;
      if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
        if (!uniquePincodes.has(pincode)) {
          uniquePincodes.set(pincode, row);
        }
      }
    }

    console.log(`📍 Found ${uniquePincodes.size} unique valid pincodes`);

    const pincodeData = Array.from(uniquePincodes.values()).map(row => ({
      pincode: row.Pincode,
      regionName: row.RegionName || null,
      divisionName: row.DivisionName || null,
      district: row.District || null,
      stateName: row.StateName || null,
      isDelivery: row.Delivery === 'Delivery',
    }));

    console.log('🗑️ Clearing existing pincodes...');
    await prisma.pincodeDelivery.deleteMany({});
    console.log('✅ Cleared existing pincodes');

    const BATCH_SIZE = 1000;
    let processed = 0;

    for (let i = 0; i < pincodeData.length; i += BATCH_SIZE) {
      const batch = pincodeData.slice(i, i + BATCH_SIZE);
      
      try {
        await prisma.pincodeDelivery.createMany({
          data: batch,
          skipDuplicates: true,
        });
        processed += batch.length;
        console.log(`✅ Inserted ${processed}/${pincodeData.length} pincodes`);
      } catch (batchError) {
        console.error(`Error inserting batch starting at ${i}:`, batchError);
      }
    }

    console.log(`✅ Total inserted: ${processed}`);

    const defaultSettings = await prisma.deliverySettings.findFirst();
    if (!defaultSettings) {
      await prisma.deliverySettings.create({
        data: {
          isActive: true,
          chargeType: 'PERCENTAGE',
          minCharge: 0,
          percentageCharge: 8,
          freeDeliveryAbove: 500,
        },
      });
      console.log('✅ Created default delivery settings');
    } else {
      console.log('ℹ️ Default settings already exist');
    }

    console.log('🎉 Pincode seed completed!');
    return { success: true, total: pincodeData.length, processed };

  } catch (error) {
    console.error('❌ Seed error:', error);
    return { success: false, error: String(error) };
  } finally {
    await prisma.$disconnect();
  }
}

seedPincodes()
  .then(result => {
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
