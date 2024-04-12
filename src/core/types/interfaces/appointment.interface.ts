import { User } from "./user.interface";

export class Appointment extends Document {
    _id?: string;
    date: Date;
    created_at: Date;
    updated_at: Date;
    time: string;
    status: string;
    updatedBy: string;
    payment: string;
    deposit: string;
    reservations: any;
    discount: any;
    bookingPersonDetails: any;
    createdBy? : any;
    commission?: any;
    source : string;
}
