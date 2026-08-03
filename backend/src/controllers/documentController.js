const prisma = require('../prisma');
const path = require('path');
const fs = require('fs');

const uploadDocument = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const filePath = '/uploads/' + req.file.filename;

    const document = await prisma.document.create({
      data: {
        customerId: parseInt(customerId),
        fileName: req.file.originalname,
        filePath
      }
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { customerId } = req.query;
    const where = {};

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    // Filter if role is CUSTOMER
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (customer) {
        where.customerId = customer.id;
      } else {
        return res.json({ documents: [] });
      }
    }

    const documents = await prisma.document.findMany({
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
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ documents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions if CUSTOMER
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });
      if (!customer || document.customerId !== customer.id) {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }
    }

    const fullPath = path.join(__dirname, '../../', document.filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found on server disk' });
    }

    res.download(fullPath, document.fileName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  downloadDocument
};
