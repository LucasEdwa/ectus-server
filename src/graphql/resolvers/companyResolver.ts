import { db } from "../../models/db";

export const companyResolvers = {
  Query: {
    async companies() {
      const [rows]: any = await db.query("SELECT * FROM companies");
      return rows;
    },
    async company(_: any, { id }: { id: number }) {
      const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
      return rows[0];
    }
  },
  Mutation: {
    async createCompany(args: any) {
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
        vat_number,
      } = args;
      const [result]: any = await db.query(
        `INSERT INTO companies
        (name, org_number, address, zip_code, city, country, phone, email, bankgiro, plusgiro, vat_number)
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
          vat_number,
        ]
      );
      const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [result.insertId]);
      return rows[0];
    }
    ,
    async updateCompany(
      args: any,
      {
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
        vat_number,
      } = args
    ) {
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
      if (result.affectedRows === 0) {
        throw new Error("Company not found");
      }
      const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
      return rows[0];
    }
    ,
    async deleteCompany(args: any, { id }: { id: number }) {
      const [result]: any = await db.query("DELETE FROM companies WHERE id = ?", [id]);
      if (result.affectedRows === 0) {
        throw new Error("Company not found");
      }
      return { message: "Company deleted successfully" };
    }
  }
};
