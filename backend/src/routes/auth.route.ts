import { Router } from "express";
import { registerUserController, loginUserController, logoutUserController } from "../controllers/auth.controller.js";
import {validate} from "../middleware/validate.middleware.js"
import { loginUserSchema, registerUserSchema} from "../validations/auth.schema.js"
import { verifyJwt } from "../middleware/auth.middleware.js";
export const  authRouter = Router();

authRouter.post("/register",validate(registerUserSchema),registerUserController);
authRouter.post("/login", validate(loginUserSchema), loginUserController);
authRouter.post("/logout", verifyJwt, logoutUserController);