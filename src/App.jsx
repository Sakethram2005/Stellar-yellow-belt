// src/App.jsx
import { useEffect, useState } from "react";
import { WALLET_LIST, connectWallet, disconnectWallet } from "./wallets";
import { getTotals, donate } from "./contract";
import { CONTRACT_ID, EXPLORER_TX, EXPLORER_CONTRACT } from "./stellarConfig";
import "./styles.css";

export default function App() {
  const [selectedWallet, setSelectedWallet] = useState("");
  const [address, setAddress]               = useState("");
  const [totalRaised, setTotalRaised]       = useState(null);
  const [donationCount, setDonationCount]   = useState(null);
  const [amount, setAmount]                 = useState("100");
  const [status, setStatus]                 = useState("idle"); // idle | pending | success | failed
  const [txHash, setTxHash]                 = useState("");
  const [errors, setErrors]                 = useState([]);
  const [loading, setLoading]               = useState(false);

  // ── Error helpers ───────────────────────────────────────────────────────────
  const addError = (type, msg) => {
    const labels = {
      wallet_not_found:    "⛔ Wallet Not Found",
      user_rejected:       "🚫 User Rejected",
      insufficient_balance:"💸 Insufficient Balance",
      invalid_input:       "⚠️ Invalid Input",
    };
    const label = labels[type] || "❌ Error";
    setErrors((prev) => [
      { id: Date.now(), label, msg, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  // ── Load totals ─────────────────────────────────────────────────────────────
  const loadTotals = async () => {
    try {
      const res = await getTotals();
      setTotalRaised(res.total_raised);
      setDonationCount(res.donation_count);
    } catch (e) {
      // Silently ignore — shows "—" until contract responds
    }
  };

  // ── On mount: restore session + load totals ─────────────────────────────────
  useEffect(() => {
    const savedAddr     = localStorage.getItem("stellar_address");
    const savedWalletId = localStorage.getItem("stellar_wallet_id");
    if (savedAddr)     setAddress(savedAddr);
    if (savedWalletId) setSelectedWallet(savedWalletId);
    loadTotals();
  }, []);

  // ── Poll totals every 10 s (real-time updates) ──────────────────────────────
  useEffect(() => {
    const interval = setInterval(loadTotals, 10_000);
    return () => clearInterval(interval);
  }, []);

  // ── Connect wallet ──────────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!selectedWallet) {
      addError("wallet_not_found", "Please select a wallet from the dropdown first.");
      return;
    }
    setLoading(true);
    try {
      const addr = await connectWallet(selectedWallet);
      setAddress(addr);
      localStorage.setItem("stellar_address", addr);
      localStorage.setItem("stellar_wallet_id", selectedWallet);
    } catch (e) {
      addError(e.type || "unknown", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Disconnect ──────────────────────────────────────────────────────────────
  const handleDisconnect = () => {
    disconnectWallet();
    setAddress("");
    setTxHash("");
    setStatus("idle");
    localStorage.removeItem("stellar_address");
    localStorage.removeItem("stellar_wallet_id");
  };

  // ── Donate ──────────────────────────────────────────────────────────────────
  const handleDonate = async (e) => {
    e.preventDefault();

    if (!address) {
      addError("wallet_not_found", "No wallet connected. Please connect first.");
      return;
    }

    const walletId = localStorage.getItem("stellar_wallet_id") || "freighter";

    setLoading(true);
    setStatus("pending");
    setTxHash("");

    try {
      const result = await donate({ sender: address, amount: Number(amount), walletId });
      setTxHash(result.hash);
      setStatus("success");
      await loadTotals();
    } catch (e) {
      addError(e.type || "unknown", e.message);
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Status badge config ─────────────────────────────────────────────────────
  const statusConfig = {
    idle:    { text: "Idle",           color: "#64748b" },
    pending: { text: "⏳ Pending…",    color: "#f59e0b" },
    success: { text: "✅ Success",     color: "#22c55e" },
    failed:  { text: "❌ Failed",      color: "#ef4444" },
  };
  const badge = statusConfig[status];

  // ── Shorten address for display ─────────────────────────────────────────────
  const shortAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : "";

  return (
    <div className="page">
      <div className="card">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <h1>🌟 Stellar Crowdfund</h1>
        <p style={{ color: "#94a3b8", marginTop: 0 }}>
          Yellow Belt — Live Soroban contract on Testnet
        </p>
        <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
          Contract:{" "}
          <a
            href={`${EXPLORER_CONTRACT}/${CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#38bdf8" }}
          >
            {CONTRACT_ID.slice(0, 12)}…{CONTRACT_ID.slice(-6)}
          </a>
        </p>

        {/* ── Wallet Picker ────────────────────────────────────────────────── */}
        <h2>Connect Wallet</h2>

        {/* Wallet options — satisfies multi-wallet screenshot requirement */}
        <div className="wallet-row">
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            disabled={!!address}
          >
            <option value="">-- Select wallet --</option>
            {WALLET_LIST.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} — {w.description}
              </option>
            ))}
          </select>

          {!address ? (
            <button onClick={handleConnect} disabled={loading}>
              {loading ? "Connecting…" : "Connect"}
            </button>
          ) : (
            <button className="secondary" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>

        {address && (
          <div className="box">
            <p>
              <strong>Connected ({selectedWallet}):</strong>
            </p>
            <code title={address}>{shortAddr(address)}</code>
          </div>
        )}

        {/* ── Live Totals ──────────────────────────────────────────────────── */}
        <h2>📊 Live Totals</h2>
        <div className="box">
          <p>
            <strong>Total Raised:</strong>{" "}
            {totalRaised === null ? "Loading…" : totalRaised}
          </p>
          <p>
            <strong>Donations:</strong>{" "}
            {donationCount === null ? "Loading…" : donationCount}
          </p>
          <button
            className="secondary"
            onClick={loadTotals}
            style={{ marginTop: 8 }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* ── Donate Form ──────────────────────────────────────────────────── */}
        <form onSubmit={handleDonate} className="form">
          <h2>💸 Donate</h2>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (u64 units)"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !address}>
            {loading && status === "pending"
              ? "Waiting for signature…"
              : "Donate"}
          </button>
          {!address && (
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
              Connect a wallet first.
            </p>
          )}
        </form>

        {/* ── Transaction Status ───────────────────────────────────────────── */}
        <div className="status">
          <p>
            <strong>Status:</strong>{" "}
            <span style={{ color: badge.color, fontWeight: 600 }}>
              {badge.text}
            </span>
          </p>
          {txHash && (
            <p>
              <strong>TX Hash:</strong>{" "}
              <a
                href={`${EXPLORER_TX}/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#38bdf8" }}
              >
                <code>
                  {txHash.slice(0, 16)}…{txHash.slice(-8)}
                </code>
              </a>{" "}
              <span style={{ fontSize: 11, color: "#64748b" }}>
                (click to verify on Stellar Explorer)
              </span>
            </p>
          )}
        </div>

        {/* ── Error Log ────────────────────────────────────────────────────── */}
        <div className="box">
          <h3>
            Error Log{" "}
            {errors.length > 0 && (
              <button
                className="secondary"
                onClick={() => setErrors([])}
                style={{ fontSize: 11, padding: "2px 8px", marginLeft: 8 }}
              >
                Clear
              </button>
            )}
          </h3>
          {errors.length === 0 ? (
            <p style={{ color: "#64748b" }}>No errors.</p>
          ) : (
            errors.map((err) => (
              <div
                key={err.id}
                style={{
                  marginBottom: 8,
                  padding: "8px 12px",
                  background: "#1e293b",
                  borderLeft: "3px solid #ef4444",
                  borderRadius: 6,
                }}
              >
                <strong style={{ color: "#f87171" }}>{err.label}</strong>
                <span
                  style={{ color: "#94a3b8", fontSize: 11, marginLeft: 8 }}
                >
                  {err.time}
                </span>
                <p
                  style={{ margin: "4px 0 0", color: "#cbd5e1", fontSize: 13 }}
                >
                  {err.msg}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
