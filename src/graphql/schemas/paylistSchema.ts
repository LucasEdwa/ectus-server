export const paylistTypeDefs = `
  type Paylist {
    id: ID!
    employee_id: Int!
    company_id: Int!
    month: String!
    pdf_url: String!
    employee_name: String
    employee_email: String
  }
 
  extend type Query {
    paylistsByEmployee(employee_id: ID!): [Paylist!]!
    paylistById(id: ID!): Paylist
  }

  extend type Mutation {
    addPaylist(employee_id: ID!, month: String!): Paylist
    updatePaylist(id: ID!, month: String!): Paylist
  }
`;
