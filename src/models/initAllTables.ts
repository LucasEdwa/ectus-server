import { initUserModel } from "./userModel";
import { initShiftModel } from "./shiftModel";
import { initPaylistModel } from "./paylistModel";
import { initExpenseModel } from "./expenseModel";

export const initAllTables = async () => {
  await initUserModel();
  await initShiftModel();
  await initPaylistModel();
  await initExpenseModel();
};
