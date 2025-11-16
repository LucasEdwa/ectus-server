export const documentTypeDefs = `
  type Document {
    id: ID!
    employee_id: Int!
    company_id: Int!
    document_type: String!
    title: String!
    description: String
    file_url: String!
    file_name: String!
    file_size: Int!
    mime_type: String!
    uploaded_at: String!
    expires_at: String
    is_active: Boolean!
    employee_name: String
    employee_email: String
  }

  input CreateDocumentInput {
    employee_id: Int!
    document_type: String!
    title: String!
    description: String
    file_url: String!
    file_name: String!
    file_size: Int!
    mime_type: String!
    expires_at: String
  }

  input UpdateDocumentInput {
    id: Int!
    title: String
    description: String
    document_type: String
    expires_at: String
    is_active: Boolean
  }

  extend type Query {
    documentsByEmployee(employee_id: Int!): [Document!]!
    documentsByCompany(company_id: Int!): [Document!]!
    documentById(id: Int!): Document
    allDocuments: [Document!]!
  }

  extend type Mutation {
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(input: UpdateDocumentInput!): Document!
    deleteDocument(id: Int!): Boolean!
  }
`;
