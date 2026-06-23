import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    projectName: { type: String, trim: true, default: '' },
    websiteType: { type: String, required: true, trim: true },
    projectBudget: { type: Number, required: true, min: 0, default: 0 },
    receivedAmount: { type: Number, required: true, min: 0, default: 0 },
    pendingAmount: { type: Number, required: true, min: 0, default: 0 },
    paymentDate: { type: Date, required: true },
    company: { type: String, trim: true, default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

clientSchema.index({ ownerId: 1, createdAt: -1 });
clientSchema.index({ ownerId: 1, email: 1 });

export const Client = mongoose.model('Client', clientSchema);
