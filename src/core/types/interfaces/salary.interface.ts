
export class Salary extends Document {
    _id?: string;
    deleted?: boolean
    deleted_at?: Date
    employee: any;
    status: any;
    amount: any;
    date: string | number | Date;
    created_at: any;
    updated_at: any;
}
