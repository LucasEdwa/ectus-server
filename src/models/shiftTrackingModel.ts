import { db } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper function to convert ISO string to MySQL datetime format
const formatDateForMySQL = (isoString: string) => {
  const date = new Date(isoString);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

interface ShiftTracking {
  id?: number;
  employee_id: number;
  start_time: string;
  end_time?: string;
  on_break: boolean;
  break_start?: string;
  break_end?: string;
  total_break_time: number;
  total_worked_time: number;
  break_count: number;
  shift_status: 'active' | 'on_break' | 'completed';
  created_at?: string;
}

export const initShiftTrackingModel = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS shift_tracking (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        employee_id INT UNSIGNED NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NULL,
        on_break BOOLEAN DEFAULT FALSE,
        break_start DATETIME NULL,
        break_end DATETIME NULL,
        total_break_time INT DEFAULT 0,
        total_worked_time INT DEFAULT 0,
        break_count INT DEFAULT 0,
        shift_status ENUM('active', 'on_break', 'completed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_employee_id (employee_id),
        INDEX idx_shift_status (shift_status),
        INDEX idx_start_time (start_time)
      ) ENGINE=InnoDB;
    `;

    await db.query(createTableQuery);
    console.log('Shift tracking table initialized successfully');
  } catch (error) {
    console.error('Error initializing shift tracking table:', error);
    throw error;
  }
};

export const createShiftTracking = async (shiftData: Omit<ShiftTracking, 'id' | 'created_at'>): Promise<ShiftTracking> => {
  try {
    // Convert ISO string to MySQL datetime format
    const formatDateForMySQL = (isoString: string) => {
      const date = new Date(isoString);
      const formatted = date.toISOString().slice(0, 19).replace('T', ' ');
      
      console.log('[SERVER] formatDateForMySQL:', {
        input: isoString,
        inputType: typeof isoString,
        parsedDate: date.toISOString(),
        mysqlFormatted: formatted,
        timezoneOffset: date.getTimezoneOffset()
      });
      
      return formatted;
    };

    console.log('[SERVER] Creating shift with start_time:', {
      originalStartTime: shiftData.start_time,
      startTimeType: typeof shiftData.start_time,
      currentServerTime: new Date().toISOString(),
      currentServerTimeMs: Date.now()
    });

    const formattedStartTime = formatDateForMySQL(shiftData.start_time);

    const query = `
      INSERT INTO shift_tracking (
        employee_id, start_time, on_break, total_break_time, 
        total_worked_time, break_count, shift_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      shiftData.employee_id,
      formattedStartTime,
      shiftData.on_break,
      shiftData.total_break_time,
      shiftData.total_worked_time,
      shiftData.break_count,
      shiftData.shift_status
    ]);

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM shift_tracking WHERE id = ?',
      [result.insertId]
    );

    return rows[0] as ShiftTracking;
  } catch (error) {
    console.error('Error creating shift tracking:', error);
    throw error;
  }
};

export const getCurrentShiftByEmployee = async (employeeId: number): Promise<ShiftTracking | null> => {
  try {
    const query = `
      SELECT *, 
        UNIX_TIMESTAMP(start_time) * 1000 as start_time_ms,
        UNIX_TIMESTAMP(end_time) * 1000 as end_time_ms,
        UNIX_TIMESTAMP(break_start) * 1000 as break_start_ms,
        UNIX_TIMESTAMP(break_end) * 1000 as break_end_ms,
        UNIX_TIMESTAMP(created_at) * 1000 as created_at_ms
      FROM shift_tracking 
      WHERE employee_id = ? AND shift_status IN ('active', 'on_break')
      ORDER BY start_time DESC 
      LIMIT 1
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [employeeId]);
    
    if (!rows[0]) return null;

    const shift = rows[0];
    
    // Convert to consistent timestamp format
    const transformedShift = {
      ...shift,
      start_time: shift.start_time_ms ? shift.start_time_ms.toString() : shift.start_time,
      end_time: shift.end_time_ms ? shift.end_time_ms.toString() : shift.end_time,
      break_start: shift.break_start_ms ? shift.break_start_ms.toString() : shift.break_start,
      break_end: shift.break_end_ms ? shift.break_end_ms.toString() : shift.break_end,
      created_at: shift.created_at_ms ? shift.created_at_ms.toString() : shift.created_at
    };

    // Clean up temporary timestamp fields
    delete transformedShift.start_time_ms;
    delete transformedShift.end_time_ms;
    delete transformedShift.break_start_ms;
    delete transformedShift.break_end_ms;
    delete transformedShift.created_at_ms;

    console.log('[SERVER] getCurrentShift returning:', {
      id: transformedShift.id,
      start_time: transformedShift.start_time,
      created_at: transformedShift.created_at,
      start_time_date: new Date(parseInt(transformedShift.start_time)).toISOString(),
      created_at_date: new Date(parseInt(transformedShift.created_at)).toISOString()
    });

    return transformedShift as ShiftTracking;
  } catch (error) {
    console.error('Error getting current shift:', error);
    throw error;
  }
};

export const updateShiftTracking = async (
  id: number, 
  updates: Partial<Omit<ShiftTracking, 'id' | 'employee_id' | 'created_at'>>
): Promise<ShiftTracking> => {
  try {
    // Convert datetime fields to MySQL format
    const processedUpdates: any = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      if ((key === 'break_start' || key === 'break_end' || key === 'end_time') && typeof value === 'string') {
        processedUpdates[key] = formatDateForMySQL(value);
      } else {
        processedUpdates[key] = value;
      }
    });
    
    const setClause = Object.keys(processedUpdates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(processedUpdates);

    const query = `UPDATE shift_tracking SET ${setClause} WHERE id = ?`;
    await db.query(query, [...values, id]);

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM shift_tracking WHERE id = ?',
      [id]
    );

    return rows[0] as ShiftTracking;
  } catch (error) {
    console.error('Error updating shift tracking:', error);
    throw error;
  }
};

export const getShiftHistory = async (employeeId: number, limit: number = 10): Promise<ShiftTracking[]> => {
  try {
    const query = `
      SELECT * FROM shift_tracking 
      WHERE employee_id = ? 
      ORDER BY start_time DESC 
      LIMIT ?
    `;

    const [rows] = await db.query<RowDataPacket[]>(query, [employeeId, limit]);
    return rows as ShiftTracking[];
  } catch (error) {
    console.error('Error getting shift history:', error);
    throw error;
  }
};

export const stopShiftTracking = async (
  id: number,
  endTime: string,
  totalWorkedTime: number
): Promise<ShiftTracking> => {
  try {
    // First get the current shift to calculate actual work time
    const [currentRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM shift_tracking WHERE id = ?',
      [id]
    );

    if (!currentRows.length) {
      throw new Error('Shift not found');
    }

    const currentShift = currentRows[0] as ShiftTracking;
    
    // Calculate actual work time based on server timestamps
    const startTime = new Date(currentShift.start_time).getTime();
    const endTimeMs = new Date(endTime).getTime();
    const totalElapsedSeconds = Math.floor((endTimeMs - startTime) / 1000);
    const breakTimeSeconds = currentShift.total_break_time || 0;
    const actualWorkedTime = Math.max(0, totalElapsedSeconds - breakTimeSeconds);

    console.log('[SERVER] Shift time calculation:', {
      shiftId: id,
      startTime: currentShift.start_time,
      endTime: endTime,
      startTimeMs: startTime,
      endTimeMs: endTimeMs,
      totalElapsedSeconds: totalElapsedSeconds,
      breakTimeSeconds: breakTimeSeconds,
      actualWorkedTime: actualWorkedTime,
      clientCalculation: totalWorkedTime,
      difference: actualWorkedTime - totalWorkedTime
    });

    const query = `
      UPDATE shift_tracking 
      SET end_time = ?, total_worked_time = ?, shift_status = 'completed', on_break = FALSE
      WHERE id = ?
    `;

    // Use server-calculated work time instead of client-provided time
    await db.query(query, [formatDateForMySQL(endTime), actualWorkedTime, id]);

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM shift_tracking WHERE id = ?',
      [id]
    );

    return rows[0] as ShiftTracking;
  } catch (error) {
    console.error('Error stopping shift:', error);
    throw error;
  }
};