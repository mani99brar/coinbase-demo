"use client";

import { useState, useEffect } from "react";
import { useEvmAddress } from "@coinbase/cdp-hooks";

export default function FundFromCoinbaseApp() {
  // Web3 State: The destination (Embedded Wallet)
  const { evmAddress } = useEvmAddress();
  
  // Web2 State: Are they connected to Coinbase?
  const [isCbConnected, setIsCbConnected] = useState<boolean | null>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ETH");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Check connection status on load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        setIsCbConnected(data.isAuthenticated);
      } catch (error) {
        setIsCbConnected(false);
      }
    };
    checkStatus();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evmAddress || !amount) return;

    setIsSending(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/coinbase/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: evmAddress, 
          amount: amount,
          currency: currency,
          network: "base" 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the server says unauthorized, forcefully log them out of the UI
        if (response.status === 401) setIsCbConnected(false);
        throw new Error(data.error || "Failed to initiate transfer");
      }
      
      setStatusMessage(`Success! Transaction ID: ${data.transactionId}`);
      setAmount(""); 
    } catch (error: any) {
      console.error("Transfer failed:", error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch("/api/auth/disconnect", { method: "POST" });
    setIsCbConnected(false);
  };

  // State 1: User hasn't connected their CDP Embedded Wallet yet
  if (!evmAddress) {
    return (
      <div className="p-4 border rounded-lg max-w-md bg-gray-50 text-black">
        <p className="text-sm">Please create or sign in to your AutoHODL wallet first.</p>
      </div>
    );
  }

  // Still checking status... show a loading state
  if (isCbConnected === null) {
    return <div className="p-5 max-w-md text-center text-sm text-gray-500">Loading connection status...</div>;
  }

  return (
    <div className="p-5 border rounded-lg max-w-md bg-white shadow-sm text-black">
      <h2 className="text-xl font-bold mb-1">Fund Your Savings</h2>
      <p className="text-sm text-gray-500 mb-5">
        Pull funds directly from your Coinbase account into your on-chain wallet.
      </p>

      {/* State 2: User needs to connect their Coinbase App */}
      {!isCbConnected && (
        <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-center text-blue-800 mb-3">
            Connect your Coinbase account to authorize withdrawals.
          </p>
          <a 
            href="/api/auth/coinbase"
            className="bg-[#0052FF] text-white px-4 py-2 rounded-full font-medium inline-block text-center hover:bg-blue-700 transition-colors"
          >
            Connect Coinbase App
          </a>
        </div>
      )}

      {/* State 3: User is fully connected, show the transfer form */}
      {isCbConnected && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded border text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Coinbase App</span>
              <span className="font-medium text-green-600">Connected</span>
            </div>
            <button 
              onClick={handleDisconnect} 
              type="button"
              className="text-red-500 hover:text-red-700 text-xs font-medium underline"
            >
              Disconnect
            </button>
          </div>

          <form onSubmit={handleSend} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <div className="w-full p-2 border rounded bg-gray-100 text-gray-500 text-xs font-mono break-all">
                {evmAddress}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input 
                  type="number" 
                  step="0.000001"
                  placeholder="0.01" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded text-black outline-blue-500"
                  required
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2 border rounded text-black bg-white outline-blue-500"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSending}
              className="bg-[#0052FF] text-white p-3 rounded-lg mt-2 font-medium disabled:bg-blue-300 transition-colors"
            >
              {isSending ? "Processing Withdrawal..." : "Pull Funds to Savings"}
            </button>
          </form>

          {statusMessage && (
            <div className={`p-3 rounded-md text-sm ${statusMessage.includes("Error") ? "bg-red-50 text-red-800 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
              <p>{statusMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}