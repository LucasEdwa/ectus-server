import express from "express";
import dotenv from "dotenv";
import { initAllTables } from "./models/initAllTables";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import { userTypeDefs } from "./graphql/schemas/userSchema";
import { userResolvers } from "./graphql/resolvers/userResolver";
import { authTypeDefs } from "./graphql/schemas/authSchema";
import { authResolvers } from "./graphql/resolvers/authResolver";
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
// import { billTypeDefs } from "./graphql/schemas/billSchema";
// import { billResolvers } from "./graphql/resolvers/billResolver";
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Combine typeDefs as SDL string
const typeDefs = `
${authTypeDefs}
${userTypeDefs}
${shiftTypeDefs}
${paylistTypeDefs}
${companyTypeDefs}
${expenseTypeDefs}
${expenseCategoryTypeDefs}

`;

// Merge resolvers for Query and Mutation
const rootValue = {
  ...(userResolvers.Query || {}),
  ...(authResolvers.Mutation || {}),
  ...(shiftResolvers.Query || {}),
  ...(shiftResolvers.Mutation || {}),
  ...(paylistResolvers.Query || {}),
  ...(paylistResolvers.Mutation || {}),
  ...(companyResolvers.Query || {}),
  ...(companyResolvers.Mutation || {}),
  ...(expenseResolvers.Query || {}),
  ...(expenseResolvers.Mutation || {}),
  ...(expenseCategoryResolvers.Query || {}),
  ...(expenseCategoryResolvers.Mutation || {}),

};

(async () => {
  await initAllTables();
  await removeCategoryColumnIfExists();

  app.use(
    "/graphql",
    graphqlHTTP({
      schema: buildSchema(typeDefs),
      rootValue,
      graphiql: true,
    })
  );

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
})();
