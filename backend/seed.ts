import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Create merchant
  const merchant = await prisma.merchant.upsert({
    where: { email: 'demo@dukaan.ai' },
    update: {},
    create: {
      businessName: 'Sharma Kirana Store',
      ownerName: 'Rahul Sharma',
      phone: '9876543210',
      email: 'demo@dukaan.ai',
      address: '123, Main Road, Near Bus Stand',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
  });

  // Create user
  await prisma.user.upsert({
    where: { email: 'demo@dukaan.ai' },
    update: {},
    create: {
      fullName: 'Rahul Sharma',
      email: 'demo@dukaan.ai',
      passwordHash,
      merchantId: merchant.id,
      role: 'MERCHANT',
    },
  });

  // Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { merchantId: merchant.id, name: 'Groceries', description: 'Daily grocery items' } }),
    prisma.category.create({ data: { merchantId: merchant.id, name: 'Dairy', description: 'Milk and dairy products' } }),
    prisma.category.create({ data: { merchantId: merchant.id, name: 'Beverages', description: 'Cold drinks and juices' } }),
    prisma.category.create({ data: { merchantId: merchant.id, name: 'Household', description: 'Home care products' } }),
  ]);

  // Products
  const productsData = [
    { name: 'Atta (Wheat Flour)', sku: 'AT-001', price: 35, unit: 'kg', cat: 0, stock: 50, minStock: 10 },
    { name: 'Basmati Rice', sku: 'RC-001', price: 120, unit: 'kg', cat: 0, stock: 30, minStock: 5 },
    { name: 'Sugar', sku: 'SU-001', price: 42, unit: 'kg', cat: 0, stock: 25, minStock: 8 },
    { name: 'Cooking Oil (Mustard)', sku: 'OI-001', price: 180, unit: 'L', cat: 0, stock: 20, minStock: 5 },
    { name: 'Toor Dal', sku: 'DL-001', price: 95, unit: 'kg', cat: 0, stock: 15, minStock: 5 },
    { name: 'Milk (Pouch)', sku: 'ML-001', price: 28, unit: 'piece', cat: 1, stock: 40, minStock: 15 },
    { name: 'Curd (500g)', sku: 'CD-001', price: 35, unit: 'piece', cat: 1, stock: 20, minStock: 8 },
    { name: 'Butter (100g)', sku: 'BT-001', price: 55, unit: 'piece', cat: 1, stock: 12, minStock: 5 },
    { name: 'Panner (200g)', sku: 'PN-001', price: 85, unit: 'piece', cat: 1, stock: 10, minStock: 3 },
    { name: 'Coca Cola (750ml)', sku: 'CC-001', price: 40, unit: 'piece', cat: 2, stock: 36, minStock: 12 },
    { name: 'Bisleri Water (1L)', sku: 'BW-001', price: 20, unit: 'piece', cat: 2, stock: 48, minStock: 15 },
    { name: 'Detergent Powder (1kg)', sku: 'DT-001', price: 95, unit: 'piece', cat: 3, stock: 18, minStock: 5 },
    { name: 'Dishwash Liquid', sku: 'DW-001', price: 65, unit: 'piece', cat: 3, stock: 14, minStock: 4 },
    { name: 'Toothpaste', sku: 'TP-001', price: 85, unit: 'piece', cat: 3, stock: 22, minStock: 8 },
    { name: 'Biscuits (Parle-G)', sku: 'BC-001', price: 10, unit: 'piece', cat: 0, stock: 60, minStock: 20 },
    { name: 'Tea (Tata Chai)', sku: 'TE-001', price: 120, unit: 'pack', cat: 2, stock: 16, minStock: 5 },
    { name: 'Nescafe Coffee (50g)', sku: 'CF-001', price: 150, unit: 'piece', cat: 2, stock: 10, minStock: 3 },
    { name: 'Maggi Noodles', sku: 'MG-001', price: 14, unit: 'piece', cat: 0, stock: 48, minStock: 15 },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({
        data: {
          merchantId: merchant.id,
          categoryId: categories[p.cat].id,
          productName: p.name,
          sku: p.sku,
          sellingPrice: p.price,
          unit: p.unit,
          inventory: {
            create: {
              currentStock: p.stock,
              minimumStock: p.minStock,
              reorderLevel: p.minStock * 2,
            },
          },
        },
      })
    )
  );

  // Customers
  const customerNames = [
    'Amit Verma', 'Neha Gupta', 'Priya Singh', 'Vijay Kumar', 'Sunita Sharma',
    'Ravi Patel', 'Anita Desai', 'Deepak Joshi', 'Kavita Reddy', 'Suresh Nair',
  ];

  const customers = await Promise.all(
    customerNames.map((name, i) =>
      prisma.customer.create({
        data: {
          merchantId: merchant.id,
          fullName: name,
          phone: `98765${String(43210 + i).padStart(5, '0')}`,
          preferredLanguage: i % 3 === 0 ? 'Hindi' : i % 3 === 1 ? 'Hinglish' : 'English',
          totalOrders: Math.floor(Math.random() * 15) + 1,
          outstandingAmount: Math.random() * 2000,
          lastOrderDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      })
    )
  );

  // Conversations & Messages
  for (let i = 0; i < 5; i++) {
    const customer = customers[i];
    const conversation = await prisma.conversation.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        status: 'ACTIVE',
        unreadCount: i < 2 ? 2 : 0,
      },
    });

    const msgs = [
      { type: 'CUSTOMER' as const, content: [
        '2kg atta bhej dena',
        'Mujhe 1 litre doodh chahiye',
        'Kal ka bill bhej do',
        'Medicine available hai?',
        'Maggi aur oil chahiye',
      ][i] },
      { type: 'AI' as const, content: '📋 Order detected and processed' },
      { type: 'MERCHANT' as const, content: 'Ji, order mil gaya. Kal delivery.' },
    ];

    for (const msg of msgs) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: msg.type,
          content: msg.content,
          messageType: 'TEXT',
          aiProcessed: msg.type === 'AI',
        },
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: msgs[msgs.length - 1].content, lastMessageAt: new Date() },
    });
  }

  // Orders
  const orderStatuses = ['DRAFT', 'CONFIRMED', 'PROCESSING', 'DELIVERED'] as const;
  for (let i = 0; i < 10; i++) {
    const customer = customers[i % customers.length];
    const status = orderStatuses[i % orderStatuses.length];
    const product = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 5) + 1;
    const total = product.sellingPrice * qty;

    const order = await prisma.order.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        status,
        subtotal: total,
        total,
        paymentStatus: status === 'DELIVERED' ? 'PAID' : 'PENDING',
        source: 'WHATSAPP',
        createdAt: new Date(Date.now() - i * 4 * 60 * 60 * 1000),
        items: {
          create: {
            productId: product.id,
            quantity: qty,
            unitPrice: product.sellingPrice,
            totalPrice: total,
          },
        },
      },
    });

    if (status === 'DELIVERED') {
      await prisma.payment.create({
        data: {
          merchantId: merchant.id,
          customerId: customer.id,
          orderId: order.id,
          amount: total,
          paymentMethod: 'UPI',
          paymentStatus: 'PAID',
        },
      });
    }
  }

  // AI Insights
  await prisma.aIInsight.createMany({
    data: [
      { merchantId: merchant.id, insightType: 'DAILY_SUMMARY', title: 'Today\'s Summary', description: '18 orders processed, ₹14,250 revenue, ₹5,300 pending', confidence: 0.95 },
      { merchantId: merchant.id, insightType: 'INVENTORY_ALERT', title: 'Low Stock Alert', description: 'Sugar and Atta are below minimum stock levels', confidence: 0.92 },
      { merchantId: merchant.id, insightType: 'RECOMMENDATION', title: 'Payment Reminder', description: '3 customers have overdue payments totaling ₹3,200', confidence: 0.88 },
      { merchantId: merchant.id, insightType: 'CUSTOMER_INSIGHT', title: 'Best Customer', description: 'Amit Verma is your most valuable customer this month', confidence: 0.85 },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { merchantId: merchant.id, title: 'New Order', message: 'New order from Amit Verma', type: 'ORDER' },
      { merchantId: merchant.id, title: 'Payment Received', message: '₹1,200 received from Neha Gupta', type: 'PAYMENT' },
      { merchantId: merchant.id, title: 'Low Stock Alert', message: 'Atta stock is running low', type: 'INVENTORY' },
    ],
  });

  console.log('Seed completed successfully!');
  console.log('Login: demo@dukaan.ai / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
