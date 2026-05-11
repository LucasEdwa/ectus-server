import express from "express";
import dotenv from "dotenv";
import cors, { type CorsOptions } from "cors";
import { initAllTables } from "./models/initAllTables";
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
import{ clientResolvers}   from "./graphql/resolvers/clientResolver";
import { clientTypeDefs } from "./graphql/schemas/clientSchema";
import { documentResolvers } from "./graphql/resolvers/documentResolver";
import { documentTypeDefs } from "./graphql/schemas/documentSchema";
import { timeBalanceResolvers } from "./graphql/resolvers/timeBalanceResolver";
import { timeBalanceSchema } from "./graphql/schemas/timeBalanceSchema";
import { shiftTrackingResolvers } from "./graphql/resolvers/shiftTrackingResolver";
import { shiftTrackingSchema } from "./graphql/schemas/shiftTrackingSchema";
import { reportTypeDefs } from "./graphql/schemas/reportSchema";
import { reportResolvers } from "./graphql/resolvers/reportResolver";
import playground from 'graphql-playground-middleware-express';

import { contextFunction } from "./graphql/context";
import { fixPaylistPaths } from "./migrations/fixPaylistPaths";
import { checkDatabaseTimezone } from "./models/db";
import { getConnectionInfo } from "./utils/networkUtils";
import systemRoutes from "./routes/systemRoutes";
import secureFileRoutes from "./routes/secureFileRoutes";
import { assertJwtConfigured } from "./middleware/jwtAuth";
import { runPendingSqlMigrations } from "./db/runPendingSqlMigrations";

dotenv.config();
assertJwtConfigured();

const enableGraphiQL =
  process.env.NODE_ENV !== "production" && process.env.DISABLE_GRAPHIQL !== "1";

function corsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGIN ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length > 0) {
    return { origin: list, credentials: true };
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[CORS] CORS_ORIGIN is unset in production; cross-origin browser requests will be denied. Set CORS_ORIGIN to a comma-separated allowlist."
    );
    return { origin: false, credentials: true };
  }
  return { origin: true, credentials: true };
}

const app = express();
app.use(express.json());
app.use(cors(corsOptions()));

/** PDFs and uploads — require JWT (same paths as stored file_url / pdf_url) */
app.use(secureFileRoutes);

// Upload route
import uploadRoutes from "./routes/uploadRoutes";
app.use('/api', uploadRoutes);

// System routes (connection info, health check)  
app.use("/api/system", systemRoutes);

const PORT = Number(process.env.PORT) || 4000;

// Combine typeDefs as SDL string - userTypeDefs MUST come first to define base Query/Mutation
const typeDefs = `
${userTypeDefs}
${shiftTypeDefs}
${paylistTypeDefs}
${companyTypeDefs}
${expenseTypeDefs}
${expenseCategoryTypeDefs}
${clientTypeDefs}
${documentTypeDefs}
${timeBalanceSchema}
${shiftTrackingSchema}
${reportTypeDefs}

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
    ...(clientResolvers.Query || {}),
    ...(documentResolvers.Query || {}),
    ...(timeBalanceResolvers.Query || {}),
    ...(shiftTrackingResolvers.Query || {}),
    ...(reportResolvers.Query || {}),
  },
  Mutation: {
    ...(userResolvers.Mutation || {}),
    ...(shiftResolvers.Mutation || {}),
    ...(paylistResolvers.Mutation || {}),
    ...(companyResolvers.Mutation || {}),
    ...(expenseResolvers.Mutation || {}),
    ...(expenseCategoryResolvers.Mutation || {}),
    ...(clientResolvers.Mutation || {}),
    ...(documentResolvers.Mutation || {}),
    ...(timeBalanceResolvers.Mutation || {}),
    ...(shiftTrackingResolvers.Mutation || {}),
    ...(reportResolvers.Mutation || {}),
  },
  Document: documentResolvers.Document,
  TimeBalance: timeBalanceResolvers.TimeBalance,
  // no type extension for Report currently
};

(async () => {

  await checkDatabaseTimezone(); // Check database timezone settings
  await initAllTables(); // Then initialize tables
  await runPendingSqlMigrations();
  await removeCategoryColumnIfExists();
  await fixPaylistPaths(); // Fix existing paylist paths

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });


  app.use(
    "/graphql",
    graphqlHTTP((req, res, params) => {
     
      return {
        schema,
        graphiql: enableGraphiQL,
        context: contextFunction({ req }),
      
      };
    })
  );
  if (enableGraphiQL) {
    app.get("/playground", playground({ endpoint: "/graphql" }));
  }
  app.listen(PORT, "0.0.0.0", () => {
    const connectionInfo = getConnectionInfo(PORT);
    
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Local: ${connectionInfo.graphql.localhost}`);
    
    if (connectionInfo.graphql.localNetwork) {
      console.log(`🌐 Network: ${connectionInfo.graphql.localNetwork}`);
      console.log(`📱 Mobile apps should use: ${connectionInfo.graphql.localNetwork}`);
    } else {
      console.log(`⚠️  Could not detect network IP. Mobile apps might need manual configuration.`);
    }
    
    console.log(`🔍 Connection info available at: ${connectionInfo.localhost}/api/system/connection-info`);
  });
})();
