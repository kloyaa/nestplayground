# Instructions for Demonstrating Contract Test Failures
Here's how to deliberately break the contract and observe the Pact verification failures. This is valuable for understanding how contract testing protects your services from breaking changes.

<h2>Step 1: Run the Consumer Tests First</h2>
First, run the consumer tests to generate the contract file:
```
  npm run test:consumer:pact
```