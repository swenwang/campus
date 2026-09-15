import { test, expect } from '@playwright/test';
import { Interface, parseEther } from 'ethers';
import { A_ADDRESS, B_ADDRESS, EX_ADDRESS, A_ABI, B_ABI, EX_ABI } from '../../src/protocol.js';

const student = '0x1111111111111111111111111111111111111111';
const teacher = '0x2222222222222222222222222222222222222222';

async function mockWallet(page, { legacy = false, rejected = false } = {}) {
  const calls = {};
  const encode = (address, abi, name, result) => {
    const iface = new Interface(abi);
    calls[address.toLowerCase() + iface.getFunction(name).selector] = iface.encodeFunctionResult(name, result);
  };
  encode(A_ADDRESS, A_ABI, 'owner', [teacher]);
  encode(A_ADDRESS, A_ABI, 'balanceOf', [parseEther('10')]);
  encode(B_ADDRESS, B_ABI, 'balanceOf', [0]);
  encode(B_ADDRESS, B_ABI, 'owner', [EX_ADDRESS]);
  encode(EX_ADDRESS, EX_ABI, 'aToken', [A_ADDRESS]);
  encode(EX_ADDRESS, EX_ABI, 'bToken', [B_ADDRESS]);
  encode(EX_ADDRESS, EX_ABI, 'getCurrentRate', [100]);
  if (!legacy) {
    encode(A_ADDRESS, A_ABI, 'ATTENDANCE_VERSION', [2]);
    encode(EX_ADDRESS, EX_ABI, 'EXCHANGE_VERSION', [2]);
  }
  await page.addInitScript(({ calls, student, rejected }) => {
    const listeners = {};
    let chain = '0x1';
    let accounts = [student];
    const emit = (event, value) => (listeners[event] || []).forEach((fn) => fn(value));
    window.ethereum = {
      isMetaMask: true,
      on(event, fn) { (listeners[event] ||= []).push(fn); },
      removeListener(event, fn) { listeners[event] = (listeners[event] || []).filter((item) => item !== fn); },
      async request({ method, params }) {
        if (method === 'eth_requestAccounts') { if (rejected) throw { code: 4001 }; return accounts; }
        if (method === 'eth_accounts') return accounts;
        if (method === 'eth_chainId') return chain;
        if (method === 'wallet_switchEthereumChain') { chain = params[0].chainId; emit('chainChanged', chain); return null; }
        if (method === 'eth_getCode') return '0x6000';
        if (method === 'eth_call') {
          const value = calls[params[0].to.toLowerCase() + params[0].data.slice(0, 10)];
          if (!value) throw { code: 3, message: 'execution reverted', data: '0x' };
          return value;
        }
        throw new Error(`Unexpected test RPC: ${method}`);
      },
    };
    window.changeTestAccount = () => { accounts = []; emit('accountsChanged', accounts); };
  }, { calls, student, rejected });
}

test('wallet-free walkthrough completes and resets without a wallet', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page.getByRole('link', { name: 'Try without a wallet' }).click();
  await expect(page.getByRole('button', { name: 'Claim sample reward', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Issue sample credential', exact: true }).click();
  await page.getByRole('button', { name: 'Claim sample reward', exact: true }).click();
  await page.getByRole('button', { name: 'Exchange 10 sample ATK', exact: true }).click();
  await expect(page.locator('.walkthrough-result')).toContainText('0 ATK · 0.1 BTK');
  await page.getByRole('button', { name: 'Reset walkthrough', exact: true }).click();
  await expect(page.locator('.walkthrough-result')).toContainText('0 ATK · 0 BTK');
  expect(errors).toEqual([]);
});
test('missing MetaMask keeps the workspace disconnected with instructions', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Connect MetaMask', exact: true }).click();
  await expect(page.locator('.status-bar')).toContainText('Install MetaMask');
  await expect(page.getByText('Not connected', { exact: true })).toBeVisible();
});
test('wallet rejection is displayed without a successful connection', async ({ page }) => {
  await mockWallet(page, { rejected: true });
  await page.goto('./');
  await page.getByRole('button', { name: 'Connect MetaMask', exact: true }).click();
  await expect(page.locator('.status-bar')).toContainText('Request cancelled');
  await expect(page.getByText('Not connected', { exact: true })).toBeVisible();
});
test('injected wallet loads version 2 and clears state after account change', async ({ page }) => {
  await mockWallet(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Connect MetaMask', exact: true }).click();
  await expect(page.locator('.status-bar')).toContainText('Version 2 contract configuration checked');
  await expect(page.getByRole('button', { name: 'Verify & claim 10 ATK', exact: true })).toBeEnabled();
  await page.evaluate(() => window.changeTestAccount());
  await expect(page.getByText('Not connected', { exact: true })).toBeVisible();
  await expect(page.locator('.status-bar')).toContainText('Reconnect');
});
test('legacy contracts remain read-only', async ({ page }) => {
  await mockWallet(page, { legacy: true });
  await page.goto('./');
  await page.getByRole('button', { name: 'Connect MetaMask', exact: true }).click();
  await expect(page.locator('.status-bar')).toContainText('read-only mode');
  await expect(page.getByRole('button', { name: 'Verify & claim 10 ATK', exact: true })).toBeDisabled();
});
test('mobile layout keeps content within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole('link', { name: 'Try without a wallet' })).toBeVisible();
});
