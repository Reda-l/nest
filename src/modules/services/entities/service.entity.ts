import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: { type: String }, // name of the service
    slug: { type: String }, // name with _ and lowerCase
    price: { type: Number },
    image: { type: String }
},
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

export { serviceSchema };