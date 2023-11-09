import { Schema as MongooseSchema } from 'mongoose';
import * as mongoose from 'mongoose';
import { APPOINTMENT_STATUS_OPTIONS } from 'src/core/shared/shared.enum';

const appointmentSchema = new mongoose.Schema({
    date: { type: Date }, // Date of the appointment
    time: { type: String }, // Time of the appointment

    reservation: {
        gender: { type: String, required: false }, // Gender of the reservation (e.g., "male", "female", etc.)
        service: { type: String, required: false }, // Service being reserved for the appointment
        fullname: { type: String, required: false } // Full name for the reservation
    },
    

    bookingPersonDetails: {
        fullname: { type: String, required: false }, // Full name of the person booking the appointment
        phone: { type: String, required: false }, // Phone number of the person booking the appointment
        email: { type: String, required: false }, // Email of the person booking the appointment
        message: { type: String, required: false } // Additional message or notes related to the booking
    },

    updatedBy: { type: MongooseSchema.Types.ObjectId, ref: 'User', default : null }, // User who updated the Appointment
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
