
export class Charge extends Document {
    _id?: string;
    date: string;
    name: string;
    price: number;
    payment: string
    image: string
    reason: string;
    responsable: string;
    type: string;
    createdBy?: any
    deleted?: boolean
    deleted_at?: Date
    created_at?: Date
    updated_at?: Date
}
