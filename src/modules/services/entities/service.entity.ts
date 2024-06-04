import mongoose from 'mongoose';

// Enum for status
const StatusEnum = ['ACTIVE', 'INACTIVE'];

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String }, // name of the service
    price: { type: Number },
    image: { type: String,default: null },
    type: { type: String },
    time: { type: mongoose.Schema.Types.Mixed }, // Make time a mixed type to allow null
    description: { type: [String] }, // Array of strings for description
    status: { type: String, enum: StatusEnum, default: 'ACTIVE' }, // Enum for status with default value "ACTIVE"
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { serviceSchema };
