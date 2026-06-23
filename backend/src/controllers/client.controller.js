import { Client } from '../models/Client.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const effectiveOwnerId = (req) => (req.user.role === 'admin' || req.user.isOwner ? req.user._id : req.user.ownerId);
const ownerFilter = (req) => ({ ownerId: effectiveOwnerId(req) });

const calculatePendingAmount = (projectBudget = 0, receivedAmount = 0) => Math.max(Number(projectBudget || 0) - Number(receivedAmount || 0), 0);

const applyClientUpdates = (client, body) => {
  const { name, email, mobileNumber, projectName, websiteType, projectBudget, receivedAmount, paymentDate } = body;

  if (name !== undefined) client.name = name;
  if (email !== undefined) client.email = email;
  if (mobileNumber !== undefined) client.mobileNumber = mobileNumber;
  if (projectName !== undefined) client.projectName = projectName;
  if (websiteType !== undefined) client.websiteType = websiteType;
  if (projectBudget !== undefined) client.projectBudget = projectBudget;
  if (receivedAmount !== undefined) client.receivedAmount = receivedAmount;
  if (paymentDate !== undefined) client.paymentDate = new Date(paymentDate);

  client.pendingAmount = calculatePendingAmount(client.projectBudget, client.receivedAmount);
};

export const listClients = asyncHandler(async (req, res) => {
  const data = await Client.find(ownerFilter(req)).sort({ createdAt: -1 });
  return res.json({ success: true, message: 'Clients fetched successfully', data });
});

export const createClient = asyncHandler(async (req, res) => {
  const existingClient = await Client.findOne({ ownerId: req.user._id, email: req.body.email });

  if (existingClient) {
    return res.status(409).json({ success: false, message: 'Client email already exists' });
  }

  const client = await Client.create({
    ...req.body,
    pendingAmount: calculatePendingAmount(req.body.projectBudget, req.body.receivedAmount),
    paymentDate: new Date(req.body.paymentDate),
    ownerId: req.user._id,
    createdBy: req.user._id,
  });

  return res.status(201).json({ success: true, message: 'Client added successfully', data: client });
});

export const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, ...ownerFilter(req) });

  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  return res.json({ success: true, message: 'Client fetched successfully', data: client });
});

export const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, ...ownerFilter(req) });

  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  if (req.body.email !== undefined && req.body.email !== client.email) {
    const existingClient = await Client.findOne({ ownerId: req.user._id, email: req.body.email, _id: { $ne: client._id } });
    if (existingClient) {
      return res.status(409).json({ success: false, message: 'Client email already exists' });
    }
  }

  applyClientUpdates(client, req.body);
  await client.save();

  return res.json({ success: true, message: 'Client updated successfully', data: client });
});

export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) });

  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  return res.json({ success: true, message: 'Client deleted successfully', data: null });
});
