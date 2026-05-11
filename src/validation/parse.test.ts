import { describe, it, expect } from "vitest";
import { parseInput } from "./parse";
import { loginSchema } from "./schemas";

describe("parseInput", () => {
  it("returns coerced payload when valid", () => {
    expect(parseInput(loginSchema, { email: "hello@test.dev", password: "secret12" })).toEqual({
      email: "hello@test.dev",
      password: "secret12",
    });
  });

  it("throws an aggregated message when validation fails", () => {
    expect(() =>
      parseInput(loginSchema, { email: "not-an-email", password: "" })
    ).toThrow(/email|password/i);
  });
});
