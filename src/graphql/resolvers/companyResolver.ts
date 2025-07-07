import { db } from "../../models/db";
import { Company, CreateCompanyInput, UpdateCompanyInput } from "../../types/company";

export const companyResolvers = {
  Query: {
    async companies(): Promise<Company[]> {
      const [rows]: any = await db.query("SELECT * FROM companies");
      return rows;
    },
    async company(parent: any, { id }: { id: number }): Promise<Company | null> {
      const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
      return rows[0] || null;
    }
  },
  Mutation: {
    async createCompany(parent: any, args: CreateCompanyInput): Promise<Company> {
      const {
        name,
        org_number,
        address,
        zip_code,
        city,
        country,
        phone,
        email,
        bankgiro,
        plusgiro,
        vat_number
      } = args;

      try {
        const [result]: any = await db.query(
          `INSERT INTO companies (name, org_number, address, zip_code, city, country, phone, email, bankgiro, plusgiro, vat_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name,
            org_number,
            address,
            zip_code,
            city,
            country,
            phone,
            email,
            bankgiro,
            plusgiro,
            vat_number
          ]
        );
        
        const companyId = result.insertId;
        const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [companyId]);
        return rows[0];
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new Error(`Company with org_number ${org_number} already exists`);
        }
        throw error;
      }
    },
    async updateCompany(parent: any, args: UpdateCompanyInput): Promise<Company> {
      const {
        id,
        name,
        org_number,
        address,
        zip_code,
        city,
        country,
        phone,
        email,
        bankgiro,
        plusgiro,
        vat_number
      } = args;
      
      const [result]: any = await db.query(
        `UPDATE companies SET
        name = ?, org_number = ?, address = ?, zip_code = ?, city = ?, country = ?,
        phone = ?, email = ?, bankgiro = ?, plusgiro = ?, vat_number = ?
        WHERE id = ?`,
        [
          name,
          org_number,
          address,
          zip_code,
          city,
          country,
          phone,
          email,
          bankgiro,
          plusgiro,
          vat_number,
          id
        ]
      );
      const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
      return rows[0];
    },
    async deleteCompany(parent: any, { id }: { id: number }): Promise<boolean> {
      const [result]: any = await db.query("DELETE FROM companies WHERE id = ?", [id]);
      return result.affectedRows > 0;
    }
  }
};