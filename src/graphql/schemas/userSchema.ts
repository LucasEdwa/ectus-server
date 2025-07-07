export const userTypeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    company_id: Int
    created_at: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User!]!
    roles: [String!]!
    me: User
  }

  type Mutation {
    signup(
      name: String!
      email: String!
      password: String!
      role: String!
      company_id: Int
    ): AuthPayload!
    
    login(
      email: String!
      password: String!
    ): AuthPayload!
  }
`;

