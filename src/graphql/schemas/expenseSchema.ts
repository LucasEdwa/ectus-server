export const expenseTypeDefs = `
  type Expense {
    id: ID!
    company_id: ID!
    user_id: ID
    category_id: ID
    description: String!
    amount: Float!
    expense_date: String!
    category: String
    created_at: String
  }

  extend type Query {
    expenses(company_id: ID): [Expense!]!
    expense(id: ID!): Expense
  }

  extend type Mutation {
    createExpense(
      company_id: ID!
      user_id: ID
      category_id: ID
      description: String!
      amount: Float!
      expense_date: String!
      category: String
    ): Expense
  }
`;
