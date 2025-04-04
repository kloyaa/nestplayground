import { PactV3, SpecificationVersion } from '@pact-foundation/pact';
import { like, } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import * as path from 'path';

const provider = new PactV3({
    consumer: 'HealthConsumerService',
    provider: 'HealthProviderService',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V3
});

describe('GET /', () => {
    const getHealthStatusResponse = {
        pg_status: 'ok',
        redis_status: 'ok'
    };

    it('get application health statuse', () => {
        provider
            .given('requesting a health status of application')
            .uponReceiving('a request to receive application status')
            .willRespondWith({
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: like(getHealthStatusResponse),
            });

        return provider.executeTest(async (mockserver) => {
            const response = await axios.get(`${mockserver.url}/`, {
                headers: { 'Content-Type': 'application/json' },
            },);
            expect(response.status).toBe(201);
        });
    });
});