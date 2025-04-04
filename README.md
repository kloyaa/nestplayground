# Pact Contract Testing Guide

This guide provides comprehensive documentation for contract testing using Pact with our User API service. It covers implementation, Docker setup, breaking changes, and best practices to ensure reliable API contracts between consumers and providers.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
  - [Installation](#installation)
  - [Project Structure](#project-structure)
  - [Docker Setup](#docker-setup)
- [Running Tests](#running-tests)
  - [Consumer Tests](#consumer-tests)
  - [Provider Tests](#provider-tests)
  - [Using NPM Scripts](#using-npm-scripts)
- [Contract Verification](#contract-verification)
  - [Consumer Contract](#consumer-contract)
  - [Provider Verification](#provider-verification)
- [Pact Broker](#pact-broker)
  - [Publishing Contracts](#publishing-contracts)
  - [Can I Deploy?](#can-i-deploy)
- [Breaking Changes](#breaking-changes)
  - [Common Examples](#common-examples)
  - [Resolving Breaking Changes](#resolving-breaking-changes)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
  - [GitHub Actions Example](#github-actions-example)

## Overview

Pact is a consumer-driven contract testing tool that ensures your services can communicate with each other reliably. It works by testing that the consumer expectations match what the provider delivers.

### Key Components

- **Consumer Tests**: Define expectations of how the provider should behave
- **Provider Tests**: Verify the provider meets consumer expectations
- **Pact Broker**: Central repository for contract sharing

## Setup

### Installation

```bash
# Using yarn
yarn add --dev @pact-foundation/pact @pact-foundation/pact-node

# Using npm
npm install --save-dev @pact-foundation/pact @pact-foundation/pact-node
```

### Project Structure

```
project/
├── pacts/                      # Generated pact files
├── src/
│   ├── test/
│       ├── consumer/           # Consumer tests
│       │   └── name.pact.spec.ts
│       └── provider/           # Provider tests
│           └── name.pact.spec.ts
├── docker-compose.yml          # Docker setup for Pact Broker
├── package.json
└── README.md
```

### Docker Setup

To run the Pact Broker locally, create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  postgres:
    image: postgres:14
    healthcheck:
      test: psql postgres --command "select 1" -U postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres

  pact-broker:
    image: pactfoundation/pact-broker:2.106.0.1
    ports:
      - "9292:9292"
    depends_on:
      - postgres
    environment:
      PACT_BROKER_PORT: '9292'
      PACT_BROKER_DATABASE_URL: "postgres://postgres:postgres@postgres/postgres"
      PACT_BROKER_LOG_LEVEL: INFO
      PACT_BROKER_SQL_LOG_LEVEL: INFO
```

Start the Pact Broker:

```bash
docker-compose up -d
```

Once running, access the Pact Broker UI at: http://localhost:9292

## Running Tests

### Consumer Tests

Consumer tests define the expectations your service has of other services. They generate contract files.

```bash
# Run all consumer tests
yarn pact:consumer:verify

# Run a specific consumer test
yarn test -- users.consumer.pact
```

### Provider Tests

Provider tests verify that your service can satisfy the contracts created by consumers.

```bash
# Run all provider tests
yarn pact:provider:verify

# Run a specific provider test
yarn test -- users.provider.pact
```

### Using NPM Scripts

Our project includes these convenient scripts in package.json:

```json
"scripts": {
  "test:pact": "jest --testRegex=\".*\\.pact\\.spec\\.ts$\"",
  "pact:provider:verify": "jest --no-coverage --ci --testRegex=\"(/__tests__/.*|(.|/)provider/.*\\.pact\\.spec\\.(js|ts))$\"",
  "pact:consumer:verify": "jest --no-coverage --ci --testRegex=\"(/__tests__/.*|(.|/)consumer/.*\\.pact\\.spec\\.(js|ts))$\"",
  "pact:consumer:publish": "pact-broker publish ./pacts --consumer-app-version $(git rev-parse --short HEAD) --broker-base-url http://localhost:9292",
  "pact:can-i-deploy": "pact-broker can-i-deploy --pacticipant ConsumerService --version $(git rev-parse --short HEAD) --broker-base-url http://localhost:9292"
}
```

Run them with:

```bash
# Run all Pact tests
yarn test:pact

# Publish contracts to Pact Broker
yarn pact:consumer:publish

# Check if safe to deploy
yarn pact:can-i-deploy
```

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

## Pact Broker

The Pact Broker is a repository for sharing contracts between consumers and providers.

### Publishing Contracts

After running consumer tests, publish the generated contracts to the broker:

```bash
yarn pact:consumer:publish
```

This uses the current Git commit hash as the version and publishes to the locally running broker.

### Can I Deploy?

Before deploying, check if your changes are compatible with all consumers:

```bash
yarn pact:can-i-deploy
```

This command checks if the current version of your service is compatible with all its consumers.

## Breaking Changes

Breaking changes will cause provider verification tests to fail. Here are common examples:

### Common Examples

#### 1. Response Structure Changes

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

#### 2. New Required Fields

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
4. **Backward Compatibility**: Modify your code to accept both formats

## Best Practices

1. **Test Real Implementations**: Avoid mocking in provider tests
2. **Database State Management**: Use proper setup/teardown for test states
3. **Versioning**: Consider API versioning for breaking changes
4. **CI Integration**: Run contract tests on every build
5. **Focus on Examples**: Test realistic scenarios rather than every edge case
6. **State Handlers**: Define clear state handlers for different scenarios
7. **Use Matchers**: Leverage Pact matchers for flexible validation
8. **Small Contracts**: Keep contracts focused on specific interactions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Pact Contract Tests

on:
  pull_request:
    types:
      - edited
      - opened
      - synchronize
      - reopened

jobs:
  pact-flow:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
        
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'yarn'
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: Set up Pact Environment
        run: docker-compose up -d
        
      - name: Wait for Pact Broker
        run: |
          # Wait for Pact Broker to be ready
          echo "Waiting for Pact Broker to start..."
          timeout 60s bash -c 'until curl -s http://localhost:9292 > /dev/null; do sleep 1; done'
          
      - name: Run Consumer Tests
        run: yarn pact:consumer:verify
        
      - name: Publish Pacts
        run: yarn pact:consumer:publish
        
      - name: Verify Pacts
        run: yarn pact:provider:verify
        
      - name: Can I Deploy?
        run: yarn pact:can-i-deploy
```

## Conclusion

Contract testing with Pact ensures your microservices remain compatible as they evolve independently. By catching breaking changes early, you maintain reliability across your distributed system without slowing down development.

For more information, visit the [Pact documentation](https://docs.pact.io/).