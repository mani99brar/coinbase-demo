import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    console.log("CALLBACK RECEIVEd",searchParams);
    
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  if (error) {
    return NextResponse.json({ error: "User denied authorization" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

    try {
    // Make the secure server-to-server request to get the tokens
    const response = await fetch("https://login.coinbase.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.COINBASE_CLIENT_ID as string,
        client_secret: process.env.COINBASE_CLIENT_SECRET as string,
        redirect_uri: "http://localhost:3000/api/auth/coinbase/callback",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Coinbase Token Error:", data);
      return NextResponse.json({ error: "Failed to trade code for token" }, { status: response.status });
    }

    // Save tokens securely in HTTP-only cookies
    cookies().set("cb_access_token", data.access_token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 7200, path: "/",
    });
    
    cookies().set("cb_refresh_token", data.refresh_token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 2592000, path: "/",
    });

    // Redirect the user back to your frontend
    return NextResponse.redirect(new URL("/", request.url));

  } catch (error) {
    console.error("OAuth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}