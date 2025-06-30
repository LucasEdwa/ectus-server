import { initCompanyModel } from "./companyModel";
import { initUserModel } from "./userModel";
import { initShiftModel } from "./shiftModel";
import { initPaylistModel } from "./paylistModel";
import { initExpenseModel } from "./expenseModel";
import { initBillModel } from "./billModel";
import { initExpenseCategoryModel } from "./expenseCategoryModel";

export const initAllTables = async () => {
  await initCompanyModel();
  await initUserModel();
  await initShiftModel();
  await initPaylistModel();
  await initExpenseModel();
  await initBillModel();
  await initExpenseCategoryModel();
};
