import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listUserNotes, updateNote } from "../services/note.service.js";
import { updateNoteSchema } from "../validations/note.schema.js";

export const getNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notes = await listUserNotes(req.user!.id);
    return res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.log(`error in getNotes controller -> ${error}`);
    next(error);
  }
};

export const updateNoteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = updateNoteSchema.parse(req.body);
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const note = await updateNote(
      req.user!.id,
      noteId,
      validatedData.content,
      validatedData.isCompleted
    );

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found or unauthorized")) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized",
      });
    }

    console.log(`error in updateNoteController -> ${error}`);
    next(error);
  }
};
