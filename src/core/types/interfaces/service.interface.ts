
export class Service extends Document {
    _id?: string;
    title: string;
    slug: string;
    image?: string;
    type : string;
    deleted?: boolean
    deleted_at?: Date
}
