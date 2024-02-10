import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    description: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    type: { type: String },
    value: { type: String },
    status: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { DiscountSchema };
