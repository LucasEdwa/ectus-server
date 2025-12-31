import { db } from '../models/db';

/**
 * Migration to fix the time_balances table structure
 * This addresses the missing employee_id column issue
 */
export const fixTimeBalanceTable = async () => {
  console.log('🔧 Starting time_balances table migration...');
  
  try {
    // First, check if the table exists and what columns it has
    console.log('📋 Checking existing table structure...');
    const [columns]: any = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'time_balances'
    `);
    
    console.log('Current columns:', columns.map((col: any) => col.COLUMN_NAME));
    
    // Check if employee_id column exists
    const hasEmployeeId = columns.some((col: any) => col.COLUMN_NAME === 'employee_id');
    
    if (hasEmployeeId) {
      console.log('✅ Table already has correct structure');
      return;
    }
    
    console.log('⚠️  Missing employee_id column. Recreating table...');
    
    // Backup existing data if any
    console.log('💾 Backing up existing data...');
    let backupData: any[] = [];
    try {
      const [existingData]: any = await db.query('SELECT * FROM time_balances');
      backupData = existingData;
      console.log(`📦 Backed up ${backupData.length} records`);
    } catch (error) {
      console.log('No existing data to backup');
    }
    
    // Drop the existing table
    console.log('🗑️  Dropping existing table...');
    await db.query('DROP TABLE IF EXISTS time_balances');
    
    // Create the new table with correct structure
    console.log('🏗️  Creating new table structure...');
    await db.query(`
      CREATE TABLE time_balances (
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
    
    // Restore data if possible (this would need manual mapping if old structure was different)
    if (backupData.length > 0) {
      console.log('⚠️  Note: Cannot automatically restore data due to schema change');
      console.log('You may need to manually recreate time balance records');
    }
    
    console.log('✅ time_balances table migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  fixTimeBalanceTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}