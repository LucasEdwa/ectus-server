import { initCompanyModel } from "./companyModel";
import { initUserModel } from "./userModel";
import { initPaylistModel } from "./paylistModel";
import { initExpenseCategoryModel } from "./expenseCategoryModel";
import { initExpenseModel } from "./expenseModel";
import { initBillModel } from "./billModel";
import {db} from "./db"; // Assuming you have a db module to handle database connections

export const initAllTables = async () => {
  await initCompanyModel(); // Ensure companies table is created first
  // Wait for companies table to be fully created before proceeding
  await new Promise(resolve => setTimeout(resolve, 200));
  await initUserModel();
  await initExpenseCategoryModel(); // Create expense_categories before expenses
  await initExpenseModel();
  await initPaylistModel();
  await initBillModel();
};

// drop all tables
export const dropAllTables = async () => {
  // Disable foreign key checks to allow dropping tables in any order
  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  
  // Drop tables
  await db.query("DROP TABLE IF EXISTS bills");
  await db.query("DROP TABLE IF EXISTS expenses");
  await db.query("DROP TABLE IF EXISTS expense_categories");
  await db.query("DROP TABLE IF EXISTS paylists");
  await db.query("DROP TABLE IF EXISTS users_confirmations");
  await db.query("DROP TABLE IF EXISTS users");
  await db.query("DROP TABLE IF EXISTS companies");
  
  // Re-enable foreign key checks
  await db.query("SET FOREIGN_KEY_CHECKS = 1");
};
