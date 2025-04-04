import { PactV3, SpecificationVersion } from '@pact-foundation/pact';
import { like, string, uuid } from '@pact-foundation/pact/src/dsl/matchers';
import axios, { AxiosPromise } from 'axios';
import * as path from 'path';

const provider = new PactV3({
    consumer: 'UserConsumerService',
    provider: 'UserProviderService',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V3
});

describe('POST /users', () => {
    const createUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
    };

    const createUserResponse = {
        id: uuid('123e4567-e89b-12d3-a456-426614174000'),
        username: 'testuser',
        email: 'test@example.com',
        createdAt: string('2023-01-01T00:00:00.000Z'),
        updatedAt: string('2023-01-01T00:00:00.000Z'),
    };

    it('creates a user successfully', () => {
        provider
            .given('no existing user')
            .uponReceiving('a request to create a new user')
            .withRequest({
                method: 'POST',
                path: '/users',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: createUserRequest,
            })
            .willRespondWith({
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: like(createUserResponse),
            });

        return provider.executeTest(async (mockserver) => {
            const response = await axios.post(`${mockserver.url}/users`, createUserRequest, {
                headers: { 'Content-Type': 'application/json' },
            },);
            expect(response.status).toBe(201);
        });
    });
});

describe(`GET /user/{userid}`, () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const getUserResponse = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: string('2023-01-01T00:00:00.000Z'),
        updatedAt: string('2023-01-01T00:00:00.000Z'),
    };
    it('returns user by userid', () => {
        provider
            .given('a user exists with id ' + userId)
            .uponReceiving('a request to get a user by id')
            .withRequest({
                method: 'GET',
                path: `/users/${userId}`,
                headers: { Accept: 'application/json' },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: getUserResponse,
            });

        return provider.executeTest(async (mockserver) => {
            const response = await axios.get(`${mockserver.url}/users/${userId}`, {
                headers: { Accept: 'application/json' }
            });
            expect(response.status).toBe(200);
        });
    });
});