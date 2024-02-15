import { Schema as MongooseSchema } from 'mongoose';
import mongoose from 'mongoose';

const ActionsSchema = new mongoose.Schema(
    {
        type: { type: String },
        module: { type: String },
        entity: {
            type: mongoose.Schema.Types.Mixed
        },
        user: { type: MongooseSchema.Types.ObjectId, ref: "User" }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

export { ActionsSchema };
