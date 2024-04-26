import mongoose from 'mongoose';

const SalarySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: { type: Date, required: true },
    status: { type: String, enum: ['PAID', 'UNPAID'], default: 'UNPAID' },
    amount : { type: Number, required: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { SalarySchema };
