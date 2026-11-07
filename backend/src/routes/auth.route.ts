import { Router } from "express";
import { registerUserController, loginUserController } from "../controllers/auth.controller.js";
import {validate} from "../middleware/validate.middleware.js"
import { loginUserSchema, registerUserSchema} from "../validations/auth.schema.js"
export const  userRouter = Router();

userRouter.post("/register",validate(registerUserSchema),registerUserController);
userRouter.post("/login", validate(loginUserSchema), loginUserController);