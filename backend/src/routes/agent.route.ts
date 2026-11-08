import { chatWithAgent } from "../controllers/agent.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { sendMessageSchema } from "../validations/message.schema.js";


export const agentRouter = Router();

agentRouter.post("/chat", validate(sendMessageSchema), verifyJwt, chatWithAgent);