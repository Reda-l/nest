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
    salary : { type: Number, required: false },
    salaryType : { type: String, required: false },
    amount : { type: Number, required: false },
    responsable : { type: String, required: false },
    message : { type: String, required: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { SalarySchema };
