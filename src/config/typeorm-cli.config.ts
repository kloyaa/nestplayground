import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'nestjs_user_db',
  entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/{migrations,seeds}/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});
