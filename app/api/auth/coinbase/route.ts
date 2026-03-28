import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.COINBASE_CLIENT_ID;
  
  // Must match your CDP dashboard exactly!
  const redirectUri = "http://localhost:3000/api/auth/coinbase/callback"; 
  
  // The exact scopes you need, separated by spaces
  const scope = "wallet:user:read wallet:accounts:read wallet:transactions:send offline_access";
  
  // Build the pure URL with zero hidden parameters
  const authUrl = `https://login.coinbase.com/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=secure_random_state&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(authUrl);
}