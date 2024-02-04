import mongoose from 'mongoose';

// Enum for status
const StatusEnum = ['ACTIVE', 'INACTIVE'];

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String }, // name of the service
    price: { type: Number },
    image: { type: String },
    type: { type: String },
    time: { type: Number },
    description: { type: [String] }, // Array of strings for description
    status: { type: String, enum: StatusEnum, default: 'ACTIVE' }, // Enum for status with default value "ACTIVE"
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { serviceSchema };
