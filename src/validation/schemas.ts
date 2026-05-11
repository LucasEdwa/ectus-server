import { z } from "zod";

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

const timeLike = z
  .string()
  .trim()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Expected HH:MM or HH:MM:SS");

function optionalPositiveInt() {
  return z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    z.coerce.number().int().positive().optional()
  );
}

function optionalString(max: number) {
  return z.preprocess(
    (v) => (v === null || v === undefined ? undefined : String(v)),
    z.string().trim().max(max)
  ).optional();
}

export const userRoleSchema = z.enum(["employee", "leader", "finance", "hr"]);

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email").max(320),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: userRoleSchema,
  company_id: optionalPositiveInt(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
  password: z.string().min(1, "Password is required").max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, "Refresh token is required"),
});

export const createExpenseSchema = z.object({
  company_id: z.coerce.number().int().positive(),
  user_id: optionalPositiveInt(),
  category_id: optionalPositiveInt(),
  description: z.string().trim().min(1).max(255),
  amount: z.coerce.number().finite().nonnegative().max(1e10),
  expense_date: isoDate,
});

export const updateExpenseSchema = z.object({
  id: z.coerce.number().int().positive(),
  company_id: z.coerce.number().int().positive(),
  user_id: optionalPositiveInt(),
  category_id: optionalPositiveInt(),
  description: z.string().trim().min(1).max(255),
  amount: z.coerce.number().finite().nonnegative().max(1e10),
  expense_date: isoDate,
});

export const expenseIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const expenseCompanyFilterSchema = z.object({
  company_id: optionalPositiveInt(),
});

export const expenseCategoryCreateSchema = z.object({
  company_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  description: optionalString(1000),
});

export const expenseCategoryUpdateSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    name: z
      .preprocess(
        (v) => (v === null || v === undefined ? undefined : v),
        z.string().trim().min(1).max(200)
      )
      .optional(),
    description: optionalString(1000),
  })
  .refine((v) => v.name !== undefined || v.description !== undefined, {
    message: "Provide name or description to update",
  });

export const expenseCategoryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const shiftMutationSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  client_id: optionalPositiveInt(),
  date: isoDate,
  start_time: timeLike,
  end_time: timeLike,
  hourly_rate: z.coerce.number().finite().positive().max(1e7),
  break_duration: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    timeLike.optional()
  ),
});

export const shiftUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  date: isoDate,
  start_time: timeLike,
  end_time: timeLike,
  hourly_rate: z.coerce.number().finite().positive().max(1e7),
  break_duration: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    timeLike.optional()
  ),
});

export const shiftDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const shiftsByEmployeeSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
});

export const clientsByDateSchema = z.object({
  company_id: z.coerce.number().int().positive(),
  date: isoDate,
});

export const createClientFlatSchema = z.object({
  company_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  contact_name: optionalString(200),
  contact_phone: optionalString(64),
  contact_email: z
    .preprocess(
      (v) => (v === null || v === undefined || v === "" ? undefined : v),
      z.string().trim().email().max(320)
    )
    .optional(),
  address: optionalString(255),
  zip_code: optionalString(32),
  city: optionalString(128),
  country: optionalString(128),
  service_type: optionalString(200),
  home_size: optionalString(120),
  frequency: optionalString(120),
  number_of_rooms: optionalString(64),
  number_of_bathrooms: optionalString(64),
  access_instructions: optionalString(500),
  priority_areas: optionalString(500),
  special_instructions: optionalString(500),
  allergies: optionalString(255),
  pets: optionalString(255),
  notes: optionalString(2000),
});

export const updateClientFlatSchema = createClientFlatSchema.extend({
  id: z.coerce.number().int().positive(),
});

export const clientIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const companyQueryIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  org_number: z.string().trim().min(1).max(64),
  address: z.string().trim().min(1).max(255),
  zip_code: z.string().trim().min(1).max(32),
  city: z.string().trim().min(1).max(128),
  country: z.string().trim().min(1).max(128),
  phone: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
  email: z.union([z.string().trim().email().max(320), z.literal(""), z.null()]).optional(),
  bankgiro: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
  plusgiro: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
  vat_number: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
});

export const updateCompanySchema = z
  .object({
    id: z.coerce.number().int().positive(),
    name: z.union([z.string().trim().min(1).max(200), z.literal("")]).optional(),
    org_number: z.union([z.string().trim().min(1).max(64), z.literal("")]).optional(),
    address: z.union([z.string().trim().min(1).max(255), z.literal("")]).optional(),
    zip_code: z.union([z.string().trim().min(1).max(32), z.literal("")]).optional(),
    city: z.union([z.string().trim().min(1).max(128), z.literal("")]).optional(),
    country: z.union([z.string().trim().min(1).max(128), z.literal("")]).optional(),
    phone: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
    email: z.union([z.string().trim().email().max(320), z.literal(""), z.null()]).optional(),
    bankgiro: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
    plusgiro: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
    vat_number: z.union([z.string().trim().max(64), z.literal(""), z.null()]).optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.org_number !== undefined ||
      v.address !== undefined ||
      v.zip_code !== undefined ||
      v.city !== undefined ||
      v.country !== undefined ||
      v.phone !== undefined ||
      v.email !== undefined ||
      v.bankgiro !== undefined ||
      v.plusgiro !== undefined ||
      v.vat_number !== undefined,
    { message: "Provide at least one field to update" }
  );

const documentTypes = z.enum(["contract", "certification", "identification", "other"]);

const fileUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (s) => /^https?:\/\//i.test(s) || s.startsWith("/"),
    "Must be an http(s) URL or a path starting with /"
  );

export const createDocumentInputSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  document_type: documentTypes,
  title: z.string().trim().min(1).max(200),
  description: z.union([z.string().trim().max(2000), z.literal(""), z.null()]).optional(),
  file_url: fileUrlSchema,
  file_name: z.string().trim().min(1).max(255),
  file_size: z.coerce.number().int().nonnegative().max(52_428_800),
  mime_type: z.string().trim().min(1).max(128),
  expires_at: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    isoDate.optional()
  ),
});

export const updateDocumentInputSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    title: z.union([z.string().trim().min(1).max(200), z.literal("")]).optional(),
    description: z.union([z.string().trim().max(2000), z.literal(""), z.null()]).optional(),
    document_type: documentTypes.optional(),
    expires_at: z.preprocess(
      (v) => (v === null || v === undefined || v === "" ? undefined : v),
      isoDate.optional()
    ),
    is_active: z.coerce.boolean().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.document_type !== undefined ||
      v.expires_at !== undefined ||
      v.is_active !== undefined,
    { message: "Provide at least one field to update" }
  );

export const documentIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const documentsByEmployeeSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
});

export const documentsByCompanySchema = z.object({
  company_id: z.coerce.number().int().positive(),
});
