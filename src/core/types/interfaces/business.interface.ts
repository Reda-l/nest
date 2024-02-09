
export class Business extends Document {
    _id?: string;
    name: string
    logo: string
    email: string
    secondEmail: string
    phoneNumber: string
    linkGoodgleMap: string
    whatsappNumber: string
    barCode: string
    deleted?: boolean
    deleted_at?: Date
}
