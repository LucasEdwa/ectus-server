export const shiftTypeDefs = `
  type Shift {
    id: ID!
    employee_id: ID!
    date: String!
    start_time: String!
    end_time: String!
    break_duration: String
    hourly_rate: Float!
    total_hours: Float
    created_at: String
  }

  extend type Mutation {
    addShift(
      employee_id: ID!
      date: String!
      start_time: String!
      end_time: String!
      hourly_rate: Float!
      break_duration: String
    ): Shift
    updateShift(
      id: ID!
      date: String!
      start_time: String!
      end_time: String!
      hourly_rate: Float!
      break_duration: String
    ): Shift
    deleteShift(id: ID!): Boolean
  }

  extend type Query {
    shiftsByEmployee(employee_id: ID!): [Shift!]!
  }
`;
