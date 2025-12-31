export const shiftTrackingSchema = `
  type ShiftTracking {
    id: ID!
    employee_id: Int!
    start_time: String!
    end_time: String
    on_break: Boolean!
    break_start: String
    break_end: String
    total_break_time: Int!
    total_worked_time: Int!
    break_count: Int!
    shift_status: String!
    created_at: String!
  }

  extend type Query {
    getCurrentShift: ShiftTracking
    getShiftHistory(limit: Int): [ShiftTracking!]!
  }

  extend type Mutation {
    startShiftTracking(start_time: String!): ShiftTracking!
    stopShiftTracking(id: Int!, end_time: String!, total_worked_time: Int!, shift_status: String!): ShiftTracking!
    updateShiftTracking(
      id: Int!
      on_break: Boolean
      break_start: String
      break_end: String
      total_break_time: Int
      break_count: Int
      shift_status: String
    ): ShiftTracking!
  }
`;