import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      default: () => `INV-${Date.now()}`,
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, trim: true, default: '' },
    projectName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, required: true, min: 0, default: 0 },
    gstAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    dueDate: { type: Date, required: true },
    currency: { type: String, enum: ['USD'], default: 'USD' },
    status: {
      type: String,
      enum: ['paid', 'pending', 'draft', 'sent', 'overdue'],
      default: 'pending',
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ ownerId: 1, createdAt: -1 });
invoiceSchema.index({ ownerId: 1, status: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
