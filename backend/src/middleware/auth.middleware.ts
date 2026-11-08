import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"


export const verifyJwt = async (req:Request, res:Response, next : NextFunction) =>{
   try {
    
        const token = req.cookies.accessToken;

        if(!token){
            return res.status(401).json({
                success:false,
                message:"Unauthorized: No token provided"
            })
        }

        const decoded_user_Id = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string,
        )as {id : string}

        req.user = {id : decoded_user_Id.id};
        next();
        
   } catch (error) {
    console.log(`their is an error in verfiyjwt middleware -> ${error}`);
    return res.status(403).json({
        success:false,
        message : "error in verifying jwtmiddleware",
        error : error
    })
   }
}