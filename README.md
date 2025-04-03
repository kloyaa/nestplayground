# Pact Contract Testing Guide

This README provides a comprehensive guide to contract testing using Pact with our User API service. It covers implementation, breaking changes, and best practices to ensure reliable API contracts between consumers and providers.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Contract Verification](#contract-verification)
- [Breaking Changes](#breaking-changes)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

Pact is a consumer-driven contract testing tool that ensures your services can communicate with each other reliably. It works by testing that the consumer expectations match what the provider delivers.

### Key Components

- **Consumer Tests**: Define expectations of how the provider should behave
- **Provider Tests**: Verify the provider meets consumer expectations
- **Pact Broker**: Central repository for contract sharing

## Setup

### Installation

```bash
npm install --save-dev @pact-foundation/pact
```

### Project Structure

```
project/
├── pacts/                      # Generated pact files
├── src/
│   ├── test/
│       └── name.consumer.pact.spec.ts
│       └── name.provider.pact.spec.ts
├── package.json
└── README.md
```

## Running Tests

### Consumer Tests

```bash
yarn test -- name.consumer.pact (eg. users.consumer.pact)
```

This generates a pact file at `pacts/MyConsumer-MyProvider.json`.

### Provider Tests

```bash
yarn test -- name.provider.pact
```

This verifies that your provider fulfills the consumer contract.

## Contract Verification

The provider verification test:

1. Starts your actual NestJS application
2. Sets up predefined states in the database
3. Sends real HTTP requests based on the consumer contract
4. Verifies responses match the expected format

### Consumer Contract

The consumer defines expectations in `users.consumer.pact.spec.ts`:

```typescript
describe('POST /users', () => {
    // Define expected request and response
    
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

        // Execute test
    });
});
```

### Provider Verification

Provider tests verify against the contract in `users.provider.pact.spec.ts`:

```typescript
const stateHandlers = {
    'no existing user': async () => {
        // Clear database
        await userRepository.clear();
        return Promise.resolve('Database cleared');
    },
    [`a user exists with id ${testUserId}`]: async () => {
        // Create test user
        // ...
        return Promise.resolve('User created');
    }
};

// Run verification
return new Verifier({
    provider: 'MyProvider',
    providerBaseUrl: 'http://localhost:3001',
    pactUrls: [path.resolve(process.cwd(), 'pacts/MyConsumer-MyProvider.json')],
    stateHandlers: stateHandlers,
}).verifyProvider();
```

## Breaking Changes

Breaking changes will cause provider verification tests to fail. Here are common examples:

### 1. Response Structure Changes

**Breaking Change:**
```typescript
// Changed response format with different field names
return {
    userId: user.id,          // Changed from 'id'
    userName: user.username,  // Changed from 'username'
    email: user.email,
    createdOn: user.createdAt // Changed from 'createdAt'
};
```

### 2. New Required Fields

**Breaking Change:**
```typescript
export class CreateUserDto {
    // Existing fields...
    
    @IsNotEmpty()
    @IsBoolean()
    acceptTerms: boolean; // New required field
}
```
### Resolving Breaking Changes

1. **Revert the Change**: Make your code conform to the existing contract
2. **Update the Consumer**: Update the consumer code and contract
3. **Version Your API**: Create a new endpoint while maintaining the old one

## Best Practices

1. **Test Real Implementations**: Avoid mocking in provider tests
2. **Database State Management**: Use proper setup/teardown for test states
3. **Versioning**: Consider API versioning for breaking changes
4. **CI Integration**: Run contract tests on every build
5. **Pact Broker**: Use a broker to share contracts between teams

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Pact Contract Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run consumer pact tests
        run: npm run test:consumer:pact
      - name: Publish pacts
        if: github.ref == 'refs/heads/main'
        run: npm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          
  provider-tests:
    needs: consumer-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run provider pact tests
        run: npm run test:provider:pact
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
```

### Can-I-Deploy

Before deploying, validate that your changes won't break consumers:

```bash
npx pact-broker can-i-deploy \
  --pacticipant=MyProvider \
  --version=$GIT_COMMIT \
  --to=production \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

## Conclusion

Contract testing with Pact ensures your microservices remain compatible as they evolve independently. By catching breaking changes early, you maintain reliability across your distributed system without slowing down development.