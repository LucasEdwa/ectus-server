export const authTypeDefs = `
  type AuthPayload {
    token: String
  }

  type RegisterResponse {
    message: String
  }

  extend type Mutation {
    register(name: String!, email: String!, password: String!, role: String!): RegisterResponse
    login(email: String!, password: String!): AuthPayload
  }
`;
