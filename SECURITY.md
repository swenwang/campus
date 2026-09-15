# Security and prototype scope

Campus Token is a coursework/portfolio prototype for Sepolia test ETH. Do not use it for real funds, official attendance records or sensitive student data. Tests and dependency scans reduce risk; they are not an independent security audit or a guarantee of safety.

## Protections in version 2

- EIP-712 credentials bind the student's wallet, class ID, expiry, chain ID and AToken contract. Claims are limited to one per wallet/class.
- The teacher interface defaults to a 15-minute expiry. The contract enforces the signed deadline.
- Exchange orders pay for every 5 BTK supply tier they cross, are bounded by the 100 BTK supply cap, and enforce the student's maximum AToken cost.
- The interface uses exact integer amounts, explicit quotes, limited allowances and an allowance-revocation action.
- Account/network changes invalidate the wallet session. Legacy contracts are read-only except for revoking an existing allowance.

## Trust and privacy limits

- The teacher owner can mint AToken manually and transfer ownership. The teacher must verify identity/attendance outside the blockchain.
- A wallet is not a verified student identity. Multiple wallets, voluntary token transfers and teacher-key compromise remain outside this prototype's controls.
- The owner can sign a longer deadline; there is no individual-credential revocation list. Changing owner invalidates unclaimed signatures from the old owner.
- Attendance transactions expose class ID, wallet, signature and expiry permanently. Never put names, student numbers or personal information in a class code.
- Connecting exposes the public wallet address to this site. RPC providers receive chain requests; GitHub Pages receives normal HTTP metadata. The frontend does not request seed phrases/private keys or add analytics.
- Version getters and matching addresses are compatibility checks, not proof of an authentic or audited contract. Verify deployments independently.
- New contracts do not migrate old balances or claims. Merchant redemption and campus identity integration are future work.

## Repository checks

The workflows run frontend tests/lint/build, contract compilation/tests/type checking, a redacted heuristic secret scan and dependency audits. High-severity advisories block deployment. Review the latest workflow result and lockfiles instead of treating an old scan count as permanent.

`scripts/check-public.ps1` checks tracked/unignored files and reachable Git blobs for common secret formats without printing values. This is a limited heuristic, not exhaustive secret detection. Local `.env`, wallet backups and credential files are ignored. Public commit email history is retained intentionally.

Do not post private keys, seed phrases, API tokens or raw credential-bearing logs in public issues. If a secret was exposed, deleting a file is insufficient: revoke/rotate it and assess any affected accounts. Rewriting history cannot recall forks or downloaded copies.
