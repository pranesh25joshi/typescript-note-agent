import z from "zod";

export const updateNoteSchema = z
  .object({
    content: z.string().min(1, "content must have min 1 character").trim().optional(),
    isCompleted: z.boolean().optional(),
  })
  .strict()
  .refine((data) => data.content !== undefined || data.isCompleted !== undefined, {
    message: "provide content or isCompleted to update",
  });

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
