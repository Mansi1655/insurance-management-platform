const prisma = require('../prisma');

const getDashboardStats = async (req, res) => {
  try {
    // 1. Policy Counts
    const activePoliciesCount = await prisma.policy.count({ where: { status: 'ACTIVE' } });
    const expiredPoliciesCount = await prisma.policy.count({ where: { status: 'EXPIRED' } });
    const cancelledPoliciesCount = await prisma.policy.count({ where: { status: 'CANCELLED' } });
    const totalPoliciesCount = await prisma.policy.count();

    // 2. Policy Types Breakdown
    const policyTypes = await prisma.policy.groupBy({
      by: ['policyType'],
      _count: { _all: true },
      _sum: { premiumAmount: true }
    });

    // 3. Claims Statistics
    const claimsStats = await prisma.claim.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { claimAmount: true }
    });

    const pendingClaims = claimsStats.find(c => c.status === 'PENDING') || { _count: { _all: 0 }, _sum: { claimAmount: 0 } };
    const approvedClaims = claimsStats.find(c => c.status === 'APPROVED') || { _count: { _all: 0 }, _sum: { claimAmount: 0 } };
    const rejectedClaims = claimsStats.find(c => c.status === 'REJECTED') || { _count: { _all: 0 }, _sum: { claimAmount: 0 } };

    // 4. Premium Tracking Statistics
    const premiumStats = await prisma.premiumPayment.groupBy({
      by: ['paymentStatus'],
      _count: { _all: true },
      _sum: { amount: true }
    });

    const paidPremiums = premiumStats.find(p => p.paymentStatus === 'PAID') || { _sum: { amount: 0 } };
    const unpaidPremiums = premiumStats.find(p => p.paymentStatus === 'UNPAID') || { _sum: { amount: 0 } };
    const overduePremiums = premiumStats.find(p => p.paymentStatus === 'OVERDUE') || { _sum: { amount: 0 } };

    // 5. Customer growth count
    const totalCustomers = await prisma.customer.count();

    // 6. Monthly Collections (payments collected by month)
    const paidPayments = await prisma.premiumPayment.findMany({
      where: { paymentStatus: 'PAID' },
      select: { paymentDate: true, amount: true }
    });

    const monthlyCollections = {};
    paidPayments.forEach(p => {
      if (p.paymentDate) {
        const month = p.paymentDate.substring(0, 7); // YYYY-MM
        monthlyCollections[month] = (monthlyCollections[month] || 0) + p.amount;
      }
    });

    // 7. Monthly Claims Paid (claims approved by month)
    const approvedClaimsList = await prisma.claim.findMany({
      where: { status: 'APPROVED' },
      select: { submissionDate: true, claimAmount: true }
    });

    const monthlyClaimsPaid = {};
    approvedClaimsList.forEach(c => {
      if (c.submissionDate) {
        const month = c.submissionDate.substring(0, 7); // YYYY-MM
        monthlyClaimsPaid[month] = (monthlyClaimsPaid[month] || 0) + c.claimAmount;
      }
    });

    // Generate monthly combined reports (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7);
      months.push(monthStr);
    }

    const businessReport = months.map(m => ({
      month: m,
      collections: monthlyCollections[m] || 0,
      claimsPaid: monthlyClaimsPaid[m] || 0
    }));

    res.json({
      policies: {
        active: activePoliciesCount,
        expired: expiredPoliciesCount,
        cancelled: cancelledPoliciesCount,
        total: totalPoliciesCount,
        distribution: policyTypes.map(p => ({
          type: p.policyType,
          count: p._count._all,
          premiumSum: p._sum.premiumAmount || 0
        }))
      },
      claims: {
        pendingCount: pendingClaims._count._all,
        pendingAmount: pendingClaims._sum.claimAmount || 0,
        approvedCount: approvedClaims._count._all,
        approvedAmount: approvedClaims._sum.claimAmount || 0,
        rejectedCount: rejectedClaims._count._all,
        rejectedAmount: rejectedClaims._sum.claimAmount || 0,
        totalCount: await prisma.claim.count()
      },
      premiums: {
        collected: paidPremiums._sum.amount || 0,
        unpaid: unpaidPremiums._sum.amount || 0,
        overdue: overduePremiums._sum.amount || 0,
        totalBilled: (paidPremiums._sum.amount || 0) + (unpaidPremiums._sum.amount || 0) + (overduePremiums._sum.amount || 0)
      },
      customers: {
        total: totalCustomers
      },
      charts: {
        businessReport
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};
