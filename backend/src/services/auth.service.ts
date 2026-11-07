import { registerUserSchema, loginUserSchema } from "../validations/auth.schema.js";
import { RegisterInput , LoginInput } from "../validations/auth.schema.js"

import { PrismaClient } from "@prisma/client";
import { hashedPassword, comparePassword } from "../utils/auth/hash.js";
import { generateAccessToken, generateRefreshToken } from "../utils/auth/jwt.js";
import { getUserInfo } from "./user.service.js";

const prisma = new PrismaClient();

export const registerUser = async (data : RegisterInput)=>{
    // business logic
    const hashed = await hashedPassword(data.password);
    
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashed
        }
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };

}

export const loginUser = async (data: LoginInput) => {
    // business logic
    const user = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
};