
export class Discount extends Document {
    _id?: string;
    code: string 
    description: string 
    startDate: Date
    endDate: Date
    type: string
    value:string
    status: string
    deleted? : boolean
    deleted_at? : Date
}
