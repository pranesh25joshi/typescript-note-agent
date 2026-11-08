import { Request, Response } from "express"
import {prisma} from "../lib/prisma.js"

import { UpdateUserInput } from "../validations/user.schema.js"

export const getUserInfoById = async (userId : string)=>{
    // business logic to interact with db
    const user = await prisma.user.findUnique({
        where:{
            id:userId,
        },
        select:{
            id:true,
            name:true,
            email:true,
            createdAt:true
        }
    })
    return user;
}

export const getUserInfoByEmail = async (email: string) => {
    return await prisma.user.findUnique({
        where: { 
            email
        },
        select:{
            id:true,
            name:true,
            email:true,
            createdAt:true
        }
    });
};

export const updateUserInfo = async (userId : string , data:UpdateUserInput)=>{
    // business logic
}