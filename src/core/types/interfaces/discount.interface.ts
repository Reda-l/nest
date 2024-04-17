export class Discount extends Document {
  _id?: string;
  code: string;
  description: string;
  startDate: any;
  endDate: any;
  type: string;
  value: string;
  status: string;
  deleted?: boolean;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}
