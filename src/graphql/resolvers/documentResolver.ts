import { db } from "../../models/db";
import { Document } from "../../types/document";
import { canManageClients } from "../../middleware/roles";
import { parseInput } from "../../validation/parse";
import {
  createDocumentInputSchema,
  documentIdSchema,
  documentsByCompanySchema,
  documentsByEmployeeSchema,
  updateDocumentInputSchema,
} from "../../validation/schemas";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import { assertEmployeeInCompany, getDocumentRowCompany } from "../helpers/tenantChecks";

export const documentResolvers = {
  Document: {
    async employee_name(parent: any) {
      const [[employee]]: any = await db.query("SELECT name FROM users WHERE id = ?", [
        parent.employee_id,
      ]);
      return employee?.name || null;
    },
    async employee_email(parent: any) {
      const [[employee]]: any = await db.query("SELECT email FROM users WHERE id = ?", [
        parent.employee_id,
      ]);
      return employee?.email || null;
    },
  },

  Query: {
    async documentsByEmployee(
      _: unknown,
      rawArgs: { employee_id: unknown },
      context: any
    ): Promise<Document[]> {
      assertAuthenticated(context.user);
      const { employee_id } = parseInput(documentsByEmployeeSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(employee_id, viewerCompany);
      if (
        context.user.role === "employee" &&
        Number(employee_id) !== Number(context.user.id)
      ) {
        throw new Error("Not authorized to view documents for this employee.");
      }

      const [rows]: any = await db.query(
        "SELECT * FROM documents WHERE employee_id = ? ORDER BY uploaded_at DESC",
        [employee_id]
      );
      return rows;
    },

    async documentsByCompany(
      _: unknown,
      rawArgs: { company_id: unknown },
      context: any
    ): Promise<Document[]> {
      assertAuthenticated(context.user);
      const { company_id } = parseInput(documentsByCompanySchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(company_id) !== viewerCompany) {
        throw new Error("Not authorized to view documents for this company.");
      }

      const [rows]: any = await db.query(
        "SELECT * FROM documents WHERE company_id = ? ORDER BY uploaded_at DESC",
        [company_id]
      );
      return rows;
    },

    async documentById(
      _: unknown,
      rawArgs: { id: unknown },
      context: any
    ): Promise<Document | null> {
      assertAuthenticated(context.user);
      const { id } = parseInput(documentIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const [[document]]: any = await db.query("SELECT * FROM documents WHERE id = ?", [id]);
      if (!document) return null;
      if (Number(document.company_id) !== viewerCompany) {
        throw new Error("Not authorized to view this document.");
      }
      return document;
    },

    async allDocuments(_: unknown, __: unknown, context: any): Promise<Document[]> {
      assertAuthenticated(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const [rows]: any = await db.query(
        "SELECT * FROM documents WHERE company_id = ? ORDER BY uploaded_at DESC",
        [viewerCompany]
      );
      return rows;
    },
  },

  Mutation: {
    async createDocument(
      _: unknown,
      { input }: { input: unknown },
      context: any
    ): Promise<Document> {
      assertAuthenticated(context.user);
      canManageClients(context.user);
      const parsed = parseInput(createDocumentInputSchema, input);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(parsed.employee_id, viewerCompany);

      const [[employee]]: any = await db.query(
        "SELECT company_id FROM users WHERE id = ?",
        [parsed.employee_id]
      );
      if (!employee) throw new Error("Employee not found");

      const [result]: any = await db.query(
        `INSERT INTO documents (
          employee_id, company_id, document_type, title, description,
          file_url, file_name, file_size, mime_type, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parsed.employee_id,
          employee.company_id,
          parsed.document_type,
          parsed.title,
          parsed.description ?? null,
          parsed.file_url,
          parsed.file_name,
          parsed.file_size,
          parsed.mime_type,
          parsed.expires_at ?? null,
        ]
      );

      const [[document]]: any = await db.query("SELECT * FROM documents WHERE id = ?", [
        result.insertId,
      ]);

      return document;
    },

    async updateDocument(
      _: unknown,
      { input }: { input: unknown },
      context: any
    ): Promise<Document> {
      assertAuthenticated(context.user);
      canManageClients(context.user);
      const parsed = parseInput(updateDocumentInputSchema, input);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const docCompany = await getDocumentRowCompany(parsed.id);
      if (docCompany === null) {
        throw new Error("Document not found");
      }
      if (Number(docCompany) !== viewerCompany) {
        throw new Error("Not authorized to update this document.");
      }

      const updates: string[] = [];
      const values: unknown[] = [];

      if (parsed.title !== undefined) {
        updates.push("title = ?");
        values.push(parsed.title);
      }
      if (parsed.description !== undefined) {
        updates.push("description = ?");
        values.push(parsed.description ?? null);
      }
      if (parsed.document_type !== undefined) {
        updates.push("document_type = ?");
        values.push(parsed.document_type);
      }
      if (parsed.expires_at !== undefined) {
        updates.push("expires_at = ?");
        values.push(parsed.expires_at ?? null);
      }
      if (parsed.is_active !== undefined) {
        updates.push("is_active = ?");
        values.push(parsed.is_active);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(parsed.id);

      await db.query(`UPDATE documents SET ${updates.join(", ")} WHERE id = ?`, values);

      const [[document]]: any = await db.query("SELECT * FROM documents WHERE id = ?", [
        parsed.id,
      ]);

      return document;
    },

    async deleteDocument(
      _: unknown,
      rawArgs: { id: unknown },
      context: any
    ): Promise<boolean> {
      assertAuthenticated(context.user);
      canManageClients(context.user);
      const { id } = parseInput(documentIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const docCompany = await getDocumentRowCompany(id);
      if (docCompany === null) {
        return false;
      }
      if (Number(docCompany) !== viewerCompany) {
        throw new Error("Not authorized to delete this document.");
      }
      const [result]: any = await db.query("DELETE FROM documents WHERE id = ?", [id]);
      return result.affectedRows > 0;
    },
  },
};
