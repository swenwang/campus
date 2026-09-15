import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { ethers } from 'ethers';
import { assertWalletAccount, subscribeWallet, getMetaMask, connectMetaMask, SEPOLIA, walletError } from '../src/wallet.js';
import { parseAmount, validateClassId, attendanceDomain, attendanceTypes } from '../src/protocol.js';

function provider({ chain = SEPOLIA, failure, unknown = false, accounts = ['0x123'] } = {}) {
  const calls = [];
  return { calls, isMetaMask: true, async request(input) {
    calls.push(input);
    if (failure) throw failure;
    if (input.method === 'eth_requestAccounts') return accounts;
    if (input.method === 'eth_chainId') return chain;
    if (input.method === 'wallet_switchEthereumChain') {
      if (unknown) { unknown = false; throw { code: 4902 }; }
      chain = input.params[0].chainId;
    }
  } };
}
test('missing MetaMask reports installation instructions', async () => {
  await assert.rejects(connectMetaMask(null), /Install MetaMask/);
});
test('wallet listeners handle account, chain and disconnect changes and clean up', () => {
  const mm = new EventEmitter();
  let changes = 0;
  const unsubscribe = subscribeWallet(mm, () => changes++);
  for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) mm.emit(event);
  assert.equal(changes, 3);
  unsubscribe();
  for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) {
    mm.emit(event);
    assert.equal(mm.listenerCount(event), 0);
  }
  assert.equal(changes, 3);
});
test('transaction guard rejects wrong chain, changed account and locked wallet', async () => {
  for (const [chain, accounts] of [['0x1', ['0x123']], [SEPOLIA, ['0x456']], [SEPOLIA, []]]) {
    const mm = { async request({ method }) { return method === 'eth_chainId' ? chain : accounts; } };
    await assert.rejects(assertWalletAccount(mm, '0x123'), /Wallet changed/);
  }
});
test('transaction guard accepts the expected account without prompting for access', async () => {
  const methods = [];
  const mm = { async request({ method }) { methods.push(method); return method === 'eth_chainId' ? SEPOLIA : ['0xaBc']; } };
  await assertWalletAccount(mm, '0xAbC');
  assert.deepEqual(methods, ['eth_chainId', 'eth_accounts']);
});
test('selects MetaMask from multiple injected wallets', () => {
  const mm = provider();
  assert.equal(getMetaMask({ ethereum: { providers: [{ isMetaMask: false }, mm] } }), mm);
  assert.equal(getMetaMask({ ethereum: {} }), null);
});
test('connects on Sepolia without a network prompt', async () => {
  const mm = provider();
  assert.equal(await connectMetaMask(mm), '0x123');
  assert.ok(!mm.calls.some((call) => call.method === 'wallet_switchEthereumChain'));
});
test('switches from another network before reporting connected', async () => {
  const mm = provider({ chain: '0x1' });
  await connectMetaMask(mm);
  assert.equal(mm.calls.find((call) => call.method === 'wallet_switchEthereumChain').params[0].chainId, SEPOLIA);
});
test('adds an unknown Sepolia chain and verifies the switch', async () => {
  const mm = provider({ chain: '0x1', unknown: true });
  await connectMetaMask(mm);
  assert.equal(mm.calls.filter((call) => call.method === 'wallet_switchEthereumChain').length, 2);
  assert.equal(mm.calls.find((call) => call.method === 'wallet_addEthereumChain').params[0].chainId, SEPOLIA);
});
test('empty or rejected account access is not success', async () => {
  await assert.rejects(connectMetaMask(provider({ accounts: [] })), /No wallet account/);
  await assert.rejects(connectMetaMask(provider({ failure: { code: 4001 } })), { code: 4001 });
});
test('wrong chain after an apparently successful switch fails closed', async () => {
  const mm = { async request({ method }) { return method === 'eth_requestAccounts' ? ['0x123'] : '0x1'; } };
  await assert.rejects(connectMetaMask(mm), /Switch MetaMask to Sepolia/);
});
test('rejected and pending prompts have actionable error text', () => {
  assert.match(walletError({ code: 4001 }), /cancelled/);
  assert.match(walletError({ code: 'ACTION_REJECTED' }), /cancelled/);
  assert.match(walletError({ code: -32002 }), /already open/);
});
test('amount parsing preserves a single wei without floating point arithmetic', () => {
  assert.equal(parseAmount('0.000000000000000001'), 1n);
  assert.equal(parseAmount('99.123456789012345678'), 99123456789012345678n);
});
test('invalid, zero, excessive and scientific notation amounts are rejected', () => {
  for (const value of ['', '0', '-1', 'Infinity', 'NaN', '1e2', '1.0000000000000000001', '101', ' 1', '01']) {
    assert.throws(() => parseAmount(value));
  }
});
test('class IDs are bounded by UTF-8 bytes', () => {
  assert.equal(validateClassId('  lesson  '), 'lesson');
  assert.throws(() => validateClassId(''));
  assert.throws(() => validateClassId('課'.repeat(43)));
});
test('typed credential binds recipient, contract, chain, class and expiry', async () => {
  const teacher = ethers.Wallet.createRandom();
  const student = ethers.Wallet.createRandom().address;
  const domain = attendanceDomain(11155111);
  const value = { classId: 'Math', student, deadline: 1900000000 };
  const signature = await teacher.signTypedData(domain, attendanceTypes, value);
  assert.equal(ethers.verifyTypedData(domain, attendanceTypes, value, signature), teacher.address);
  for (const changed of [{ ...value, classId: 'Other' }, { ...value, student: teacher.address }, { ...value, deadline: 1900000001 }]) {
    assert.notEqual(ethers.verifyTypedData(domain, attendanceTypes, changed, signature), teacher.address);
  }
  for (const changed of [{ ...domain, chainId: 1 }, { ...domain, verifyingContract: student }]) {
    assert.notEqual(ethers.verifyTypedData(changed, attendanceTypes, value, signature), teacher.address);
  }
});
