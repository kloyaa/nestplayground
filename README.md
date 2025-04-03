# Instructions for Demonstrating Contract Test Failures
Here's how to deliberately break the contract and observe the Pact verification failures. This is valuable for understanding how contract testing protects your services from breaking changes.

<h2>Step 1: Run the Consumer Tests First</h2>
<p>First, run the consumer tests to generate the contract file:</p>
<pre>
    yarn test -- users.consumer.pact
</pre>
<p>This will generate a Pact file (pacts/MyConsumer-MyProvider.json) based on the consumer's expectations.</p>
<h2>Step 2: Introduce Breaking Changes</h2>
<p>Now, introduce one of the breaking changes I provided above:</p>
<b>Breaking Change Option 1: Change Response Structure</b>
<p>Modify your UsersService.createUser method to return fields with different names:</p>
<pre>
  Change id to userId
  Change username to userName
  Change createdAt to createdOn
  Change updatedAt to updatedOn
</pre>