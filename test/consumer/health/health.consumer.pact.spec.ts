import { PactV3, SpecificationVersion } from '@pact-foundation/pact';
import { like } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import * as path from 'path';

const provider = new PactV3({
  consumer: 'HealthConsumerService',
  provider: 'HealthProviderService',
  dir: path.resolve(process.cwd(), 'pacts/healths'),
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
});

describe('GET /', () => {
  it('get application health statuse', () => {
    provider
      .given('requesting a health status of application')
      .uponReceiving('a request to receive application status')
      .willRespondWith({
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
        body: like({
          pg_status: 'ok',
          redis_status: 'ok',
        }),
      });

    return provider.executeTest(async (mockserver) => {
      const response = await axios.get(`${mockserver.url}/`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(201);
    });
  });
});
