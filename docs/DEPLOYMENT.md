# Run and deploy

## Local development

Use Node.js 22.13+ in the Node 22 series. No real wallet or credentials are required for tests or the interactive walkthrough.

```sh
npm ci
npm run compile
npm run typecheck
npm test
cd frontend
npm ci
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

The Vite base path is `/campus/` for GitHub Pages. Open the local URL printed by Vite with that path. `npm run check:solidity` is an in-memory compilation check; it does not execute contract tests.

## Sepolia version 2 deployment

Only deploy after tests and dependency checks pass. Use a dedicated account containing Sepolia test ETH. Copy the root `.env.example` to `.env` and set `SEPOLIA_RPC_URL` and `PRIVATE_KEY` locally. Never publish this file, paste its contents into an issue, or use a wallet holding real assets.

```sh
npm run deploy:sepolia
```

This sends public transactions and spends test ETH. The deployer remains AToken's owner (teacher). BToken ownership moves to RewardExchange so it can mint rewards. Public addresses are written to `deployments/11155111.json`. If deployment fails partway, inspect the addresses/transactions already printed before retrying.

Copy `frontend/.env.example` to `frontend/.env.local` and set all three **public** addresses from this deployment:

```dotenv
VITE_A_TOKEN_ADDRESS=0x...
VITE_B_TOKEN_ADDRESS=0x...
VITE_EXCHANGE_ADDRESS=0x...
```

Vite embeds `VITE_` values in public JavaScript. Never put API credentials, private keys or personal data there. New deployments start with new balances and claim history; migration from the legacy contracts is not implemented.

For Pages, set repository Variables with the same three names. The deploy workflow builds and checks the code before publishing. Without these variables, the interface uses the legacy addresses for inspection; unsafe legacy attendance/exchange actions stay disabled.

## Real-wallet acceptance checklist

Use test accounts and opaque class codes, not real student identities.

1. Reject a MetaMask connection and confirm the interface stays disconnected. Retry and accept Sepolia.
2. Verify the three addresses, contract code, token wiring and BToken ownership against the deployment record.
3. Change account/network or lock the wallet; confirm actions clear until reconnection.
4. As teacher, issue a credential for the student's address. Share class code, expiry and signature.
5. As that student, claim once. Verify a repeat claim and another wallet's copied credential fail.
6. Review a quote, inspect the exact AToken approval in MetaMask, exchange and check the receipt/balances.
7. Cancel after approval and use Revoke exchange allowance. Confirm the remaining allowance is zero.
8. Confirm stale maximum prices and requests exceeding the 100 BTK cap revert.

The browser walkthrough is simulated and cannot replace this acceptance test. No version 2 Sepolia deployment or real-wallet acceptance result is claimed by this repository until recorded explicitly.
