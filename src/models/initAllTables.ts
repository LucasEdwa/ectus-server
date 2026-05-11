import { initCompanyModel } from "./companyModel";
import { initUserModel } from "./userModel";
import { initExpenseCategoryModel } from "./expenseCategoryModel";
import { initExpenseModel } from "./expenseModel";
import { initBillModel } from "./billModel";
import { initPaylistModel } from "./paylistModel";
import { createClientsTable } from "./clientsModel";
import { initShiftModel } from "./shiftModel";
import { createDocumentsTable } from "./documentModel";
import { initTimeBalanceModel } from "./timeBalanceModel";
import { initShiftTrackingModel } from "./shiftTrackingModel";
import { initReportModel } from "./reportModel";
import { db } from "./db";

/**
 * FK-safe bootstrap order (no arbitrary delays):
 * companies → users → expense_categories → expenses → bills → paylists → clients → shifts → documents → time_balances → shift_tracking → reports
 */
export const initAllTables = async () => {
  await initCompanyModel();
  await initUserModel();
  await initExpenseCategoryModel();
  await initExpenseModel();
  await initBillModel();
  await initPaylistModel();
  await createClientsTable();
  await initShiftModel();
  await createDocumentsTable();
  await initTimeBalanceModel();
  await initShiftTrackingModel();
  await initReportModel();
};

export const dropAllTables = async () => {
  await db.query("SET FOREIGN_KEY_CHECKS = 0");

  await db.query("DROP TABLE IF EXISTS schema_migrations");
  await db.query("DROP TABLE IF EXISTS reports");
  await db.query("DROP TABLE IF EXISTS shift_tracking");
  await db.query("DROP TABLE IF EXISTS time_balances");
  await db.query("DROP TABLE IF EXISTS documents");
  await db.query("DROP TABLE IF EXISTS shifts");
  await db.query("DROP TABLE IF EXISTS clients");
  await db.query("DROP TABLE IF EXISTS paylists");
  await db.query("DROP TABLE IF EXISTS bills");
  await db.query("DROP TABLE IF EXISTS expenses");
  await db.query("DROP TABLE IF EXISTS expense_categories");
  await db.query("DROP TABLE IF EXISTS users_confirmations");
  await db.query("DROP TABLE IF EXISTS users");
  await db.query("DROP TABLE IF EXISTS companies");

  await db.query("SET FOREIGN_KEY_CHECKS = 1");
};
