import { gql } from 'apollo-server-express';

export const clientTypeDefs = `
  type Client {
    id: ID!
    company_id: ID!
    name: String!
    contact_name: String
    contact_phone: String
    contact_email: String
    address: String
    zip_code: String
    city: String
    country: String
    service_type: String
    home_size: String
    frequency: String
    number_of_rooms: String
    number_of_bathrooms: String
    access_instructions: String
    priority_areas: String
    special_instructions: String
    allergies: String
    pets: String
    notes: String
  }

  input CreateClientInput {
    company_id: ID!
    name: String!
    contact_name: String
    contact_phone: String
    contact_email: String
    address: String
    zip_code: String
    city: String
    country: String
    service_type: String
    home_size: String
    frequency: String
    number_of_rooms: String
    number_of_bathrooms: String
    access_instructions: String
    priority_areas: String
    special_instructions: String
    allergies: String
    pets: String
    notes: String
  }

  input UpdateClientInput {
    id: ID!
    company_id: ID!
    name: String!
    contact_name: String
    contact_phone: String
    contact_email: String
    address: String
    zip_code: String
    city: String
    country: String
    service_type: String
    home_size: String
    frequency: String
    number_of_rooms: String
    number_of_bathrooms: String
    access_instructions: String
    priority_areas: String
    special_instructions: String
    allergies: String
    pets: String
    notes: String
  }

  type Query {
    clients(company_id: ID!): [Client!]!
    client(id: ID!): Client
  }

  type Mutation {
    createClient(
      company_id: ID!
      name: String!
      contact_name: String
      contact_phone: String
      contact_email: String
      address: String
      zip_code: String
      city: String
      country: String
      service_type: String
      home_size: String
      frequency: String
      number_of_rooms: String
      number_of_bathrooms: String
      access_instructions: String
      priority_areas: String
      special_instructions: String
      allergies: String
      pets: String
      notes: String
    ): Client!
    updateClient(
      id: ID!
      company_id: ID!
      name: String!
      contact_name: String
      contact_phone: String
      contact_email: String
      address: String
      zip_code: String
      city: String
      country: String
      service_type: String
      home_size: String
      frequency: String
      number_of_rooms: String
      number_of_bathrooms: String
      access_instructions: String
      priority_areas: String
      special_instructions: String
      allergies: String
      pets: String
      notes: String
    ): Client!
    deleteClient(id: ID!): Boolean!
  }
`;
