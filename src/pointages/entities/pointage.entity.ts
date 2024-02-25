import mongoose from 'mongoose';

const PointageSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    daysWorked: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { PointageSchema };
