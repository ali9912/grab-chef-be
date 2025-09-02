import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Security middleware
  app.use(helmet());

  // Rate limiting to prevent abuse
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
    }),
  );

  // CORS setup
  app.enableCors();

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Grab Chef API')
    .setDescription('The Grab Chef Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token in the format: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('App', 'App management endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Chef', 'Chef management endpoints')
    .addTag('Customer', 'Customer management endpoints')
    .addTag('Menu', 'Menu management endpoints')
    .addTag('Event', 'Event management endpoints')
    .addTag('Review', 'Review management endpoints')
    .addTag('Payments', 'Payment management endpoints')
    .addTag('Admin', 'Admin management endpoints')
    .addTag('Chat', 'Chat functionality endpoints')
    .addTag('Notification', 'Notification management endpoints')
    .addTag('Achievements', 'Achievement management endpoints')
    .addTag('Banners', 'Banner management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Grab Chef API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = 3000; // Using port 5000 for Replit
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
