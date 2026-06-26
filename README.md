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
<img width="1012" height="396" alt="image" src="https://github.com/user-attachments/assets/451d624b-1c6a-4610-8971-dfc3dda1015f" />

2. Connected address + totals.
<img width="1011" height="731" alt="image" src="https://github.com/user-attachments/assets/4fa2f096-4d59-4667-8ec4-01a99a2f5757" />

3. Donation with status + transaction hash.
<img width="1012" height="437" alt="image" src="https://github.com/user-attachments/assets/db97bbaf-65e3-4c86-8587-37b40a536203" />

4. Error log with at least one error message.
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4ee89edf-65e5-408d-98bb-3039cb4d0f45" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5769ee0f-e8ee-4d39-a734-96635610c77f" />

