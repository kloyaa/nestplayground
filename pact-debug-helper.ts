// pact-debug-helper.ts
import { Pact } from '@pact-foundation/pact';
import axios from 'axios';
import * as path from 'path';

/**
 * This script helps debug Pact mock server issues by setting up a mock
 * and making a test request to it
 */
async function debugPactServer() {
    // Create a mock Pact server
    const provider = new Pact({
        consumer: 'debug-consumer',
        provider: 'debug-provider',
        log: path.resolve(process.cwd(), 'logs', 'debug-pact.log'),
        logLevel: 'debug', // Most detailed logging
        dir: path.resolve(process.cwd(), 'pacts'),
        cors: true,
    });

    try {
        // Start the server
        await provider.setup();
        const baseUrl = provider.mockService.baseUrl;
        console.log(`Debug mock server running at ${baseUrl}`);

        // Add a simple interaction
        await provider.addInteraction({
            state: 'debug state',
            uponReceiving: 'a debug request',
            withRequest: {
                method: 'GET',
                path: '/debug',
            },
            willRespondWith: {
                status: 200,
                body: { message: 'Debug successful' },
            },
        });

        // Test the interaction
        try {
            console.log('Making test request to /debug...');
            const response = await axios.get(`${baseUrl}/debug`);
            console.log('Success! Response:', response.data);
        } catch (error) {
            console.error('Error making request:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
        }

        // Clean up
        await provider.finalize();
    } catch (error) {
        console.error('Error setting up Pact server:', error);
    }
}

// Run the debug function
debugPactServer().then(() => {
    console.log('Debug complete');
});