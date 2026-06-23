# Yellow Belt Crowdfund

A simple Soroban-based crowdfunding dApp built for the Soroban Scout Yellow Belt project.

This project demonstrates:

- Wallet integration (Freighter) from the browser
- Invoking a deployed Soroban contract
- Live transaction status (pending / success / fail)
- Frontend error handling for wallet and contract calls

## Contract

- **Network**: Stellar Testnet
- **Deployer address**: GDB54GMX5MI5X5ETVUWPKY6JJMOHRT4KK2WM5ECR57WLPYYYN6ZCE37L
- **Contract ID**: `CAGCF57GLRAD7DQ3N6EYQJW34C3HQU5X4LACKZBTPRPDYEDN4X6P33UL`

Deployment transactions (for verification):

- Install Wasm TX: `840b11031de52ed86d50a38ec2cb0852fd1776402850937214b040f4d17f420f`
- Deploy contract TX: `51b9462d987a68f2e84ea43f7ad6d39640e191ab144a8c18cf1f823f0b976dc0`

## Tech stack

- React + Vite
- `@stellar/freighter-api` for browser wallet integration
- Deployed Soroban contract written in Rust and built with `soroban-sdk = "22"`

## Features

### Wallet integration

- Shows Freighter as a selectable wallet.
- Connects to Freighter from the browser and displays the user’s public key.
- Handles wallet connection errors (no wallet, user rejects, unsupported wallet).

### Contract interaction

- Uses a deployed Soroban contract (ID above).
- Frontend exposes:
  - `Total Raised`
  - `Donation Count`
- `Donate` button simulates a contract call and returns a transaction hash-like string.

### Transaction status & error handling

- Status values: `Idle`, `Connecting wallet…`, `Totals loaded`, `Transaction pending…`, `Transaction successful`, `Transaction failed`.
- Error log captures:
  - Wallet connection failures
  - “Wallet not connected” when donating
  - Invalid amount / simulated contract errors

## How to run locally

```bash
# In soroban-crowdfund/yellow-belt-crowdfund
npm install
npm install @stellar/freighter-api @stellar/stellar-sdk
npm run dev
```

Then open `http://localhost:5173/` in your browser.

## Screenshots (examples)

1. Wallet selection and connection UI.
2. Connected address + totals.
3. Donation with status + transaction hash.
4. Error log with at least one error message.