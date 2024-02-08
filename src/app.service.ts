import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    const env = process.env.NODE_ENV;
    const db = env === 'production' ? 'Production' : 'Development';
    return `Hello World! Environment: ${env}, Connected to MongoDB: ${db}`;
  }
}
