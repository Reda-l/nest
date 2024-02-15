
export class Charge extends Document {
    _id?: string;
    date: Date;
    name: string;
    price: number;
    image: string
    reason: string;
    createdBy?: any
    deleted?: boolean
    deleted_at?: Date
}
