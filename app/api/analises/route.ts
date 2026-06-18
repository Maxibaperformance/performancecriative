import { NextResponse } from "next/server";
import { listarAnalises } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listarAnalises());
}
