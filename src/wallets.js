// src/wallets.js
import {
  requestAccess,
  setAllowed,
  getAddress,
} from "@stellar/freighter-api";

// Simple wallet options list for UI (multi-wallet-like)
export const getWallets = () => {
  return [
    { id: "freighter", name: "Freighter" },
  ];
};

export const connectWallet = async (walletId) => {
  if (walletId !== "freighter") {
    throw new Error("Unsupported wallet");
  }

  // Ask Freighter for access
  await requestAccess();
  await setAllowed();
  const { address } = await getAddress();

  return address;
};

export const disconnectWallet = async () => {
  // Freighter has no explicit disconnect; clear UI state only
  return true;
};