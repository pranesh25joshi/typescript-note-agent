import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getNotes, updateNoteController } from "../controllers/note.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateNoteSchema } from "../validations/note.schema.js";

export const noteRouter = Router();

noteRouter.get("/", verifyJwt, getNotes);
noteRouter.patch("/:id", verifyJwt, validate(updateNoteSchema), updateNoteController);
