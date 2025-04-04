import { Verifier } from '@pact-foundation/pact';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersModule } from '@app/modules/users/users.module';

describe('Users Provider Pact Verification', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';

    beforeAll(async () => {
        // Create a test module with REAL services and repositories
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                UsersModule,
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    database: 'nestjsplayground_db',
                    entities: [User],
                    synchronize: true, // Create tables automatically
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                // For debugging only - log validation errors
                exceptionFactory: (errors) => {
                    console.log('Validation errors:', JSON.stringify(errors, null, 2));
                    return new BadRequestException(errors);
                }
            })
        );

        await app.init();

        // Get the REAL repository for test state setup
        userRepository = app.get<Repository<User>>(getRepositoryToken(User));

        // Start the server on a specific port for Pact verification
        const server = app.getHttpServer();
        await new Promise<void>((resolve) => server.listen(3001, resolve));
    });

    afterAll(async () => {
        await app.close();
    });

    it('validates the consumer contract', async () => {
        // Setup state handlers that actually modify the database
        const stateHandlers = {
            'no existing user': async () => {
                // Clear any existing users to ensure we're in a clean state
                await userRepository.clear();
                return Promise.resolve('Database cleared, no user exists');
            },
            [`a user exists with id ${testUserId}`]: async () => {
                // Clear any existing data first
                await userRepository.clear();

                // Create a salt and hash for the test user
                const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash('password123', salt);

                // Create and save a real test user with the specific ID from the contract
                const user = userRepository.create({
                    id: testUserId, // Use the exact ID expected in the contract
                    username: 'testuser',
                    email: 'test@example.com',
                    password: hashedPassword,
                    salt: salt,
                    createdAt: new Date('2023-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
                });

                await userRepository.save(user);
                return Promise.resolve(`User with id ${testUserId} created in database`);
            }
        };

        // Run the Pact verification against our REAL API.
        const isProduction = process.env.NODE_ENV === 'production';
        const localPort = process.env.PORT || 3432;
        const localHost = `http://localhost:${localPort}`;
        const localPactBrokerUrl = `http://localhost:9292`;

        const verifierOptions = {
            provider: 'ProviderService',
            providerBaseUrl: isProduction
                ? 'https://myprovider.com'
                : localHost,
            pactBrokerUrl: isProduction
                ? localPactBrokerUrl
                : localPactBrokerUrl,
            pactUrls: [path.resolve(process.cwd(), 'pacts/ConsumerService-ProviderService.json')],
            publishVerificationResult: true,
            providerVersion: process.env.GIT_COMMIT || '1.0.0',
            stateHandlers: stateHandlers,
        };

        console.log(verifierOptions)

        return new Verifier(verifierOptions).verifyProvider();
    });
});