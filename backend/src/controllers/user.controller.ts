import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {prisma} from  "../lib/prisma.js";

import {
  getUserInfo,
  updateUserInfo,
} from "../services/user.service.js";

import { updateUserSchema } from "../validations/user.schema.js";

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getUserInfo(req.user!.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.log(`error in getProfile controller -> ${error}`)
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);

    const user = await updateUserInfo(
      req.user!.id,
      validatedData
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    next(error);
  }
};