const prisma = require('../prisma');
const path = require('path');

const submitClaim = async (req, res) => {
  try {
    const { policyId, claimAmount, reason } = req.body;

    if (!policyId || !claimAmount || !reason) {
      return res.status(400).json({ error: 'Policy ID, claim amount, and reason are required' });
    }

    const policy = await prisma.policy.findUnique({
      where: { id: parseInt(policyId) },
      include: { customer: true }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Verify customer ownership of policy if they are CUSTOMER role
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (!customer || policy.customerId !== customer.id) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
    }

    let filePath = null;
    if (req.file) {
      // Store relative file path for database
      filePath = '/uploads/' + req.file.filename;

      // Also register this upload in the Document table
      await prisma.document.create({
        data: {
          customerId: policy.customerId,
          fileName: req.file.originalname,
          filePath: filePath
        }
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const claim = await prisma.claim.create({
      data: {
        policyId: parseInt(policyId),
        claimAmount: parseFloat(claimAmount),
        reason,
        status: 'PENDING',
        submissionDate: todayStr,
        filePath
      }
    });

    res.status(201).json({
      message: 'Claim submitted successfully',
      claim
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getClaims = async (req, res) => {
  try {
    const { status, search = '' } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { policy: { policyNumber: { contains: search } } },
        { policy: { customer: { name: { contains: search } } } }
      ];
    }

    // If CUSTOMER role, filter by customer's own policies
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (customer) {
        where.policy = { customerId: customer.id };
      } else {
        return res.json({ claims: [] });
      }
    }

    const claims = await prisma.claim.findMany({
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
      orderBy: { id: 'desc' }
    });

    res.json({ claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await prisma.claim.findUnique({
      where: { id: parseInt(id) },
      include: {
        policy: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Check ownership if CUSTOMER role
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (!customer || claim.policy.customerId !== customer.id) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
    }

    res.json({ claim });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED, REJECTED, or PENDING' });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: parseInt(id) }
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({
      message: `Claim status updated to ${status} successfully`,
      claim: updatedClaim
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  submitClaim,
  getClaims,
  getClaimById,
  updateClaimStatus
};
