import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialDemo, demoStep } from '../src/demo.js';

test('walkthrough requires a credential and prevents repeat claims', () => {
  assert.deepEqual(demoStep(initialDemo, 'claim'), initialDemo);
  const issued = demoStep(initialDemo, 'issue');
  const claimed = demoStep(issued, 'claim');
  assert.equal(claimed.a, 10);
  assert.deepEqual(demoStep(claimed, 'claim'), claimed);
});
test('walkthrough exchange conserves the illustrated 100:1 rate', () => {
  assert.deepEqual(demoStep(initialDemo, 'exchange'), initialDemo);
  const claimed = demoStep(demoStep(initialDemo, 'issue'), 'claim');
  const exchanged = demoStep(claimed, 'exchange');
  assert.equal(exchanged.a, 0);
  assert.equal(exchanged.b, '0.1');
  assert.deepEqual(demoStep(exchanged, 'exchange'), exchanged);
  assert.deepEqual(demoStep(exchanged, 'reset'), initialDemo);
});
