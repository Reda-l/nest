import mongoose from 'mongoose';
import { chargeType } from 'src/core/shared/shared.enum';

const DiscountSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    description: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    type: { type: String, enum:chargeType },
    value: { type: String },
    status: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { DiscountSchema };
