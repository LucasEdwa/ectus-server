export const userTypeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type Query {
    users: [User!]!
    roles: [String!]!
  }

  type Mutation {
    _: Boolean
  }
`;
