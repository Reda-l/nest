import { Schema as MongooseSchema } from 'mongoose';
import * as mongoose from 'mongoose';
import { APPOINTMENT_STATUS_OPTIONS } from 'src/core/shared/shared.enum';

const appointmentSchema = new mongoose.Schema({
    date: { type: Date }, // Date of the appointment
    time: { type: String }, // Time of the appointment

    reservations: [{
        gender: {
            id: { type: String, required: false },
            name: { type: String, required: false }
        },
        service: [
            {
                name: { type: String },
                price: { type: Number },
                image: { type: String },
                type: { type: String },
                time: { type: Number },
                description: { type: [String] }
            }
        ],
        fullname: { type: String, required: false }
    }],


    bookingPersonDetails: {
        fullname: { type: String, required: false }, // Full name of the person booking the appointment
        phone: { type: String, required: false }, // Phone number of the person booking the appointment
        email: { type: String, required: false }, // Email of the person booking the appointment
        message: { type: String, required: false } // Additional message or notes related to the booking
    },

    updatedBy: { type: MongooseSchema.Types.ObjectId, ref: 'User', default: null }, // User who updated the Appointment
    status: {
        type: String,
        enum: APPOINTMENT_STATUS_OPTIONS,
        default: APPOINTMENT_STATUS_OPTIONS.PENDING,
        required: false,
    },

},
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

export { appointmentSchema };
