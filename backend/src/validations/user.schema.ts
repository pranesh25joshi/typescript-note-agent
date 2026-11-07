import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export type UpdateUserInput = z.infer<typeof updateUserSchema>;