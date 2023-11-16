import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: { type: String }, // name of the service
    price: { type: Number },
    image: { type: String },
    type : {type : String},
    time : { type: Number },
    description: { type: [String] } // Array of strings for description
},
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

export { serviceSchema };