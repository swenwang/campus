# Campus Token DApp

🔗 **Live Demo:** https://swenwang.github.io/campus/

A blockchain-based classroom attendance and reward system built with Solidity, Hardhat, React, ethers.js, and MetaMask on the Sepolia test network.

## Overview

The project explores how a token-based incentive mechanism can be combined with classroom attendance. Teachers generate a signed attendance credential for a class session, while students submit the class ID and signature through the DApp to claim reward tokens. Students can then approve and exchange A Tokens for B Tokens through a smart-contract exchange mechanism.

## Core Features

- MetaMask wallet connection and Sepolia network support
- Teacher/student role detection based on the AToken contract owner
- Teacher-generated digital signatures for class attendance
- Student attendance claim with replay protection handled by the smart contract
- ERC-20 token balances displayed in the frontend
- AToken approval and AToken-to-BToken exchange flow
- Hardhat deployment scripts and contract tests

## Architecture

```text
campus/
├── contracts/              # Solidity smart contracts
│   ├── AToken.sol
│   ├── BToken.sol
│   └── RewardExchange.sol
├── frontend/               # React + Vite DApp
│   └── src/
├── scripts/                # Deployment and signing utilities
├── test/                   # Hardhat tests
├── hardhat.config.ts
├── .env.example
└── README.md
```

## Tech Stack

- **Smart Contracts:** Solidity, OpenZeppelin ERC-20
- **Development:** Hardhat, TypeScript
- **Frontend:** React, Vite
- **Web3:** ethers.js, MetaMask
- **Network:** Ethereum Sepolia testnet

## Run Locally

### 1. Install smart-contract dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

Never commit your real private key or API credentials.

### 3. Compile and test contracts

```bash
npx hardhat compile
npx hardhat test
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Team Contribution

This was a team course project. My primary responsibility was the **frontend DApp implementation**, including wallet connection, role-based navigation, token balance display, attendance claim flow, token approval, and exchange interactions through ethers.js.

Other team responsibilities included smart-contract development and backend-related work.

## Notes

The contract addresses currently referenced by the frontend correspond to the deployment used during development. This repository is intended as an academic/project portfolio demonstration rather than a production financial application.
