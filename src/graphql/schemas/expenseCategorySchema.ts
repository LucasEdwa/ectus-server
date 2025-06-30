export const expenseCategoryTypeDefs = `
  type ExpenseCategory {
    id: ID!
    company_id: ID!
    name: String!
    description: String
    created_at: String
  }

  extend type Query {
    expenseCategories(company_id: ID): [ExpenseCategory!]!
    expenseCategory(id: ID!): ExpenseCategory
  }

  extend type Mutation {
    createExpenseCategory(company_id: ID!, name: String!, description: String): ExpenseCategory
    updateExpenseCategory(id: ID!, name: String, description: String): ExpenseCategory
    deleteExpenseCategory(id: ID!): DeleteResponse
  }

  type DeleteResponse {
    message: String!
  }
`;
