// src/App.jsx
import { useEffect, useState } from "react";
import { getWallets, connectWallet } from "./wallets";
import { getTotals, donate } from "./contract";
import "./styles.css";

export default function App() {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [address, setAddress] = useState("");
  const [totalRaised, setTotalRaised] = useState("0");
  const [donationCount, setDonationCount] = useState("0");
  const [amount, setAmount] = useState("10");

  const [status, setStatus] = useState("Idle");
  const [txHash, setTxHash] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const addError = (msg) => {
    setErrors((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

useEffect(() => {
  setWallets(getWallets());
}, []);

  const loadTotals = async () => {
    try {
      const res = await getTotals();
      setTotalRaised(res.total_raised.toString());
      setDonationCount(res.donation_count.toString());
      setStatus("Totals loaded");
    } catch (e) {
      addError("Failed to fetch totals: " + e.message);
    }
  };

  const handleConnect = async () => {
    if (!selectedWallet) {
      addError("Please select a wallet first");
      return;
    }
    try {
      setStatus("Connecting wallet...");
      const addr = await connectWallet(selectedWallet);
      setAddress(addr);
      setStatus("Wallet connected");
      await loadTotals();
    } catch (e) {
      // Error type 1: wallet not found / user rejected
      addError("Wallet connection failed: " + e.message);
      setStatus("Connection failed");
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!address) {
      // Error type 2: wallet not connected
      addError("Wallet not connected");
      return;
    }

    try {
      setLoading(true);
      setStatus("Transaction pending...");
      setTxHash("");

      const result = await donate({ sender: address, amount });
      setTxHash(result.hash || "");
      setStatus("Transaction successful");
      await loadTotals();
    } catch (e) {
      // Error type 3: insufficient amount / contract error
      addError("Donation failed: " + e.message);
      setStatus("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Yellow Belt Crowdfund</h1>
        <p>Multi-wallet + contract call + live status</p>

        {/* Wallet options */}
        <h2>Connect Wallet</h2>
        <div className="wallet-row">
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
          >
            <option value="">Select wallet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button onClick={handleConnect} disabled={loading}>
            Connect
          </button>
        </div>

        {address && (
          <div className="box">
            <p>
              <strong>Connected Address:</strong>
            </p>
            <code>{address}</code>
          </div>
        )}

        {/* Contract data */}
        <div className="box">
          <p>
            <strong>Total Raised:</strong> {totalRaised}
          </p>
          <p>
            <strong>Donation Count:</strong> {donationCount}
          </p>
        </div>

        {/* Donate form */}
        <form onSubmit={handleDonate} className="form">
          <h2>Donate</h2>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            Donate
          </button>
        </form>

        {/* Status + transaction hash */}
        <div className="status">
          <p>
            <strong>Status:</strong> {status}
          </p>
          {txHash && (
            <p>
              <strong>Transaction Hash:</strong> <code>{txHash}</code>
            </p>
          )}
        </div>

        {/* Error log */}
        <div className="box">
          <h3>Error Log</h3>
          {errors.length === 0 ? (
            <p>No errors yet.</p>
          ) : (
            errors.map((err, idx) => <p key={idx}>{err}</p>)
          )}
        </div>
      </div>
    </div>
  );
}