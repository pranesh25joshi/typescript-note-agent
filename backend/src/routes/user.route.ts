import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getProfile } from "../controllers/user.controller.js";



export const userRouter = Router();

userRouter.get("/me", verifyJwt, getProfile )