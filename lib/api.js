// Small helpers so every API route handles errors the same way.
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth.js";
import { fieldErrors } from "./validation.js";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function handler(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) return json({ error: "Please fix the highlighted fields", fields: fieldErrors(err) }, 400);
      if (err instanceof HttpError) return json({ error: err.message, ...(err.extra || {}) }, err.status);
      if (err?.code === "23505") return json({ error: "That already exists" }, 409); // unique violation
      console.error(err);
      return json({ error: "Something went wrong on our side. Please try again." }, 500);
    }
  };
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Invalid request body");
  }
}
