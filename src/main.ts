import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as firebase from './config/firebase.json';
import * as admin from 'firebase-admin';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(JSON.stringify(firebase))),
    storageBucket: 'spa-epices.appspot.com',
  });
  // Enable CORS with default options
  app.enableCors();
  //swagger
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Connected to MongoDB: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
}
bootstrap();
