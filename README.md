# Instructions for Demonstrating Contract Test Failures
Here's how to deliberately break the contract and observe the Pact verification failures. This is valuable for understanding how contract testing protects your services from breaking changes.

<h2>Step 1: Run the Consumer Tests First</h2>
First, run the consumer tests to generate the contract file:
<code>
  yarn test -- users.consumer.pact
</code>
This will generate a Pact file (pacts/MyConsumer-MyProvider.json) based on the consumer's expectations.

<h2>Step 2: Introduce Breaking Changes</h2>
Now, introduce one of the breaking changes I provided above:
<b>Breaking Change Option 1: Change Response Structure</b>
<pre>
Modify your UsersService.createUser method to return fields with different names:

Change id to userId
Change username to userName
Change createdAt to createdOn
Change updatedAt to updatedOn
</pre>