import { db } from "./db";
import { Shift } from "../types/shift";

// Create shifts table if not exists
export const createShiftsTable = async (): Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT UNSIGNED NOT NULL,
      client_id INT UNSIGNED,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      break_duration TIME,
      hourly_rate FLOAT NOT NULL,
      total_hours FLOAT AS (
        TIMESTAMPDIFF(MINUTE, start_time, end_time) / 60 -
        IF(break_duration IS NOT NULL, TIMESTAMPDIFF(MINUTE, SEC_TO_TIME(0), break_duration) / 60, 0)
      ) STORED,
      user_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_shift (employee_id, date, start_time),
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  await db.query(`
    ALTER TABLE shifts 
    MODIFY COLUMN total_hours FLOAT AS (
      TIMESTAMPDIFF(MINUTE, start_time, end_time) / 60 -
      IF(break_duration IS NOT NULL, TIMESTAMPDIFF(MINUTE, SEC_TO_TIME(0), break_duration) / 60, 0)
    ) STORED
  `);
};

export const createShift = async (
  employee_id: number,
  client_id: number | null,
  date: string,
  start_time: string,
  end_time: string,
  break_duration: string,
  hourly_rate: number,
  user_id: number
): Promise<Shift> => {

  let breakDurationValue: string | null = break_duration;
  if (!break_duration || break_duration === "00:00:00") {
    breakDurationValue = null;
  }

  try {
    const [result]: any = await db.query(
      `INSERT INTO shifts (employee_id, client_id, date, start_time, end_time, break_duration, hourly_rate, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, client_id, date, start_time, end_time, breakDurationValue, hourly_rate, user_id]
    );
    const [rows]: any = await db.query("SELECT * FROM shifts WHERE id = ?", [result.insertId]);
    return rows[0];
  } catch (error) {
    console.error("Error in createShift:", error);
    throw error;
  }
};


export const getShiftsByEmployee = async (employee_id: number): Promise<Shift[]> => {
  const [rows]: any = await db.query(
    `SELECT s.*, c.id as client_id, c.name as client_name, c.contact_name, c.contact_phone, c.contact_email, c.address, c.zip_code, c.city, c.country, c.service_type, c.home_size, c.frequency, c.number_of_rooms, c.number_of_bathrooms, c.access_instructions, c.priority_areas, c.special_instructions, c.allergies, c.pets, c.notes
     FROM shifts s
     LEFT JOIN clients c ON s.client_id = c.id
     WHERE s.employee_id = ?
     ORDER BY s.date DESC`,
    [employee_id]
  );
  return rows;
};

export const updateShift = async (
  id: number,
  date: string,
  start_time: string,
  end_time: string,
  hourly_rate: number,
  break_duration: string,
  user_id: number
): Promise<Shift> => {

  let breakDurationValue: string | null = break_duration;
  if (!break_duration || break_duration === "00:00:00") {
    breakDurationValue = null;
  }

  await db.query(
    `UPDATE shifts SET date = ?, start_time = ?, end_time = ?, hourly_rate = ?, break_duration = ? WHERE id = ?, user_id = ?`,
    [date, start_time, end_time, hourly_rate, breakDurationValue, id, user_id]
  );
  const [rows]: any = await db.query("SELECT * FROM shifts WHERE id = ?", [id]);
  return rows[0];
};

export const initShiftModel = async (): Promise<void> => {
  await createShiftsTable();
};
