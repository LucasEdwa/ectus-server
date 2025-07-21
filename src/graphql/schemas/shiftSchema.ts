export const shiftTypeDefs = `
  type Shift {
    id: ID!
    employee_id: ID!
    client_id: ID
    date: String!
    start_time: String!
    end_time: String!
    break_duration: String
    hourly_rate: Float!
    total_hours: Float
    created_at: String
    user_id: ID
    client_name: String
    contact_name: String
    contact_phone: String
    contact_email: String
    address: String
    zip_code: String
    city: String
    country: String
    service_type: String
    home_size: String
    frequency: String
    number_of_rooms: String
    number_of_bathrooms: String
    access_instructions: String
    priority_areas: String
    special_instructions: String
    allergies: String
    pets: String
    notes: String
  }

  extend type Mutation {
    addShift(
      employee_id: ID!
      client_id: ID
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
