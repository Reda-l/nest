import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema({
    name: { type: String },
    logo: { type: String },
    emails: [{ type: String }],
    phoneNumbers: [{ type: String }],
    linkGoogleMap: { type: String },
    socialLinks: [{ type: { type: String },link: { type: String } }],
    whatsappNumbers: [{ type: String }],
    barCode: { type: String },
},
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

export { BusinessSchema };