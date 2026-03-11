export const reportTypeDefs = `
  type Report {
    id: ID!
    client_id: Int!
    author_id: Int!
    date: String!
    content: String!
    created_at: String!
  }

  type Query {
    reportsByClient(client_id: Int!): [Report!]!
    reportsByDate(date: String!): [Report!]!
  }

  type Mutation {
    addReport(
      client_id: Int!
      date: String!
      content: String!
    ): Report!
  }
`;
