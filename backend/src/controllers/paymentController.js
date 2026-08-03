const prisma = require('../prisma');

const payPremium = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = await prisma.premiumPayment.findUnique({
      where: { id: parseInt(paymentId) },
      include: { policy: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Premium payment record not found' });
    }

    if (payment.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Premium has already been paid' });
    }

    // Perform verification of owner if customer is paying
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (!customer || payment.policy.customerId !== customer.id) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const updatedPayment = await prisma.premiumPayment.update({
      where: { id: parseInt(paymentId) },
      data: {
        paymentStatus: 'PAID',
        paymentDate: todayStr
      }
    });

    res.json({
      message: 'Premium paid successfully (mock processor complete)',
      payment: updatedPayment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPayments = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.paymentStatus = status;
    }

    // Filter by CUSTOMER role
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (customer) {
        where.policy = { customerId: customer.id };
      } else {
        return res.json({ payments: [] });
      }
    }

    const payments = await prisma.premiumPayment.findMany({
      where,
      include: {
        policy: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { paymentStatus: 'desc' }, // unpaid first
        { dueDate: 'asc' }
      ]
    });

    res.json({ payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOverdueAlerts = async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find all unpaid payments that are past due date
    const overduePayments = await prisma.premiumPayment.findMany({
      where: {
        paymentStatus: { in: ['UNPAID', 'OVERDUE'] },
        dueDate: { lt: todayStr }
      },
      include: {
        policy: {
          include: {
            customer: true
          }
        }
      }
    });

    // Update status to OVERDUE in database if not already updated
    const updatePromises = overduePayments
      .filter(p => p.paymentStatus !== 'OVERDUE')
      .map(p => prisma.premiumPayment.update({
        where: { id: p.id },
        data: { paymentStatus: 'OVERDUE' }
      }));
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    // Filter for specific customer if requested
    let filteredAlerts = overduePayments;
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (customer) {
        filteredAlerts = overduePayments.filter(p => p.policy.customerId === customer.id);
      } else {
        filteredAlerts = [];
      }
    }

    res.json({
      alertsCount: filteredAlerts.length,
      alerts: filteredAlerts.map(p => ({
        paymentId: p.id,
        policyNumber: p.policy.policyNumber,
        policyType: p.policy.policyType,
        customerName: p.policy.customer.name,
        customerEmail: p.policy.customer.email,
        dueDate: p.dueDate,
        amount: p.amount,
        daysOverdue: Math.ceil((today - new Date(p.dueDate)) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  payPremium,
  getPayments,
  getOverdueAlerts
};
