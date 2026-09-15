# Verification record

Recorded 2026-09-16 (Asia/Taipei), in an isolated GitHub Actions runner with Node 22.

[Complete preparation run](https://github.com/swenwang/campus/actions/runs/35000131399) tested the upgraded toolchain after generating the lockfiles recorded in commit `ae6184f33532f22becddb8210dbf90338f19f7bc`.

| Check | Result |
|---|---|
| Solidity compilation | All three contracts compiled with solc 0.8.37, optimizer 200, Cancun |
| TypeScript | Passed |
| Contract regression tests | 21 passed |
| Frontend unit tests | 17 passed |
| Frontend lint | Passed |
| Vite production build | Passed |
| Chromium browser smoke tests | 6 passed |
| Root dependency audit | 0 reported vulnerabilities |
| Frontend dependency audit | 0 reported vulnerabilities |
| Redacted local source/history scan | No matches for checked secret formats; existing public commit email retained with owner approval |

Browser tests cover:

1. Completing and resetting the wallet-free walkthrough without JavaScript page errors.
2. Missing MetaMask with actionable instructions and disconnected state.
3. Rejected connection without falsely reporting success.
4. Simulated EIP-1193 connection, Sepolia switch, version 2 data loading and session invalidation after account change.
5. Disabled write actions against simulated legacy contracts.
6. A 390px mobile viewport with no horizontal document overflow.

These are automated tests using local sample data and a simulated wallet provider. They do **not** constitute a real MetaMask extension/mobile-device acceptance test, an independent contract audit or a version 2 Sepolia deployment. The default legacy deployment stays read-only except for allowance revocation. See [deployment acceptance steps](DEPLOYMENT.md) and [security limits](../SECURITY.md).

Audit results are a dated snapshot of the checked lockfiles. New advisories can appear later; the ongoing CI/deployment gates check again rather than relying on this table.
