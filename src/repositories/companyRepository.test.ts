import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/db", () => ({
  db: { query: vi.fn() },
}));

import { db } from "../models/db";
import { findCompanyById } from "./companyRepository";

describe("companyRepository", () => {
  beforeEach(() => {
    vi.mocked(db.query).mockReset();
  });

  it("maps MySQL rows to a domain row", async () => {
    vi.mocked(db.query).mockResolvedValueOnce([[{ id: 1, name: "Acme AB" }]] as never);
    await expect(findCompanyById(1)).resolves.toEqual({ id: 1, name: "Acme AB" });
    expect(db.query).toHaveBeenCalledWith("SELECT * FROM companies WHERE id = ?", [1]);
  });

  it("returns null when the row does not exist", async () => {
    vi.mocked(db.query).mockResolvedValueOnce([[]] as never);
    await expect(findCompanyById(999)).resolves.toBeNull();
  });
});
