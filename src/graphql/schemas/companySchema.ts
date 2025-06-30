export const companyTypeDefs = `
  type Company {
    id: ID!
    name: String!
    org_number: String!
    address: String!
    zip_code: String!
    city: String!
    country: String!
    phone: String
    email: String
    bankgiro: String
    plusgiro: String
    vat_number: String
    created_at: String
  }

  extend type Query {
    companies: [Company!]!
    company(id: ID!): Company
  }

  extend type Mutation {
    createCompany(
      name: String!
      org_number: String!
      address: String!
      zip_code: String!
      city: String!
      country: String!
      phone: String
      email: String
      bankgiro: String
      plusgiro: String
      vat_number: String
    ): Company
    updateCompany(
      id: ID!
      name: String
      org_number: String
      address: String
      zip_code: String
      city: String
      country: String
      phone: String
      email: String
      bankgiro: String
      plusgiro: String
      vat_number: String
    ): Company
    deleteCompany(id: ID!): Boolean
  }
`;
