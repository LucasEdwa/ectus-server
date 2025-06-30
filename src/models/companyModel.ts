import { db } from "./db";

export const createCompaniesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      org_number VARCHAR(32) NOT NULL UNIQUE,
      address VARCHAR(255) NOT NULL,
      zip_code VARCHAR(16) NOT NULL,
      city VARCHAR(64) NOT NULL,
      country VARCHAR(64) NOT NULL,
      phone VARCHAR(32),
      email VARCHAR(128),
      bankgiro VARCHAR(32),
      plusgiro VARCHAR(32),
      vat_number VARCHAR(32),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const initCompanyModel = async () => {
  await createCompaniesTable();
};
