import { db } from "../../models/db";

export const userResolvers = {
  Query: {
    async users() {
      const [rows]: any = await db.query("SELECT id, name, email, role FROM users");
      return rows;
    },
    async roles() {
      return ["employee", "leader", "finance", "hr"];
    }
  }
};
