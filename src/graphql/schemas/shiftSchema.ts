export const shiftTypeDefs = `
  type Shift {
    id: ID!
    employee_id: ID!
    date: String!
    start_time: String!
    end_time: String!
    hourly_rate: Float!
  }

  extend type Mutation {
    addShift(employee_id: ID!, date: String!, start_time: String!, end_time: String!, hourly_rate: Float!): Shift
    updateShift(id: ID!, date: String!, start_time: String!, end_time: String!, hourly_rate: Float!): Shift
    deleteShift(id: ID!): Boolean
  }

  extend type Query {
    shiftsByEmployee(employee_id: ID!): [Shift!]!
  }
`;
