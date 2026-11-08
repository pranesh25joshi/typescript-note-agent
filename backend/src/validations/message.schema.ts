import z from "zod";


export const sendMessageSchema = z.object({
    prompt : z.string().min(1, "least one character to be send").trim(),

}).strict();

export type MessageInput = z.infer<typeof sendMessageSchema>;