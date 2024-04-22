export class Pointage extends Document {
  _id?: string;
  employee: any;
  startTime: Date;
  endTime?: Date;
  salaire?:number;
}
