import { db } from "./db";

// Create shifts table if not exists
export const createShiftsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT UNSIGNED NOT NULL,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      hourly_rate FLOAT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createShift = async (
  employee_id: number,
  date: string,
  start_time: string,
  end_time: string,
  hourly_rate: number
) => {
  await db.query(
    "INSERT INTO shifts (employee_id, date, start_time, end_time, hourly_rate) VALUES (?, ?, ?, ?, ?)",
    [employee_id, date, start_time, end_time, hourly_rate]
  );
};

export const getShiftsByEmployee = async (employee_id: number) => {
  const [rows]: any = await db.query(
    "SELECT * FROM shifts WHERE employee_id = ? ORDER BY date DESC",
    [employee_id]
  );
  return rows;
};

export const updateShift = async (
  id: number,
  date: string,
  start_time: string,
  end_time: string,
  hourly_rate: number
) => {
  await db.query(
    "UPDATE shifts SET date = ?, start_time = ?, end_time = ?, hourly_rate = ? WHERE id = ?",
    [date, start_time, end_time, hourly_rate, id]
  );
};

export const initShiftModel = async () => {
  await createShiftsTable();
};
