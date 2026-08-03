const prisma = require('../prisma');
const PDFDocument = require('pdfkit');

const createPolicy = async (req, res) => {
  try {
    const { customerId, policyType, premiumAmount, startDate, endDate } = req.body;

    if (!customerId || !policyType || !premiumAmount || !startDate || !endDate) {
      return res.status(400).json({ error: 'All policy fields are required' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Generate unique policy number
    const policyNumber = 'POL-' + Math.floor(100000 + Math.random() * 900000);

    const policy = await prisma.$transaction(async (tx) => {
      const newPolicy = await tx.policy.create({
        data: {
          customerId: parseInt(customerId),
          policyType,
          policyNumber,
          premiumAmount: parseFloat(premiumAmount),
          startDate,
          endDate,
          status: 'ACTIVE'
        }
      });

      // Automatically generate first premium payment (due in 30 days or immediately)
      // Let's create an unpaid premium payment record due in 30 days
      const dueDays = 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      await tx.premiumPayment.create({
        data: {
          policyId: newPolicy.id,
          dueDate: dueDateStr,
          amount: parseFloat(premiumAmount),
          paymentStatus: 'UNPAID'
        }
      });

      return newPolicy;
    });

    res.status(201).json({
      message: 'Policy created successfully',
      policy
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPolicies = async (req, res) => {
  try {
    const { status, type, search = '' } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.policyType = type;

    if (search) {
      where.OR = [
        { policyNumber: { contains: search } },
        { customer: { name: { contains: search } } }
      ];
    }

    // If user is a customer, limit to their own policies
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (customer) {
        where.customerId = customer.id;
      } else {
        return res.json({ policies: [] });
      }
    }

    const policies = await prisma.policy.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.json({ policies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await prisma.policy.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        claims: true,
        payments: true
      }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Check ownership if role is CUSTOMER
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (!customer || policy.customerId !== customer.id) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
    }

    res.json({ policy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const renewPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, newPremiumAmount } = req.body;

    if (!newEndDate) {
      return res.status(400).json({ error: 'New end date is required' });
    }

    const policy = await prisma.policy.findUnique({
      where: { id: parseInt(id) }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const premium = newPremiumAmount ? parseFloat(newPremiumAmount) : policy.premiumAmount;

    const updatedPolicy = await prisma.$transaction(async (tx) => {
      const updated = await tx.policy.update({
        where: { id: parseInt(id) },
        data: {
          status: 'ACTIVE',
          endDate: newEndDate,
          premiumAmount: premium
        }
      });

      // Create a new premium payment due in 30 days for renewal
      const dueDays = 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      await tx.premiumPayment.create({
        data: {
          policyId: updated.id,
          dueDate: dueDateStr,
          amount: premium,
          paymentStatus: 'UNPAID'
        }
      });

      return updated;
    });

    res.json({
      message: 'Policy renewed successfully',
      policy: updatedPolicy
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({
      where: { id: parseInt(id) }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const updated = await prisma.policy.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Policy cancelled successfully',
      policy: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const downloadPolicyPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await prisma.policy.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Check ownership if CUSTOMER
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (!customer || policy.customerId !== customer.id) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
    }

    const doc = new PDFDocument({ margin: 50 });

    // Setup HTTP Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=policy-${policy.policyNumber}.pdf`);

    doc.pipe(res);

    // Decorative Header bar
    doc.rect(0, 0, 612, 30).fill('#0f172a');

    // Header Content
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(24)
       .text('ANTIGRAVITY INSURANCE', 50, 60);

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#64748b')
       .text('100 Agentic Way, Tech Valley, CA 94025 | info@antigravityins.com', 50, 85);

    doc.moveDown();
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 110).lineTo(562, 110).stroke();

    // Title
    doc.moveDown(2);
    doc.fillColor('#1e293b')
       .font('Helvetica-Bold')
       .fontSize(16)
       .text('CERTIFICATE OF INSURANCE POLICY', { align: 'center' });
    doc.moveDown();

    // Table / Box of Policy details
    doc.rect(50, 160, 512, 220).strokeColor('#e2e8f0').lineWidth(1).stroke();
    
    // Details Rows
    const drawRow = (label, value, y) => {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#475569').text(label, 70, y);
      doc.font('Helvetica').fontSize(11).fillColor('#0f172a').text(value, 220, y);
    };

    drawRow('Policy Number:', policy.policyNumber, 180);
    drawRow('Policy Type:', policy.policyType, 210);
    drawRow('Policy Holder Name:', policy.customer.name, 240);
    drawRow('Email Address:', policy.customer.email, 270);
    drawRow('Coverage Period:', `${policy.startDate}  to  ${policy.endDate}`, 300);
    drawRow('Premium Amount:', `$${policy.premiumAmount.toFixed(2)}`, 330);
    drawRow('Policy Status:', policy.status, 360);

    // Terms
    doc.moveDown(12);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Terms and Conditions:');
    doc.font('Helvetica').fontSize(9).fillColor('#64748b').text(
      'This document certifies that the policyholder named above is covered under the terms, conditions, and exclusions of the policy defined by Antigravity Insurance. Any claims must be submitted alongside supporting documentation. Premiums must be paid by the due dates to avoid coverage suspension or policy expiry.'
    );

    // Signatures
    doc.moveDown(3);
    const signatureY = doc.y;
    
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, signatureY + 40).lineTo(200, signatureY + 40).stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text('Authorized Representative', 50, signatureY + 45);

    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(412, signatureY + 40).lineTo(562, signatureY + 40).stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text('Policyholder Signature', 412, signatureY + 45);

    // Footer
    doc.rect(0, 762, 612, 30).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(8).text('© 2026 Antigravity Insurance Services. All rights reserved.', 50, 772, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createPolicy,
  getPolicies,
  getPolicyById,
  renewPolicy,
  cancelPolicy,
  downloadPolicyPDF
};
