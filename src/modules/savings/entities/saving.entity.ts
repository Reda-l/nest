import mongoose from 'mongoose';

const SavingSchema = new mongoose.Schema(
  {
    balance: { type: Number, required: true, default: 0 },   
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { SavingSchema };
