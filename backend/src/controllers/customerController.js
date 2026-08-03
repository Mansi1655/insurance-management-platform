const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const registerCustomer = async (req, res) => {
  try {
    const { name, email, dob, phone, address, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingCust = await prisma.customer.findUnique({ where: { email } });

    if (existingUser || existingCust) {
      return res.status(400).json({ error: 'A customer or user with this email already exists' });
    }

    // Default password if not provided by Agent
    const defaultPassword = password || 'Customer123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const customer = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CUSTOMER'
        }
      });

      return await tx.customer.create({
        data: {
          userId: newUser.id,
          name,
          email,
          dob: dob || '',
          phone: phone || '',
          address: address || ''
        }
      });
    });

    res.status(201).json({
      message: 'Customer registered successfully',
      customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        policies: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    const total = await prisma.customer.count({ where });

    res.json({
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        policies: {
          include: {
            claims: true,
            payments: true
          }
        },
        documents: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dob, phone, address } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.update({
        where: { id: parseInt(id) },
        data: { name, dob, phone, address }
      });

      if (cust.userId) {
        await tx.user.update({
          where: { id: cust.userId },
          data: { name }
        });
      }
      return cust;
    });

    res.json({
      message: 'Customer profile updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomerHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        policies: {
          include: {
            claims: true,
            payments: true
          }
        },
        documents: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Assemble events chronologically
    const events = [];

    // Customer creation
    events.push({
      type: 'REGISTRATION',
      date: customer.createdAt,
      description: `Customer account registered for ${customer.name}`
    });

    // Policies
    customer.policies.forEach(p => {
      events.push({
        type: 'POLICY_START',
        date: new Date(p.startDate),
        description: `Policy ${p.policyNumber} (${p.policyType}) created with premium $${p.premiumAmount}`
      });

      if (p.status === 'CANCELLED') {
        events.push({
          type: 'POLICY_CANCEL',
          date: new Date(), // Approximate
          description: `Policy ${p.policyNumber} was cancelled`
        });
      }

      // Payments
      p.payments.forEach(pay => {
        if (pay.paymentStatus === 'PAID') {
          events.push({
            type: 'PAYMENT_RECEIVED',
            date: new Date(pay.paymentDate),
            description: `Premium payment of $${pay.amount} received for Policy ${p.policyNumber}`
          });
        } else if (pay.paymentStatus === 'OVERDUE') {
          events.push({
            type: 'PAYMENT_OVERDUE',
            date: new Date(pay.dueDate),
            description: `Premium payment of $${pay.amount} overdue for Policy ${p.policyNumber}`
          });
        }
      });

      // Claims
      p.claims.forEach(c => {
        events.push({
          type: 'CLAIM_SUBMISSION',
          date: new Date(c.submissionDate),
          description: `Claim submitted for $${c.claimAmount} under Policy ${p.policyNumber}. Status: ${c.status}`
        });
      });
    });

    // Documents
    customer.documents.forEach(d => {
      events.push({
        type: 'DOCUMENT_UPLOAD',
        date: d.uploadedAt,
        description: `Document "${d.fileName}" uploaded`
      });
    });

    // Sort events by date descending
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerHistory
};
