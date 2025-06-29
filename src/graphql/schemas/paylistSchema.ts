export const paylistTypeDefs = `
  type Paylist {
    id: ID!
    employee_id: ID!
    month: String!
    pdf_url: String!
  }

  extend type Query {
    paylistsByEmployee(employee_id: ID!): [Paylist!]!
  }

  extend type Mutation {
    addPaylist(employee_id: ID!, month: String!, pdf_url: String!): Paylist
  }
`;
