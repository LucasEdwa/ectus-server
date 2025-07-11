import { CreateUserInput, User } from "../types/user";
import { db } from "./db";

// Drop all user-related tables in correct order
export const dropUserTables = async () => {
  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.query("DROP TABLE IF EXISTS bills");
  await db.query("DROP TABLE IF EXISTS expenses");
  await db.query("DROP TABLE IF EXISTS users_throttling");
  await db.query("DROP TABLE IF EXISTS users_resets");
  await db.query("DROP TABLE IF EXISTS users_remembered");
  await db.query("DROP TABLE IF EXISTS users_confirmations");
  await db.query("DROP TABLE IF EXISTS shifts");
  await db.query("DROP TABLE IF EXISTS paylists");
  await db.query("DROP TABLE IF EXISTS users");
  await db.query("DROP TABLE IF EXISTS companies");
  await db.query("SET FOREIGN_KEY_CHECKS = 1");
};

// Users main table
export const createUsersTable = async ():Promise<void> => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('employee', 'leader', 'finance', 'hr') NOT NULL,
      company_id INT UNSIGNED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersConfirmationsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_confirmations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      email VARCHAR(249) COLLATE utf8mb4_unicode_ci NOT NULL,
      selector VARCHAR(16) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      token VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      expires INT(10) UNSIGNED NOT NULL,
      UNIQUE KEY selector (selector),
      KEY email_expires (email,expires),
      KEY user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersRememberedTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_remembered (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      selector VARCHAR(24) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      token VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      expires INT(10) UNSIGNED NOT NULL,
      UNIQUE KEY selector (selector),
      KEY user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersResetsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_resets (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      selector VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      token VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL,
      expires INT(10) UNSIGNED NOT NULL,
      UNIQUE KEY selector (selector),
      KEY user_id_expires (user_id,expires),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createUsersThrottlingTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users_throttling (
      bucket VARCHAR(44) CHARACTER SET latin1 COLLATE latin1_general_cs NOT NULL PRIMARY KEY,
      tokens FLOAT UNSIGNED NOT NULL,
      replenished_at INT(10) UNSIGNED NOT NULL,
      expires_at INT(10) UNSIGNED NOT NULL,
      KEY expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// User CRUD helpers
export const createUser = async (input : CreateUserInput) => {
  await db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [input.name, input.email, input.password, input.role]
  );
};

export const findUserByEmail = async (email: string):Promise<User> => {
  const [rows]: any = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

export const findUserById = async (id: number):Promise<User> => {
  const [rows]: any = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
};

// Initialize all user-related tables: drop then create
export const initUserModel = async () => {
  
  await createUsersTable();
  await createUsersConfirmationsTable();
  await createUsersRememberedTable();
  await createUsersResetsTable();
  await createUsersThrottlingTable();
};
  