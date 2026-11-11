import z, { success } from "zod";

import {registerUser, loginUser} from "../services/auth.service.js"
import { NextFunction, Request, Response } from "express";
import { getUserInfoByEmail } from "../services/user.service.js";
import { hashedPassword } from "../utils/auth/hash.js";

const isProduction = process.env.NODE_ENV === "production";

// In production the frontend (Vercel) and API (Render) are different sites,
// so cookies need SameSite=None + Secure to survive cross-site requests.
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "strict") as "none" | "strict",
};

export const registerUserController = async (req:Request, res:Response, next: NextFunction)=>{
    try {
        const { name, email, password } = req.body;

        const existingUser = await getUserInfoByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }
        const {user, accessToken, refreshToken} = await registerUser({ name, email, password });

        res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

        return res.status(201).json({
            success: true,
            message: "User has been created",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.log(`this is the error in registerUserController -> ${error}`)
        next(error);
    }
}

export const loginUserController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Pass to service to verify user and password, and generate tokens
        const { user, accessToken, refreshToken } = await loginUser({ email, password });

        res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); 
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); 

        req.user = {
                id: user.id,
            }

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(`Error in loginUserController ->`, error);
        next(error);
    }
};


export const logoutUserController = async (req:Request, res:Response, next : NextFunction) =>{
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.status(200).json({
            success:true,
            message : "loggout successful",
        })

    } catch (error) {
        console.log(`error in logging out the user in logoutUserController -> ${error}`);
        return res.status(500).json({
            success:false,
            message:"Internal server error, logout user error in logoutUserController",
            error : error
        })
    }
}