import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Security headers
    app.use(helmet());

    // Request size limit
    app.use(require('express').json({ limit: '5mb' }));
    app.use(require('express').urlencoded({ limit: '5mb', extended: true }));

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const allowedOrigins = [
      'https://www.gxcreality.com',
      'https://gxcreality.com',
      process.env.FRONTEND_URL,
      'http://localhost:3001',
      'http://localhost:3000',
    ].filter(Boolean) as string[];

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.setGlobalPrefix('api');

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = '0.0.0.0';
    await app.listen(port, host);
    console.log(`🚀 GXCRealty Backend is running on: http://${host}:${port}/api`);
  } catch (error) {
    console.error('❌ FATAL: Server failed to bootstrap', error);
    process.exit(1);
  }
}
bootstrap();
