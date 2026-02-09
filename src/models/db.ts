import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  timezone: '+00:00' // Force UTC timezone for all connections
});

// Check database timezone configuration on startup
export const checkDatabaseTimezone = async () => {
  try {
    const [rows] = await db.query('SELECT @@system_time_zone as system_tz, @@session.time_zone as session_tz, NOW() as `current_time`, UTC_TIMESTAMP() as `utc_time`');
    console.log('[DATABASE] Timezone configuration:', rows);
  } catch (error) {
    console.error('[DATABASE] Error checking timezone:', error);
  }
};
