export const timeBalanceSchema = `
  type TimeBalance {
    id: ID!
    employee_id: Int!
    flexible_hours: Float!
    time_bank: Float!
    vacation_days: Float!
    comp_time: Float!
    overtime_balance: Float!
    sick_days: Float!
    last_updated: String!
    employee_name: String
    employee_email: String
  }

  input CreateTimeBalanceInput {
    employee_id: Int!
    flexible_hours: Float
    time_bank: Float
    vacation_days: Float
    comp_time: Float
    overtime_balance: Float
    sick_days: Float
  }

  input UpdateTimeBalanceInput {
    flexible_hours: Float
    time_bank: Float
    vacation_days: Float
    comp_time: Float
    overtime_balance: Float
    sick_days: Float
  }

  extend type Query {
    timeBalanceById(id: Int!): TimeBalance
    myTimeBalance: TimeBalance
    timeBalancesByCompany(company_id: Int!): [TimeBalance!]!
  }

  extend type Mutation {
    createTimeBalance(input: CreateTimeBalanceInput!): TimeBalance!
    updateTimeBalance(id: Int!, input: UpdateTimeBalanceInput!): TimeBalance!
    deleteTimeBalance(id: Int!): Boolean!
  }
`;