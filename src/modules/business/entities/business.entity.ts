import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema({
    name: { type: String ,}, 
    logo: { type: String }, 
    email: { type: String },
    secondEmail: { type: String },
    phoneNumber: { type: String },
    linkGoodgleMap:{ type: String },
    whatsappNumber: { type: String },
    barCode: { type: String },
},
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

export { BusinessSchema };