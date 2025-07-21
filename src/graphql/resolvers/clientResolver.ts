import { db } from "../../models/db";
import { Client, CreateClientInput, UpdateClientInput } from "../../types/client";

export const clientResolvers = {
  Query: {
    async clients(parent: any, { company_id }: { company_id: number }): Promise<Client[]> {
      const [rows]: any = await db.query("SELECT * FROM clients WHERE company_id = ?", [company_id]);
      return rows;
    },
    async client(parent: any, { id }: { id: number }): Promise<Client | null> {
      const [rows]: any = await db.query("SELECT * FROM clients WHERE id = ?", [id]);
      return rows[0] || null;
    }
  },
  Mutation: {
    async createClient(parent: any, args: CreateClientInput): Promise<Client> {
      const {
        company_id,
        name,
        contact_name,
        contact_phone,
        contact_email,
        address,
        zip_code,
        city,
        country,
        service_type,
        home_size,
        frequency,
        number_of_rooms,
        number_of_bathrooms,
        access_instructions,
        priority_areas,
        special_instructions,
        allergies,
        pets,
        notes
      } = args;
      const [result]: any = await db.query(
        `INSERT INTO clients (
          company_id, name, contact_name, contact_phone, contact_email, address, zip_code, city, country,
          service_type, home_size, frequency, number_of_rooms, number_of_bathrooms, access_instructions,
          priority_areas, special_instructions, allergies, pets, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company_id, name, contact_name, contact_phone, contact_email, address, zip_code, city, country,
         service_type, home_size, frequency, number_of_rooms, number_of_bathrooms, access_instructions,
         priority_areas, special_instructions, allergies, pets, notes]
      );
      const clientId = result.insertId;
      const [rows]: any = await db.query("SELECT * FROM clients WHERE id = ?", [clientId]);
      return rows[0];
    },
    async updateClient(parent: any, args: UpdateClientInput): Promise<Client> {
      const {
        id,
        company_id,
        name,
        contact_name,
        contact_phone,
        contact_email,
        address,
        zip_code,
        city,
        country,
        service_type,
        home_size,
        frequency,
        number_of_rooms,
        number_of_bathrooms,
        access_instructions,
        priority_areas,
        special_instructions,
        allergies,
        pets,
        notes
      } = args;
      await db.query(
        `UPDATE clients SET
          company_id = ?, name = ?, contact_name = ?, contact_phone = ?, contact_email = ?, address = ?, zip_code = ?, city = ?, country = ?,
          service_type = ?, home_size = ?, frequency = ?, number_of_rooms = ?, number_of_bathrooms = ?, access_instructions = ?,
          priority_areas = ?, special_instructions = ?, allergies = ?, pets = ?, notes = ?
          WHERE id = ?`,
        [company_id, name, contact_name, contact_phone, contact_email, address, zip_code, city, country,
         service_type, home_size, frequency, number_of_rooms, number_of_bathrooms, access_instructions,
         priority_areas, special_instructions, allergies, pets, notes, id]
      );
      const [rows]: any = await db.query("SELECT * FROM clients WHERE id = ?", [id]);
      return rows[0];
    },
    async deleteClient(parent: any, { id }: { id: number }): Promise<boolean> {
      const [result]: any = await db.query("DELETE FROM clients WHERE id = ?", [id]);
      return result.affectedRows > 0;
    }
  }
};
