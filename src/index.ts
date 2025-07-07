import express from "express";
import dotenv from "dotenv";
import { dropAllTables, initAllTables } from "./models/initAllTables";
import { graphqlHTTP } from "express-graphql";
import { makeExecutableSchema } from '@graphql-tools/schema';
import { userTypeDefs } from "./graphql/schemas/userSchema";
import { userResolvers } from "./graphql/resolvers/userResolver";
import { shiftTypeDefs } from "./graphql/schemas/shiftSchema";
import { shiftResolvers } from "./graphql/resolvers/shiftResolver";
import { paylistTypeDefs } from "./graphql/schemas/paylistSchema";
import { paylistResolvers } from "./graphql/resolvers/paylistResolver";
import { companyTypeDefs } from "./graphql/schemas/companySchema";
import { companyResolvers } from "./graphql/resolvers/companyResolver";
import { expenseTypeDefs } from "./graphql/schemas/expenseSchema";
import { expenseResolvers } from "./graphql/resolvers/expenseResolver";
import { expenseCategoryTypeDefs } from "./graphql/schemas/expenseCategorySchema";
import { expenseCategoryResolvers } from "./graphql/resolvers/expenseCategoryResolver";
import { removeCategoryColumnIfExists } from "./models/expenseModel";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Combine typeDefs as SDL string - userTypeDefs MUST come first to define base Query/Mutation
const typeDefs = `
${userTypeDefs}
${shiftTypeDefs}
${paylistTypeDefs}
${companyTypeDefs}
${expenseTypeDefs}
${expenseCategoryTypeDefs}

`;

// Create proper resolver map instead of flattened rootValue
const resolvers = {
  Query: {
    ...(userResolvers.Query || {}),
    ...(shiftResolvers.Query || {}),
    ...(paylistResolvers.Query || {}),
    ...(companyResolvers.Query || {}),
    ...(expenseResolvers.Query || {}),
    ...(expenseCategoryResolvers.Query || {}),
  },
  Mutation: {
    ...(userResolvers.Mutation || {}),
    ...(shiftResolvers.Mutation || {}),
    ...(paylistResolvers.Mutation || {}),
    ...(companyResolvers.Mutation || {}),
    ...(expenseResolvers.Mutation || {}),
    ...(expenseCategoryResolvers.Mutation || {}),
  }
};

(async () => {
  await initAllTables(); // Then initialize tables
  await removeCategoryColumnIfExists();

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  app.use(
    "/graphql",
    graphqlHTTP({
      schema,
      graphiql: true,
    })
  );

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
})();
