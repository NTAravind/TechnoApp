const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'app/generated/prisma'));
const prisma = new PrismaClient();

async function main() {
  const subscriptions = await prisma.pushSubscription.findMany({
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
          id: true
        }
      }
    }
  });
  console.log('--- Push Subscriptions ---');
  console.log(JSON.stringify(subscriptions, null, 2));

  const lastOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  });
  console.log('--- Last 5 Orders ---');
  console.log(JSON.stringify(lastOrders.map(o => ({
    id: o.id,
    phone: o.customer.phone,
    customerName: o.customer.name,
    complete: o.complete,
    updatedAt: o.updatedAt
  })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
