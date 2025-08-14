import { NextResponse } from "next/server";
import { seedEzraFirstTurn } from "../../../../lib/ezra";

export async function POST(req){
  const ctx = await req.json();
  // In production, replace with a call to OpenAI API to compose first message.
  const message = seedEzraFirstTurn(ctx);
  return NextResponse.json({ message });
}
