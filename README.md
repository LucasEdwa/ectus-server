# Ectus Server - Employee Management System

A comprehensive employee management system built with Node.js, TypeScript, GraphQL, and MySQL. This system handles employee data, shift management, payroll generation, expense tracking, and more.

## Features

- **User Management**: Registration, authentication with JWT tokens
- **Company Management**: Multi-tenant support with company-specific data
- **Employee Management**: Role-based access (employee, leader, finance, hr)
- **Shift Management**: Track employee work hours and rates
- **Payroll System**: Generate PDF payslips with Swedish tax calculations (28.8%)
- **Expense Management**: Track company expenses with categories and bills
- **Bill Management**: Detailed bill tracking linked to expenses

## Tech Stack

- **Backend**: Node.js with TypeScript
- **API**: GraphQL with express-graphql
- **Database**: MySQL with mysql2
- **Authentication**: JWT tokens with bcrypt password hashing
- **PDF Generation**: PDFKit for payslip generation
- **Environment**: dotenv for configuration

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ectus-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ecstus
   DB_PORT=3306
   JWT_SECRET=your_super_secret_key
   ```

4. **Set up MySQL database**
   - Create a MySQL database named `ecstus`
   - The application will automatically create all required tables on startup

5. **Start the server**
   ```bash
   npm run dev
   ```

6. **Access GraphQL Playground**
   Open your browser and go to `http://localhost:4000/graphql`

## Database Schema

### Core Tables
- **companies**: Company information (name, org_number, address, VAT, etc.)
- **users**: Employee data with role-based access
- **shifts**: Work shift records with hours and rates
- **paylists**: Generated payroll records with PDF links
- **expenses**: Company expense tracking
- **expense_categories**: Categorization for expenses
- **bills**: Detailed bill information linked to expenses

## API Usage

### Authentication

**Register a new user:**
```graphql
mutation {
  register(
    name: "John Doe"
    email: "john@company.com"
    password: "password123"
    role: "employee"
    company_id: 1
  ) {
    message
  }
}
```

**Login:**
```graphql
mutation {
  login(email: "john@company.com", password: "password123") {
    token
  }
}
```

### Company Management

**Create a company:**
```graphql
mutation {
  createCompany(
    name: "Ecstus Global Solutions"
    org_number: "556677-8899"
    address: "Main Street 1"
    zip_code: "12345"
    city: "Stockholm"
    country: "Sweden"
    phone: "010-1234567"
    email: "info@ecstus.com"
    vat_number: "SE556677889901"
  ) {
    id
    name
  }
}
```

### Shift Management

**Add a work shift:**
```graphql
mutation {
  addShift(
    employee_id: 2
    date: "2024-06-17"
    start_time: "08:00:00"
    end_time: "12:00:00"
    hourly_rate: 25.0
  ) {
    id
  }
}
```

### Payroll Generation

**Generate paylist (requires finance role):**
```graphql
mutation {
  addPaylist(
    employee_id: 2
    month: "2024-06-01"
    pdf_url: ""
  ) {
    id
    employee_id
    month
    pdf_url
  }
}
```

### Expense Management

**Create expense category:**
```graphql
mutation {
  createExpenseCategory(
    company_id: 1
    name: "Office Supplies"
    description: "Pens, paper, etc."
  ) {
    id
    name
  }
}
```

**Create an expense:**
```graphql
mutation {
  createExpense(
    company_id: 1
    user_id: 3
    category_id: 1
    description: "Office Supplies"
    amount: 150.50
    expense_date: "2024-06-20"
  ) {
    id
    description
    amount
  }
}
```

**Create a bill:**
```graphql
mutation {
  createBill(
    expense_id: 1
    bill_number: "INV-2024-001"
    bill_date: "2024-06-21"
    due_date: "2024-07-21"
    supplier: "Office Depot"
    amount: 150.50
    vat: 36.12
    file_url: "https://example.com/bills/inv-2024-001.pdf"
  ) {
    id
    bill_number
    supplier
  }
}
```

## User Roles

- **employee**: Basic access to own data
- **leader**: Can manage shifts and employee schedules
- **finance**: Can generate payrolls and manage expenses
- **hr**: Human resources management

## PDF Payslips

The system automatically generates professional PDF payslips including:
- Complete company information (except banking details)
- Employee details
- Work hours breakdown
- Gross salary calculation
- Swedish tax deduction (28.8%)
- Net salary after taxes

## Project Structure

```
src/
├── graphql/
│   ├── resolvers/       # GraphQL resolvers
│   └── schemas/         # GraphQL type definitions
├── models/              # Database models and table creation
├── utils/               # Utility functions (PDF generation, etc.)
└── index.ts            # Main server file
```

## Development

**Run in development mode:**
```bash
npm run dev
```

**Available Scripts:**
- `npm run dev`: Start development server with auto-reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `password` |
| `DB_NAME` | Database name | `ecstus` |
| `DB_PORT` | MySQL port | `3306` |
| `JWT_SECRET` | JWT signing secret | `your_secret_key` |
| `PORT` | Server port | `4000` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
