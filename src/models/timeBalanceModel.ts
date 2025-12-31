import { db } from "./db";
import { TimeBalance, CreateTimeBalanceInput, UpdateTimeBalanceInput } from "../types/balance";

// Create time_balances table if not exists
export const createTimeBalancesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS time_balances (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT UNSIGNED NOT NULL,
      flexible_hours DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Flexible work hours',
      time_bank DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Time bank hours',
      vacation_days DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Vacation days remaining',
      comp_time DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Comp time hours',
      overtime_balance DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Overtime balance hours',
      sick_days DECIMAL(4,2) DEFAULT 0.00 COMMENT 'Sick days remaining',
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_employee (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createTimeBalance = async (input: CreateTimeBalanceInput): Promise<TimeBalance> => {
  const {
    employee_id,
    flexible_hours = 0,
    time_bank = 0,
    vacation_days = 0,
    comp_time = 0,
    overtime_balance = 0,
    sick_days = 0
  } = input;

  const [result]: any = await db.query(
    `INSERT INTO time_balances 
     (employee_id, flexible_hours, time_bank, vacation_days, comp_time, overtime_balance, sick_days) 
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     flexible_hours = VALUES(flexible_hours),
     time_bank = VALUES(time_bank),
     vacation_days = VALUES(vacation_days),
     comp_time = VALUES(comp_time),
     overtime_balance = VALUES(overtime_balance),
     sick_days = VALUES(sick_days)`,
    [employee_id, flexible_hours, time_bank, vacation_days, comp_time, overtime_balance, sick_days]
  );

  const newBalance = await getTimeBalanceById(result.insertId);
  if (!newBalance) {
    throw new Error('Failed to retrieve created time balance record');
  }
  return newBalance;
};
export const getTimeBalanceById = async (id: number): Promise<TimeBalance | null> => {
  const [rows]: any = await db.query(
    `SELECT tb.*, u.name as employee_name, u.email as employee_email 
     FROM time_balances tb 
     LEFT JOIN users u ON tb.employee_id = u.id 
     WHERE tb.id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const getTimeBalanceByEmployeeId = async (employee_id: number): Promise<TimeBalance | null> => {
  const [rows]: any = await db.query(
    `SELECT tb.*, u.name as employee_name, u.email as employee_email 
     FROM time_balances tb 
     LEFT JOIN users u ON tb.employee_id = u.id 
     WHERE tb.employee_id = ?`,
    [employee_id]
  );
  return rows[0] || null;
};

export const getOrCreateTimeBalanceByEmployeeId = async (employee_id: number): Promise<TimeBalance | null> => {
  try {
    // Try to get existing balance
    let balance = await getTimeBalanceByEmployeeId(employee_id);
    
    // If no balance exists, create one with default values
    if (!balance) {
      console.log(`Creating default time balance for employee ${employee_id}`);
      balance = await createTimeBalance({
        employee_id,
        flexible_hours: 0,
        time_bank: 0,
        vacation_days: 25, // Default vacation days
        comp_time: 0,
        overtime_balance: 0,
        sick_days: 5 // Default sick days
      });
    }
    
    return balance;
  } catch (error) {
    console.error('Error getting/creating time balance:', error);
    return null;
  }
};

export const updateTimeBalance = async (
  id: number,
  input: UpdateTimeBalanceInput
): Promise<TimeBalance | null> => {
  const updates: string[] = [];
  const values: any[] = [];

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (updates.length === 0) {
    return getTimeBalanceById(id);
  }

  values.push(id);

  await db.query(
    `UPDATE time_balances SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return getTimeBalanceById(id);
};

export const updateTimeBalanceByEmployeeId = async (
  employeeId: number,
  input: UpdateTimeBalanceInput
): Promise<TimeBalance | null> => {
  const updates: string[] = [];
  const values: any[] = [];

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      // For flexible_hours, add to existing value instead of replacing
      if (key === 'flexible_hours') {
        updates.push(`${key} = ${key} + ?`);
      } else {
        updates.push(`${key} = ?`);
      }
      values.push(value);
    }
  });

  if (updates.length === 0) {
    return await getTimeBalanceByEmployeeId(employeeId);
  }

  values.push(employeeId);
  
  await db.query(
    `UPDATE time_balances SET ${updates.join(', ')}, last_updated = NOW() WHERE employee_id = ?`,
    values
  );

  return await getTimeBalanceByEmployeeId(employeeId);
};

export const getTimeBalancesByCompanyId = async (company_id: number): Promise<TimeBalance[]> => {
  const [rows]: any = await db.query(
    `SELECT tb.*, u.name as employee_name, u.email as employee_email 
     FROM time_balances tb 
     LEFT JOIN users u ON tb.employee_id = u.id 
     WHERE u.company_id = ?
     ORDER BY tb.last_updated DESC`,
    [company_id]
  );
  return rows;
};

export const deleteTimeBalance = async (id: number): Promise<boolean> => {
  const [result]: any = await db.query(
    "DELETE FROM time_balances WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
};

export const initTimeBalanceModel = async () => {
  try {
    console.log('Initializing time_balances table...');
    await createTimeBalancesTable();
    console.log('✅ time_balances table initialized successfully');
    
    // Check if table exists by running a simple query
    try {
      const [rows]: any = await db.query('SELECT COUNT(*) as count FROM time_balances');
      console.log(`📊 time_balances table has ${rows[0].count} records`);
    } catch (error) {
      console.error('❌ Error checking time_balances table:', error);
    }
  } catch (error) {
    console.error('❌ Error initializing time_balances table:', error);
    throw error;
  }
};