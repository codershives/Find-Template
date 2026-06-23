import { Invoice } from '../models/Invoice.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const effectiveOwnerId = (req) => (req.user.role === 'admin' || req.user.isOwner ? req.user._id : req.user.ownerId);
const ownerFilter = (req) => ({ ownerId: effectiveOwnerId(req) });

const calculateInvoiceAmounts = (amount = 0) => {
  const safeAmount = Number(amount || 0);

  return {
    amount: safeAmount,
    gstRate: 0,
    gstAmount: 0,
    totalAmount: safeAmount,
  };
};

const normalizeInvoicePayload = (body, existingInvoice = null) => {
  const nextAmount = body.amount !== undefined ? body.amount : existingInvoice?.amount || 0;
  const calculated = calculateInvoiceAmounts(nextAmount);

  return {
    ...body,
    ...calculated,
    clientId: body.clientId || null,
    dueDate: body.dueDate !== undefined ? new Date(body.dueDate) : existingInvoice?.dueDate,
  };
};

export const listInvoices = asyncHandler(async (req, res) => {
  const data = await Invoice.find(ownerFilter(req)).sort({ createdAt: -1 }).populate('clientId', 'name email company');
  return res.json({ success: true, message: 'Invoices fetched successfully', data });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const payload = normalizeInvoicePayload(req.body);
  const invoice = await Invoice.create({
    ...payload,
    ownerId: effectiveOwnerId(req),
    createdBy: req.user._id,
  });

  return res.status(201).json({ success: true, message: 'Invoice added successfully', data: invoice });
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, ...ownerFilter(req) });

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  const payload = normalizeInvoicePayload(req.body, invoice);
  Object.assign(invoice, payload);
  await invoice.save();

  return res.json({ success: true, message: 'Invoice updated successfully', data: invoice });
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) });

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  return res.json({ success: true, message: 'Invoice deleted successfully', data: null });
});
