import { z } from "zod";

export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.length ? i.path.join(".") : "root"}: ${i.message}`)
      .join("; ");
    throw new Error(msg);
  }
  return result.data;
}
