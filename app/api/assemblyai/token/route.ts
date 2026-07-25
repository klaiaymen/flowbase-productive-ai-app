import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be signed in to use speech-to-text." },
        { status: 401 }
      );
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      console.error("ASSEMBLYAI_API_KEY is not defined in env");
      return NextResponse.json(
        { error: "missing_api_key", message: "AssemblyAI API key is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://streaming.assemblyai.com/v3/token?expires_in_seconds=60&max_session_duration_seconds=120",
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AssemblyAI token endpoint returned error:", errText);
      const isAuthError = response.status === 401 || response.status === 403;

      return NextResponse.json(
        {
          error: isAuthError ? "assemblyai_auth_failed" : "token_failed",
          message: isAuthError
            ? "AssemblyAI rejected the API key. Check ASSEMBLYAI_API_KEY."
            : "Failed to generate an AssemblyAI streaming token.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (!data.token) {
      return NextResponse.json(
        { error: "token_failed", message: "AssemblyAI token response did not include a token." },
        { status: 502 }
      );
    }

    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("Error in AssemblyAI token route:", error);
    return NextResponse.json(
      { error: "token_failed", message: "Failed to generate an AssemblyAI streaming token." },
      { status: 500 }
    );
  }
}
