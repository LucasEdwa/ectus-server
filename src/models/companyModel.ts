import { db } from "./db";
import { Company, CreateCompanyInput, UpdateCompanyInput } from "../types/company";

export const createCompaniesTable = async (): Promise<void> => {
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

export const getAllCompanies = async (): Promise<Company[]> => {
  const [rows]: any = await db.query("SELECT * FROM companies");
  return rows;
};

export const getCompanyById = async (id: number): Promise<Company | null> => {
  const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
  return rows[0] || null;
};

export const createCompany = async (input: CreateCompanyInput): Promise<Company> => {
  const [result]: any = await db.query(
    `INSERT INTO companies (name, org_number, address, zip_code, city, country, phone, email, bankgiro, plusgiro, vat_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.org_number,
      input.address,
      input.zip_code,
      input.city,
      input.country,
      input.phone,
      input.email,
      input.bankgiro,
      input.plusgiro,
      input.vat_number
    ]
  );
  const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [result.insertId]);
  return rows[0];
};

export const updateCompany = async (input: UpdateCompanyInput): Promise<Company> => {
  const [result]: any = await db.query(
    `UPDATE companies SET
    name = ?, org_number = ?, address = ?, zip_code = ?, city = ?, country = ?,
    phone = ?, email = ?, bankgiro = ?, plusgiro = ?, vat_number = ?
    WHERE id = ?`,
    [
      input.name,
      input.org_number,
      input.address,
      input.zip_code,
      input.city,
      input.country,
      input.phone,
      input.email,
      input.bankgiro,
      input.plusgiro,
      input.vat_number,
      input.id
    ]
  );
  const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [input.id]);
  return rows[0];
};

export const deleteCompany = async (id: number): Promise<boolean> => {
  const [result]: any = await db.query("DELETE FROM companies WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const initCompanyModel = async (): Promise<void> => {
  await createCompaniesTable();
};
