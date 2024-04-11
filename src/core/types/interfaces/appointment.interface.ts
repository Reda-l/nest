import { User } from "./user.interface";

export class Appointment extends Document {
    _id?: string;
    date: Date;
    time: string;
    reservations: any;
    discount: any;
    bookingPersonDetails: any;
    createdBy? : any;
    commission?: any;
    source : string;
}
