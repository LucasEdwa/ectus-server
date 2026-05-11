import { db } from "../../models/db";
import { Client, CreateClientInput, UpdateClientInput } from "../../types/client";
import { canManageClients } from "../../middleware/roles";
import { parseInput } from "../../validation/parse";
import {
  clientIdSchema,
  clientsByDateSchema,
  createClientFlatSchema,
  documentsByCompanySchema,
  updateClientFlatSchema,
} from "../../validation/schemas";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import { getClientCompanyId } from "../helpers/tenantChecks";

export const clientResolvers = {
  Query: {
    async clients(
      _: unknown,
      rawArgs: { company_id: unknown },
      context: any
    ): Promise<Client[]> {
      assertAuthenticated(context.user);
      const { company_id } = parseInput(documentsByCompanySchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(company_id) !== viewerCompany) {
        throw new Error("Not authorized to view clients for this company.");
      }
      const [rows]: any = await db.query("SELECT * FROM clients WHERE company_id = ?", [
        company_id,
      ]);
      return rows;
    },

    async client(_: unknown, rawArgs: { id: unknown }, context: any): Promise<Client | null> {
      assertAuthenticated(context.user);
      const { id } = parseInput(clientIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const [rows]: any = await db.query("SELECT * FROM clients WHERE id = ?", [id]);
      const row = rows[0];
      if (!row) return null;
      if (Number(row.company_id) !== viewerCompany) {
        throw new Error("Not authorized to view this client.");
      }
      return row;
    },

    async clientsByDate(
      _: unknown,
      rawArgs: { company_id: unknown; date: unknown },
      context: any
    ): Promise<Client[]> {
      assertAuthenticated(context.user);
      const args = parseInput(clientsByDateSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(args.company_id) !== viewerCompany) {
        throw new Error("Not authorized to view clients for this company.");
      }
      const query = `
        SELECT DISTINCT c.* FROM clients c
        JOIN shifts s ON s.client_id = c.id
        WHERE c.company_id = ? AND s.date = ?
      `;
      const [rows]: any = await db.query(query, [args.company_id, args.date]);
      return rows;
    },
  },

  Mutation: {
    async createClient(_: unknown, args: CreateClientInput, context: any): Promise<Client> {
      assertAuthenticated(context.user);
      canManageClients(context.user);
      const parsed = parseInput(createClientFlatSchema, args);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(parsed.company_id) !== viewerCompany) {
        throw new Error("Not authorized to create clients for this company.");
      }

      const [result]: any = await db.query(
        `INSERT INTO clients (
          company_id, name, contact_name, contact_phone, contact_email, address, zip_code, city, country,
          service_type, home_size, frequency, number_of_rooms, number_of_bathrooms, access_instructions,
          priority_areas, special_instructions, allergies, pets, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parsed.company_id,
          parsed.name,
          parsed.contact_name ?? null,
          parsed.contact_phone ?? null,
          parsed.contact_email ?? null,
          parsed.address ?? null,
          parsed.zip_code ?? null,
          parsed.city ?? null,
          parsed.country ?? null,
          parsed.service_type ?? null,
          parsed.home_size ?? null,
          parsed.frequency ?? null,
          parsed.number_of_rooms ?? null,
          parsed.number_of_bathrooms ?? null,
          parsed.access_instructions ?? null,
          parsed.priority_areas ?? null,
          parsed.special_instructions ?? null,
          parsed.allergies ?? null,
          parsed.pets ?? null,
          parsed.notes ?? null,
        ]
      );
      const clientId = result.insertId;
      const [rows]: any = await db.query("SELECT * FROM clients WHERE id = ?", [clientId]);
      return rows[0];
    },

    async updateClient(_: unknown, args: UpdateClientInput, context: any): Promise<Client> {
      assertAuthenticated(context.user);
      canManageClients(context.user);
      const parsed = parseInput(updateClientFlatSchema, args);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(parsed.company_id) !== viewerCompany) {
        throw new Error("Not authorized to update clients for this company.");
      }

      const existingCompany = await getClientCompanyId(parsed.id);
      if (existingCompany === null) {
        throw new Error("Client not found");
      }
      if (Number(existingCompany) !== viewerCompany) {
        throw new Error("Not authorized to update this client.");
      }

      await db.query(
        `UPDATE clients SET
          company_id = ?, name = ?, contact_name = ?, contact_phone = ?, contact_email = ?, address = ?, zip_code = ?, city = ?, country = ?,
          service_type = ?, home_size = ?, frequency = ?, number_of_rooms = ?, number_of_bathrooms = ?, access_instructions = ?,
          priority_areas = ?, special_instructions = ?, allergies = ?, pets = ?, notes = ?
          WHERE id = ?`,
        [
          parsed.company_id,
          parsed.name,
          parsed.contact_name ?? null,
          parsed.contact_phone ?? null,
          parsed.contact_email ?? null,
          parsed.address ?? null,
          parsed.zip_code ?? null,
          parsed.city ?? null,
          parsed.country ?? null,
          parsed.service_type ?? null,
          parsed.home_size ?? null,
          parsed.frequency ?? null,
          parsed.number_of_rooms ?? null,
          parsed.number_of_bathrooms ?? null,
          parsed.access_instructions ?? null,
          parsed.priority_areas ?? null,
          parsed.special_instructions ?? null,
          parsed.allergies ?? null,
          parsed.pets ?? null,
          parsed.notes ?? null,
          parsed.id,
        ]
      );
      const [rows]: any = await db.query("SELECT * FROM clients WHERE id = ?", [parsed.id]);
      return rows[0];
    },

    async deleteClient(_: unknown, rawArgs: { id: unknown }, context: any): Promise<boolean> {
      assertAuthenticated(context.user);
      canManageClients(context.user);
      const { id } = parseInput(clientIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const existingCompany = await getClientCompanyId(id);
      if (existingCompany === null) {
        return false;
      }
      if (Number(existingCompany) !== viewerCompany) {
        throw new Error("Not authorized to delete this client.");
      }
      const [result]: any = await db.query("DELETE FROM clients WHERE id = ?", [id]);
      return result.affectedRows > 0;
    },
  },
};
