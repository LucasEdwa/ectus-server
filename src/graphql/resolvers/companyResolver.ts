import { db } from "../../models/db";
import { Company, CreateCompanyInput, UpdateCompanyInput } from "../../types/company";
import { parseInput } from "../../validation/parse";
import {
  companyQueryIdSchema,
  createCompanySchema,
  updateCompanySchema,
} from "../../validation/schemas";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";

export const companyResolvers = {
  Query: {
    async companies(_: unknown, __: unknown, context: any): Promise<Company[]> {
      assertAuthenticated(context.user);
      try {
        const cid = await resolveViewerCompanyId(context.user);
        const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [cid]);
        return rows;
      } catch {
        return [];
      }
    },
    async company(_: unknown, rawArgs: { id: unknown }, context: any): Promise<Company | null> {
      assertAuthenticated(context.user);
      const { id } = parseInput(companyQueryIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(id) !== viewerCompany) {
        throw new Error("Not authorized to view this company.");
      }
      const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
      return rows[0] || null;
    },
  },
  Mutation: {
    async createCompany(_: unknown, args: CreateCompanyInput): Promise<Company> {
      const parsed = parseInput(createCompanySchema, args);
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
      } = parsed;

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
            phone ?? null,
            email ?? null,
            bankgiro ?? null,
            plusgiro ?? null,
            vat_number ?? null,
          ]
        );

        const companyId = result.insertId;
        const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [companyId]);
        return rows[0];
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          throw new Error(`Company with org_number ${org_number} already exists`);
        }
        throw error;
      }
    },

    async updateCompany(_: unknown, args: UpdateCompanyInput): Promise<Company> {
      const parsed = parseInput(updateCompanySchema, args as unknown);

      const updates: string[] = [];
      const values: unknown[] = [];

      const assign = (col: string, val: unknown) => {
        updates.push(`${col} = ?`);
        values.push(val);
      };

      if (parsed.name !== undefined) assign("name", parsed.name);
      if (parsed.org_number !== undefined) assign("org_number", parsed.org_number);
      if (parsed.address !== undefined) assign("address", parsed.address);
      if (parsed.zip_code !== undefined) assign("zip_code", parsed.zip_code);
      if (parsed.city !== undefined) assign("city", parsed.city);
      if (parsed.country !== undefined) assign("country", parsed.country);
      if (parsed.phone !== undefined) assign("phone", parsed.phone ?? null);
      if (parsed.email !== undefined) assign("email", parsed.email ?? null);
      if (parsed.bankgiro !== undefined) assign("bankgiro", parsed.bankgiro ?? null);
      if (parsed.plusgiro !== undefined) assign("plusgiro", parsed.plusgiro ?? null);
      if (parsed.vat_number !== undefined) assign("vat_number", parsed.vat_number ?? null);

      values.push(parsed.id);

      await db.query(`UPDATE companies SET ${updates.join(", ")} WHERE id = ?`, values);

      const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [parsed.id]);
      return rows[0];
    },

    async deleteCompany(_: unknown, rawArgs: { id: unknown }): Promise<boolean> {
      const { id } = parseInput(companyQueryIdSchema, rawArgs);
      const [result]: any = await db.query("DELETE FROM companies WHERE id = ?", [id]);
      return result.affectedRows > 0;
    },
  },
};
