import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS with default options
  app.enableCors();
  await app.listen(3000);
  console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Connected to MongoDB: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
}
bootstrap();
