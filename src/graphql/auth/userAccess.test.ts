import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/db", () => ({
  db: { query: vi.fn() },
}));

import { db } from "../../models/db";
import { resolveViewerCompanyId } from "./userAccess";

describe("resolveViewerCompanyId", () => {
  beforeEach(() => {
    vi.mocked(db.query).mockReset();
  });

  it("uses company_id from the JWT-derived viewer without querying MySQL", async () => {
    await expect(resolveViewerCompanyId({ id: 1, company_id: 42 })).resolves.toBe(42);
    expect(db.query).not.toHaveBeenCalled();
  });

  it("falls back to the database when company_id is missing", async () => {
    vi.mocked(db.query).mockResolvedValueOnce([[{ company_id: 7 }]] as never);
    await expect(resolveViewerCompanyId({ id: 99 })).resolves.toBe(7);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
