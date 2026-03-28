import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { toAddress, amount, currency, network } = await request.json();

    // 1. Get the user's OAuth Access Token and Account ID from your database/session
    // You must implement the Coinbase OAuth flow before this step to get these!
    const userAccessToken = "YOUR_USERS_OAUTH_ACCESS_TOKEN"; 
    const accountId = "YOUR_USERS_COINBASE_ACCOUNT_ID"; 

    // 2. Generate a UUID for idempotency (prevents accidental double-sends)
    const idempotencyKey = crypto.randomUUID();

    // 3. Make the secure server-to-server call to Coinbase
    const response = await fetch(`https://api.coinbase.com/v2/accounts/${accountId}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAccessToken}`
      },
      body: JSON.stringify({
        type: "send",
        to: toAddress,
        amount: amount,
        currency: currency,
        idem: idempotencyKey,
        network: network // e.g., "base"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Coinbase API Error:", data);
      return NextResponse.json({ error: data.errors?.[0]?.message || "API Error" }, { status: response.status });
    }

    // 4. Return success to your React frontend
    return NextResponse.json({ success: true, transactionId: data.data.id });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}