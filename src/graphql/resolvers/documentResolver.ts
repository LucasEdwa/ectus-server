import { db } from "../../models/db";
import { Document, CreateDocumentInput, UpdateDocumentInput } from "../../types/document";

export const documentResolvers = {
  Document: {
    async employee_name(parent: any) {
      const [[employee]]: any = await db.query(
        "SELECT name FROM users WHERE id = ?",
        [parent.employee_id]
      );
      return employee?.name || null;
    },
    async employee_email(parent: any) {
      const [[employee]]: any = await db.query(
        "SELECT email FROM users WHERE id = ?",
        [parent.employee_id]
      );
      return employee?.email || null;
    },
  },

  Query: {
    async documentsByEmployee(
      _: any,
      { employee_id }: { employee_id: number },
      context: any
    ): Promise<Document[]> {
      if (!context.user) throw new Error("Not authorized.");
      
      const [rows]: any = await db.query(
        "SELECT * FROM documents WHERE employee_id = ? ORDER BY uploaded_at DESC",
        [employee_id]
      );
      return rows;
    },

    async documentsByCompany(
      _: any,
      { company_id }: { company_id: number },
      context: any
    ): Promise<Document[]> {
      if (!context.user) throw new Error("Not authorized.");
      
      const [rows]: any = await db.query(
        "SELECT * FROM documents WHERE company_id = ? ORDER BY uploaded_at DESC",
        [company_id]
      );
      return rows;
    },

    async documentById(
      _: any,
      { id }: { id: number },
      context: any
    ): Promise<Document | null> {
      if (!context.user) throw new Error("Not authorized.");
      
      const [[document]]: any = await db.query(
        "SELECT * FROM documents WHERE id = ?",
        [id]
      );
      return document || null;
    },

    async allDocuments(_: any, __: any, context: any): Promise<Document[]> {
      if (!context.user) throw new Error("Not authorized.");
      
      const [rows]: any = await db.query(
        "SELECT * FROM documents ORDER BY uploaded_at DESC"
      );
      return rows;
    },
  },

  Mutation: {
    async createDocument(
      _: any,
      { input }: { input: CreateDocumentInput },
      context: any
    ): Promise<Document> {
      if (!context.user) throw new Error("Not authorized.");

      // Get employee's company_id
      const [[employee]]: any = await db.query(
        "SELECT company_id FROM users WHERE id = ?",
        [input.employee_id]
      );
      
      if (!employee) throw new Error("Employee not found");

      const [result]: any = await db.query(
        `INSERT INTO documents (
          employee_id, company_id, document_type, title, description,
          file_url, file_name, file_size, mime_type, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.employee_id,
          employee.company_id,
          input.document_type,
          input.title,
          input.description || null,
          input.file_url,
          input.file_name,
          input.file_size,
          input.mime_type,
          input.expires_at || null,
        ]
      );

      const [[document]]: any = await db.query(
        "SELECT * FROM documents WHERE id = ?",
        [result.insertId]
      );

      return document;
    },

    async updateDocument(
      _: any,
      { input }: { input: UpdateDocumentInput },
      context: any
    ): Promise<Document> {
      if (!context.user) throw new Error("Not authorized.");

      const updates: string[] = [];
      const values: any[] = [];

      if (input.title !== undefined) {
        updates.push("title = ?");
        values.push(input.title);
      }
      if (input.description !== undefined) {
        updates.push("description = ?");
        values.push(input.description);
      }
      if (input.document_type !== undefined) {
        updates.push("document_type = ?");
        values.push(input.document_type);
      }
      if (input.expires_at !== undefined) {
        updates.push("expires_at = ?");
        values.push(input.expires_at);
      }
      if (input.is_active !== undefined) {
        updates.push("is_active = ?");
        values.push(input.is_active);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(input.id);

      await db.query(
        `UPDATE documents SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      const [[document]]: any = await db.query(
        "SELECT * FROM documents WHERE id = ?",
        [input.id]
      );

      return document;
    },

    async deleteDocument(
      _: any,
      { id }: { id: number },
      context: any
    ): Promise<boolean> {
      if (!context.user) throw new Error("Not authorized.");

      await db.query("DELETE FROM documents WHERE id = ?", [id]);
      return true;
    },
  },
};
