// src/contract.js
import * as StellarSdk from "@stellar/stellar-sdk";
import { signTx } from "./wallets";
import {
  CONTRACT_ID,
  NETWORK_PASSPHRASE,
  RPC_URL,
  HORIZON_URL,
} from "./stellarConfig";

// SDK v16 uses StellarSdk.rpc instead of StellarSdk.SorobanRpc
const rpc = new StellarSdk.rpc.Server(RPC_URL);
const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);

// ─────────────────────────────────────────────────────────────────────────────
// READ: get_totals — no wallet needed
// Returns { total_raised: number, donation_count: number }
// ─────────────────────────────────────────────────────────────────────────────
export const getTotals = async () => {
  // Well-known funded testnet account used as dummy source for simulation
  const DUMMY = "GDB54GMX5MI5X5ETVUWPKY6JJMOHRT4KK2WM5ECR57WLPYYYN6ZCE37L";

  const account = await horizon.loadAccount(DUMMY);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_totals"))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(sim)) {
    throw new Error("get_totals simulation failed: " + sim.error);
  }

  // Contract returns Vec<u64>: [total_raised, donation_count]
  const vec = sim.result.retval.vec();
  const total_raised = Number(vec[0].u64());
  const donation_count = Number(vec[1].u64());

  return { total_raised, donation_count };
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE: donate
// sender:   G... address string
// amount:   positive integer (u64 units, e.g. 100)
// walletId: "freighter" | "xbull"
// Returns { hash: string }
// ─────────────────────────────────────────────────────────────────────────────
export const donate = async ({ sender, amount, walletId = "freighter" }) => {

  // ── Error type 1: wallet not connected ──────────────────────────────────────
  if (!sender) {
    const err = new Error("Wallet not connected. Please connect first.");
    err.type = "wallet_not_found";
    throw err;
  }

  // ── Error type 2: invalid amount ────────────────────────────────────────────
  if (!amount || Number(amount) <= 0) {
    const err = new Error("Amount must be greater than zero.");
    err.type = "invalid_input";
    throw err;
  }

  // Load sender account
  let account;
  try {
    account = await horizon.loadAccount(sender);
  } catch {
    const err = new Error(
      "Could not load your account. Make sure it is funded on testnet."
    );
    err.type = "wallet_not_found";
    throw err;
  }

  // ── Error type 3: insufficient balance ──────────────────────────────────────
  const native = account.balances.find((b) => b.asset_type === "native");
  const xlmBalance = parseFloat(native?.balance || "0");
  if (xlmBalance < 1) {
    const err = new Error(
      `Insufficient balance. You have ${xlmBalance.toFixed(4)} XLM. Need at least 1 XLM for fees.`
    );
    err.type = "insufficient_balance";
    throw err;
  }

  // ── Build transaction ────────────────────────────────────────────────────────
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  // donor is Bytes in contract — encode sender's raw 32-byte public key
  const keypair = StellarSdk.Keypair.fromPublicKey(sender);
  const donorBytes = StellarSdk.xdr.ScVal.scvBytes(keypair.rawPublicKey());

  const amountVal = StellarSdk.xdr.ScVal.scvU64(
    new StellarSdk.xdr.Uint64(BigInt(Math.floor(Number(amount))))
  );

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("donate", donorBytes, amountVal))
    .setTimeout(180)
    .build();

  // ── Simulate to get footprint + resource fee ─────────────────────────────────
  const sim = await rpc.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(sim)) {
    const msg = sim.error || "";
    if (
      msg.toLowerCase().includes("insufficient") ||
      msg.toLowerCase().includes("balance")
    ) {
      const err = new Error("Insufficient balance detected by contract.");
      err.type = "insufficient_balance";
      throw err;
    }
    throw new Error("Contract simulation error: " + msg);
  }

  // ── Assemble (injects footprint + resource fee) ──────────────────────────────
  const assembled = StellarSdk.rpc.assembleTransaction(tx, sim).build();

  // ── Sign with selected wallet ────────────────────────────────────────────────
  let signedXdr;
  try {
    signedXdr = await signTx(assembled.toXDR(), sender, walletId);
  } catch (e) {
    if (e.type) throw e;
    const msg = (e?.message || "").toLowerCase();
    if (
      msg.includes("reject") ||
      msg.includes("denied") ||
      msg.includes("cancel") ||
      msg.includes("declined")
    ) {
      const err = new Error("You rejected the transaction in your wallet.");
      err.type = "user_rejected";
      throw err;
    }
    throw e;
  }

  // ── Submit to Soroban RPC ────────────────────────────────────────────────────
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  );

  const sendResult = await rpc.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(
      "Submission failed: " +
        (sendResult.errorResult?.result().toString() || "unknown error")
    );
  }

  // ── Poll until confirmed (max ~60s) ──────────────────────────────────────────
  const hash = sendResult.hash;
  let attempts = 0;

  while (attempts < 24) {
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await rpc.getTransaction(hash);

    if (poll.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return { hash };
    }

    if (poll.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed on-chain. Hash: ${hash}`);
    }

    attempts++;
  }

  throw new Error("Timed out waiting for confirmation. Check explorer: " + hash);
};