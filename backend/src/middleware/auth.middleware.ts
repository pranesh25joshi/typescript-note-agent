import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/auth/jwt.js"; 

export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized: No tokens provided" 
        });
    }

    try {
        if (accessToken) {
            const decoded = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET as string
            ) as { id: string };

            req.user = { id: decoded.id };
            return next();
        }
    } catch (error) {
        
    }

    if (!refreshToken) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized: Session expired" 
        });
    }

    try {
        const decodedRefresh = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
        ) as { id: string };

        const newAccessToken = generateAccessToken(decodedRefresh.id);

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 15 * 60 * 1000
        });

        req.user = { id: decodedRefresh.id };
        return next();

    } catch (refreshError) {
        return res.status(403).json({ 
            success: false, 
            message: "Forbidden: Session completely expired. Please log in again." 
        });
    }
};