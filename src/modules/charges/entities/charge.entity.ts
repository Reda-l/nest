import mongoose from "mongoose";

const chargeSchema = new mongoose.Schema({
    name: { type: String }, // name of the service
    price: { type: Number },
    reason: { type: String },
    date: { type: Date, default: new Date() },
    responsable: { type: mongoose.Types.ObjectId, ref: "User" },
},
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

export { chargeSchema };