import { db } from "./db";

export const createDocumentsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS documents (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id INT UNSIGNED NOT NULL,
      company_id INT UNSIGNED NOT NULL,
      document_type ENUM('contract', 'certification', 'identification', 'other') NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at DATE,
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      INDEX idx_employee (employee_id),
      INDEX idx_company (company_id),
      INDEX idx_document_type (document_type),
      INDEX idx_uploaded_at (uploaded_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  await db.query(createTableQuery);
  console.log("Documents table created or already exists.");
};
