import dotenv from "dotenv";
import { runPendingSqlMigrations } from "./runPendingSqlMigrations";

dotenv.config();

runPendingSqlMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
