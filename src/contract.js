// src/contract.js
import { CONTRACT_ID } from "./stellarConfig";

// Placeholder "read" call
export const getTotals = async () => {
  return {
    total_raised: 0,
    donation_count: 0,
  };
};

// Placeholder "write" call
export const donate = async ({ sender, amount }) => {
  if (!sender) {
    throw new Error("Sender wallet not connected");
  }
  if (!amount || Number(amount) <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const fakeHash =
    "FAKE_" +
    CONTRACT_ID.slice(0, 8) +
    "_" +
    Math.random().toString(16).substring(2, 10);

  return { hash: fakeHash };
};