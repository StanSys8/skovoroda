import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Restrict CORS to the frontend origin so a malicious page on another
  // origin cannot read responses or fire preflighted (JSON) requests
  // against the API in the user's browser. The agent (curl, no Origin)
  // is unaffected. Override CORS_ORIGIN if UI_PORT/BIND_HOST change.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:8080',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3900);
}
bootstrap();
