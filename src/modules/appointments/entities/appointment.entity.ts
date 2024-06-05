import { Schema as MongooseSchema } from 'mongoose';
import * as mongoose from 'mongoose';
import {
  APPOINTMENT_SOURCE,
  APPOINTMENT_STATUS_OPTIONS,
} from 'src/core/shared/shared.enum';

const appointmentSchema = new mongoose.Schema(
  {
    date: { type: Date }, // Date of the appointment
    time: { type: String }, // Time of the appointment

    reservations: [
      {
        gender: {
          id: { type: String, required: false },
          name: { type: String, required: false },
        },
        services: [
          {
            _id: { type: String },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            image: { type: String },
            type: { type: String },
            time: { type: mongoose.Schema.Types.Mixed }, // Make time a mixed type to allow null
            description: { type: [String] },
          },
        ],
        fullname: { type: String, required: false },
      },
    ],

    bookingPersonDetails: {
      fullname: { type: String, required: false }, // Full name of the person booking the appointment
      phone: { type: String, required: false }, // Phone number of the person booking the appointment
      email: { type: String, required: false }, // Email of the person booking the appointment
      message: { type: String, required: false }, // Additional message or notes related to the booking
    },

    updatedBy: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'User',
      default: null,
    }, // User who updated the Appointment
    status: {
      type: String,
      enum: APPOINTMENT_STATUS_OPTIONS,
      default: APPOINTMENT_STATUS_OPTIONS.PENDING,
      required: false,
    },
    discount: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Discount',
      default: null,
    }, // Discount
    payment: {
      paymentMethod: { type: String, required: false },
      currency: { type: String, required: false },
      devise: { type: Number, required: false },
      debitPaymentMethod: { type: String, required: false },
      debitCurrency: { type: String, required: false },
      debitDevise: { type: Number, required: false },
    },
    source: {
      type: String,
      required: false,
    },
    deposit: { type: Number, required: false,default : null },
    commission: {
      type: { type: String, required: false }, // type Number or %
      value: { type: Number, required: false },
      payed: { type: Boolean, default: false },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export { appointmentSchema };
