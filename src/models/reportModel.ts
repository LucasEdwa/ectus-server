import { db } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Report {
  id?: number;
  client_id: number;
  author_id?: number | null;
  date: string; // ISO date string
  content: string;
  created_at?: string;
}

export const initReportModel = async (): Promise<void> => {
  // If table exists with wrong schema, alter it first
  await db.query(`
    ALTER TABLE reports
    MODIFY COLUMN author_id INT UNSIGNED NULL,
    DROP FOREIGN KEY IF EXISTS reports_ibfk_2,
    ADD FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
  `).catch(() => {}); // ignore errors if table doesn't exist yet

  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      client_id INT UNSIGNED NOT NULL,
      author_id INT UNSIGNED NULL,
      date DATE NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_client_id (client_id),
      INDEX idx_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

// create a new report
export const createReport = async (
  client_id: number,
  author_id: number,
  date: string,
  content: string
): Promise<Report> => {
  const [result]: any = await db.query<ResultSetHeader>(
    `INSERT INTO reports (client_id, author_id, date, content) VALUES (?, ?, ?, ?)`,
    [client_id, author_id, date, content]
  );

  const [rows]: any = await db.query<RowDataPacket[]>(
    `SELECT * FROM reports WHERE id = ?`,
    [result.insertId]
  );
  return rows[0] as Report;
};

export const getReportsByClient = async (client_id: number): Promise<Report[]> => {
  const [rows]: any = await db.query<RowDataPacket[]>(
    `SELECT * FROM reports WHERE client_id = ? ORDER BY date DESC`,
    [client_id]
  );
  return rows as Report[];
};

export const getReportsByDate = async (date: string): Promise<Report[]> => {
  const [rows]: any = await db.query<RowDataPacket[]>(
    `SELECT * FROM reports WHERE date = ? ORDER BY client_id`,
    [date]
  );
  return rows as Report[];
};
