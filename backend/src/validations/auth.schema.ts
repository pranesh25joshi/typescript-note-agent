import z from "zod"

export const registerUserSchema = z.object({
    name:z.string().min(1, "name must have min 1 character"),
    email : z.email(),
    password: z.string().min(2, "password must have min 2 charcters")
}).strict()



export const loginUserSchema = z.object({
    email : z.email(),
    password: z.string().min(2, "password must have min 2 charcters")
}).strict()

export type RegisterInput = z.infer<typeof registerUserSchema>
export type LoginInput = z.infer<typeof loginUserSchema>