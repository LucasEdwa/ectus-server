export const billTypeDefs = `
  type Bill {
    id: ID!
    expense_id: ID!
    bill_number: String!
    bill_date: String!
    due_date: String
    supplier: String
    amount: Float!
    vat: Float
    file_url: String
    created_at: String
  }

  extend type Query {
    billsByExpense(expense_id: ID!): [Bill!]!
    bill(id: ID!): Bill
  }

  extend type Mutation {
    createBill(
      expense_id: ID!
      bill_number: String!
      bill_date: String!
      due_date: String
      supplier: String
      amount: Float!
      vat: Float
      file_url: String
    ): Bill
  }
`;
