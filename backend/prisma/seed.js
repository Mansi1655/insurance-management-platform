const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing records in correct order to avoid foreign key failures
  await prisma.document.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.premiumPayment.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create hashed passwords
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const agentPassword = await bcrypt.hash('Agent123!', 10);
  const customerPassword = await bcrypt.hash('Customer123!', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Alice Administrator',
      email: 'admin@antigravity.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  const agent = await prisma.user.create({
    data: {
      name: 'Bob Broker',
      email: 'agent@antigravity.com',
      password: agentPassword,
      role: 'AGENT'
    }
  });

  const customerUser = await prisma.user.create({
    data: {
      name: 'Charlie Client',
      email: 'customer@antigravity.com',
      password: customerPassword,
      role: 'CUSTOMER'
    }
  });

  // 2. Create Customer Profile for Charlie
  const customer = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      name: 'Charlie Client',
      email: 'customer@antigravity.com',
      dob: '1990-05-15',
      phone: '+1 (555) 123-4567',
      address: '123 Pine Street, San Francisco, CA 94111'
    }
  });

  // 3. Create another Customer profile who doesn't have a login user yet (registered by agent)
  const customer2 = await prisma.customer.create({
    data: {
      name: 'Diana Daniels',
      email: 'diana@example.com',
      dob: '1985-11-23',
      phone: '+1 (555) 987-6543',
      address: '456 Oak Avenue, New York, NY 10001'
    }
  });

  // 4. Create Policies
  // Policy 1: Active Health Policy for Charlie
  const policy1 = await prisma.policy.create({
    data: {
      customerId: customer.id,
      policyType: 'Health',
      policyNumber: 'POL-100201',
      premiumAmount: 250.00,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      status: 'ACTIVE'
    }
  });

  // Policy 2: Expired Auto Policy for Charlie
  const policy2 = await prisma.policy.create({
    data: {
      customerId: customer.id,
      policyType: 'Auto',
      policyNumber: 'POL-300402',
      premiumAmount: 180.00,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      status: 'EXPIRED'
    }
  });

  // Policy 3: Active Life Policy for Diana
  const policy3 = await prisma.policy.create({
    data: {
      customerId: customer2.id,
      policyType: 'Life',
      policyNumber: 'POL-500603',
      premiumAmount: 500.00,
      startDate: '2026-03-01',
      endDate: '2027-03-01',
      status: 'ACTIVE'
    }
  });

  // Policy 4: Cancelled Home Policy for Diana
  const policy4 = await prisma.policy.create({
    data: {
      customerId: customer2.id,
      policyType: 'Home',
      policyNumber: 'POL-700804',
      premiumAmount: 320.00,
      startDate: '2026-02-01',
      endDate: '2027-02-01',
      status: 'CANCELLED'
    }
  });

  // 5. Create Premium Payments
  // Policy 1 (Health - Active) Payments
  // Paid payment in Jan
  await prisma.premiumPayment.create({
    data: {
      policyId: policy1.id,
      dueDate: '2026-01-15',
      paymentDate: '2026-01-14',
      amount: 250.00,
      paymentStatus: 'PAID'
    }
  });
  // Paid payment in Feb
  await prisma.premiumPayment.create({
    data: {
      policyId: policy1.id,
      dueDate: '2026-02-15',
      paymentDate: '2026-02-15',
      amount: 250.00,
      paymentStatus: 'PAID'
    }
  });
  // Unpaid premium due soon (future)
  await prisma.premiumPayment.create({
    data: {
      policyId: policy1.id,
      dueDate: '2026-09-15',
      amount: 250.00,
      paymentStatus: 'UNPAID'
    }
  });

  // Policy 2 (Auto - Expired) Payments
  // Paid past payments
  await prisma.premiumPayment.create({
    data: {
      policyId: policy2.id,
      dueDate: '2025-01-15',
      paymentDate: '2025-01-15',
      amount: 180.00,
      paymentStatus: 'PAID'
    }
  });

  // Policy 3 (Life - Active) Payments
  // Paid payment in March
  await prisma.premiumPayment.create({
    data: {
      policyId: policy3.id,
      dueDate: '2026-03-15',
      paymentDate: '2026-03-12',
      amount: 500.00,
      paymentStatus: 'PAID'
    }
  });
  // Overdue payment in July (since current date in seed metadata is August 3, 2026)
  await prisma.premiumPayment.create({
    data: {
      policyId: policy3.id,
      dueDate: '2026-07-15',
      amount: 500.00,
      paymentStatus: 'OVERDUE'
    }
  });

  // 6. Create Claims
  // Approved claim for Charlie (Auto Policy)
  await prisma.claim.create({
    data: {
      policyId: policy2.id,
      claimAmount: 1200.00,
      reason: 'Fender bender in shopping center parking lot.',
      status: 'APPROVED',
      submissionDate: '2025-06-12',
      filePath: null
    }
  });

  // Pending claim for Charlie (Health Policy)
  await prisma.claim.create({
    data: {
      policyId: policy1.id,
      claimAmount: 450.00,
      reason: 'Annual medical screening and prescription drugs.',
      status: 'PENDING',
      submissionDate: '2026-08-01',
      filePath: null
    }
  });

  // Rejected claim for Diana (Life Policy)
  await prisma.claim.create({
    data: {
      policyId: policy3.id,
      claimAmount: 5000.00,
      reason: 'Critical illness assessment request.',
      status: 'REJECTED',
      submissionDate: '2026-04-10',
      filePath: null
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
