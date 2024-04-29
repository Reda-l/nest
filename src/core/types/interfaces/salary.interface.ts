export class Salary extends Document {
  _id?: string;
  deleted?: boolean;
  deleted_at?: Date;
  employee: any;
  status: string;
  amount: number;
  salary: number;
  salaryType: string;
  responsable: string;
  message: string;
  date: string | number | Date;
  created_at: any;
  updated_at: any;
}
