// src/wallets.js
import {
  requestAccess,
  setAllowed,
  getAddress,
  signTransaction as freighterSign,
} from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "./stellarConfig";

// ── Wallet list shown in UI picker ────────────────────────────────────────────
export const WALLET_LIST = [
  {
    id: "freighter",
    name: "Freighter",
    url: "https://www.freighter.app/",
    description: "Browser extension by Stellar Development Foundation",
  },
  {
    id: "xbull",
    name: "xBull",
    url: "https://xbull.app/",
    description: "Feature-rich Stellar wallet with DApp support",
  },
];

// ── Connect ───────────────────────────────────────────────────────────────────
export const connectWallet = async (walletId = "freighter") => {

  if (walletId === "freighter") {
    try {
      await requestAccess();
      await setAllowed();
      const { address } = await getAddress();
      if (!address) {
        const err = new Error("No address returned. Please unlock Freighter.");
        err.type = "wallet_not_found";
        throw err;
      }
      return address;
    } catch (e) {
      if (e.type) throw e;
      const msg = (e?.message || "").toLowerCase();

      // ── Error type 2: user rejected ──────────────────────────────────────
      if (
        msg.includes("reject") ||
        msg.includes("denied") ||
        msg.includes("cancel") ||
        msg.includes("declined")
      ) {
        const err = new Error("Connection rejected. Please approve in Freighter.");
        err.type = "user_rejected";
        throw err;
      }

      // ── Error type 1: not installed ──────────────────────────────────────
      const err = new Error(
        "Freighter not found. Please install it from freighter.app and refresh."
      );
      err.type = "wallet_not_found";
      throw err;
    }
  }

  if (walletId === "xbull") {
    // ── Error type 1: xBull not installed ───────────────────────────────────
    if (!window.xBullSDK) {
      const err = new Error(
        "xBull is not installed. Visit xbull.app to install it."
      );
      err.type = "wallet_not_found";
      throw err;
    }
    try {
      const result = await window.xBullSDK.connect();
      return result.publicKey;
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("reject") || msg.includes("cancel")) {
        const err = new Error("Connection rejected in xBull.");
        err.type = "user_rejected";
        throw err;
      }
      throw e;
    }
  }

  const err = new Error("Unknown wallet selected: " + walletId);
  err.type = "wallet_not_found";
  throw err;
};

// ── Sign transaction ──────────────────────────────────────────────────────────
export const signTx = async (xdr, address, walletId = "freighter") => {

  if (walletId === "xbull" && window.xBullSDK) {
    try {
      const { signedXDR } = await window.xBullSDK.signXDR(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      return signedXDR;
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("reject") || msg.includes("cancel")) {
        const err = new Error("Transaction rejected in xBull.");
        err.type = "user_rejected";
        throw err;
      }
      throw e;
    }
  }

  // Default: Freighter
  try {
    const result = await freighterSign(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address,
    });

    const signedXdr = result?.signedTxXdr ?? result;

    if (!signedXdr) {
      const err = new Error("Signing returned empty result. Did you reject it?");
      err.type = "user_rejected";
      throw err;
    }

    return signedXdr;
  } catch (e) {
    if (e.type) throw e;
    const msg = (e?.message || "").toLowerCase();

    // ── Error type 2: user rejected signing ──────────────────────────────
    if (
      msg.includes("reject") ||
      msg.includes("denied") ||
      msg.includes("cancel") ||
      msg.includes("declined")
    ) {
      const err = new Error("You rejected the transaction in Freighter.");
      err.type = "user_rejected";
      throw err;
    }
    throw e;
  }
};

// ── Disconnect ────────────────────────────────────────────────────────────────
export const disconnectWallet = () => true;