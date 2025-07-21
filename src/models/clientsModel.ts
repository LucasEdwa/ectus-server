import { db } from "./db";

export const createClientsTable = async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS clients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    address VARCHAR(255),
    zip_code VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(100),
    service_type VARCHAR(100),
    home_size VARCHAR(20),
    frequency VARCHAR(50),
    number_of_rooms VARCHAR(20),
    number_of_bathrooms VARCHAR(20),
    access_instructions TEXT,
    priority_areas TEXT,
    special_instructions TEXT,
    allergies TEXT,
    pets TEXT,
    notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`);
};


