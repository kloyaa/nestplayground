import { PactV3, SpecificationVersion } from '@pact-foundation/pact';
import { like } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import * as path from 'path';

const provider = new PactV3({
  consumer: 'HealthConsumerServiceV1',
  provider: 'HealthProviderServiceV1',
  dir: path.resolve(process.cwd(), 'pacts/healths'),
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
});

// as you can see the v1 is using camel case not snake case
describe('GET /v1', () => {
  it('get application health statuses', () => {
    provider
      .given('requesting a health status of application')
      .uponReceiving('a request to receive application status')
      .withRequest({
        method: 'GET',
        path: '/v1',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: like({
          pgStatus: 'ok',
          redisStatus: 'ok',
        }),
      });

    return provider.executeTest(async (mockserver) => {
      const response = await axios.get(`${mockserver.url}/v1`, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.status).toBe(200);
    });
  });
});
